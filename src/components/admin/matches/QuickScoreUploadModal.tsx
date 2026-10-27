import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Check, 
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { matchRepository } from '../../../repositories/matchRepository';
import { activityRepository } from '../../../repositories/activityRepository';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { nativeHaptics, registerBackButtonListener } from '../../../lib/nativeBridge';
import type { Match, GameScore, MatchStatus } from '../../../types';

interface QuickScoreUploadModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated: () => void;
}

export const QuickScoreUploadModal: React.FC<QuickScoreUploadModalProps> = ({
  match,
  isOpen,
  onClose,
  onMatchUpdated,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [status, setStatus] = useState<MatchStatus>('completed');
  const [currentSet, setCurrentSet] = useState<number>(2);

  // Set scores state
  const [set1Team1, setSet1Team1] = useState<number>(29);
  const [set1Team2, setSet1Team2] = useState<number>(24);

  const [set2Team1, setSet2Team1] = useState<number>(25);
  const [set2Team2, setSet2Team2] = useState<number>(29);

  const [includeSet3, setIncludeSet3] = useState<boolean>(false);
  const [set3Team1, setSet3Team1] = useState<number>(29);
  const [set3Team2, setSet3Team2] = useState<number>(22);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing match scores on open
  useEffect(() => {
    if (isOpen && match) {
      setStatus(match.status === 'upcoming' ? 'completed' : match.status);
      setCurrentSet(match.currentSet || 2);

      const s1 = match.setScores?.[0];
      const s2 = match.setScores?.[1];
      const s3 = match.setScores?.[2];

      if (s1) {
        setSet1Team1(s1.team1Score);
        setSet1Team2(s1.team2Score);
      } else {
        setSet1Team1(29);
        setSet1Team2(24);
      }

      if (s2) {
        setSet2Team1(s2.team1Score);
        setSet2Team2(s2.team2Score);
      } else {
        setSet2Team1(24);
        setSet2Team2(29);
      }

      if (s3) {
        setIncludeSet3(true);
        setSet3Team1(s3.team1Score);
        setSet3Team2(s3.team2Score);
      } else {
        // If sets 1 & 2 are tied, automatically enable set 3
        const s1T1Won = (s1?.team1Score || 29) > (s1?.team2Score || 24);
        const s2T1Won = (s2?.team1Score || 24) > (s2?.team2Score || 29);
        setIncludeSet3(s1T1Won !== s2T1Won);
        setSet3Team1(29);
        setSet3Team2(26);
      }
    }
  }, [isOpen, match]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = registerBackButtonListener(() => {
      onClose();
      return true;
    });
    return cleanup;
  }, [isOpen, onClose]);

  if (!isOpen || !match) return null;

  // Calculate sets won
  let t1SetsWon = 0;
  let t2SetsWon = 0;

  if (set1Team1 > set1Team2) t1SetsWon += 1;
  else if (set1Team2 > set1Team1) t2SetsWon += 1;

  if (set2Team1 > set2Team2) t1SetsWon += 1;
  else if (set2Team2 > set2Team1) t2SetsWon += 1;

  if (includeSet3) {
    if (set3Team1 > set3Team2) t1SetsWon += 1;
    else if (set3Team2 > set3Team1) t2SetsWon += 1;
  }

  const determinedWinner = t1SetsWon > t2SetsWon ? match.team1 : t2SetsWon > t1SetsWon ? match.team2 : null;

  const handleScoreAdjust = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number = 0,
    max: number = 39
  ) => {
    nativeHaptics.impact('light');
    setter((prev) => Math.max(min, Math.min(max, prev + delta)));
  };

  const handleSaveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Validate scores
      if (set1Team1 === set1Team2) {
        throw new Error('Set 1 cannot end in a draw under BBFI rules.');
      }
      if (set2Team1 === set2Team2) {
        throw new Error('Set 2 cannot end in a draw under BBFI rules.');
      }
      if (includeSet3 && set3Team1 === set3Team2) {
        throw new Error('Set 3 cannot end in a draw under BBFI rules.');
      }

      // Check if Set 3 is required
      const isTiedAfterTwoSets = (set1Team1 > set1Team2) !== (set2Team1 > set2Team2);
      if (isTiedAfterTwoSets && !includeSet3 && status === 'completed') {
        throw new Error('Matches tied at 1-1 sets require a 3rd deciding set to complete.');
      }

      const compiledSetScores: GameScore[] = [
        {
          gameNumber: 1,
          team1Score: set1Team1,
          team2Score: set1Team2,
          isCompleted: true,
        },
        {
          gameNumber: 2,
          team1Score: set2Team1,
          team2Score: set2Team2,
          isCompleted: true,
        },
      ];

      if (includeSet3) {
        compiledSetScores.push({
          gameNumber: 3,
          team1Score: set3Team1,
          team2Score: set3Team2,
          isCompleted: status === 'completed',
        });
      }

      // Update match record
      matchRepository.update(match.id, {
        status,
        team1SetsWon: t1SetsWon,
        team2SetsWon: t2SetsWon,
        setScores: compiledSetScores,
        currentSet: includeSet3 ? 3 : currentSet,
      });

      // Log official activity
      activityRepository.log({
        action: 'Official Score Uploaded',
        entityType: 'match',
        entityName: `${match.team1.shortName} vs ${match.team2.shortName}`,
        userName: currentUser?.name || 'Authorized Scorer',
        userEmail: currentUser?.email || 'scorer@bbfi.org',
        details: `Uploaded scorecard: ${match.team1.shortName} (${t1SetsWon}) - (${t2SetsWon}) ${match.team2.shortName} [${status.toUpperCase()}]`,
      });

      nativeHaptics.notification('success');
      toast.success(
        'Score Uploaded Successfully',
        `${match.team1.shortName} ${t1SetsWon} - ${t2SetsWon} ${match.team2.shortName} updated in tournament standings.`
      );

      onMatchUpdated();
      onClose();
    } catch (err: any) {
      nativeHaptics.notification('error');
      setErrorMsg(err.message || 'Failed to upload match score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto pt-safe pb-safe">
      <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl min-h-screen sm:min-h-0 bg-white border-0 sm:border border-border-neutral rounded-none sm:rounded-3xl shadow-card-hover overflow-hidden z-10 my-0 sm:my-8 flex flex-col">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-border-neutral bg-surface-muted flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-orange">
                  Official Scorecard Upload
                </span>
                <span className="text-[10px] text-text-secondary">•</span>
                <span className="text-[10px] text-text-secondary truncate max-w-[140px]">
                  {match.stage}
                </span>
              </div>
              <h2 className="text-sm font-display font-bold text-text-primary truncate max-w-xs sm:max-w-md">
                {match.team1.name} vs {match.team2.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted active:scale-95 transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveScores} className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-status-live text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Match Status Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
              Match Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'completed', label: 'Completed (Final)' },
                { id: 'live', label: 'Live Active' },
                { id: 'upcoming', label: 'Upcoming' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setStatus(s.id as MatchStatus);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    status === s.id
                      ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                      : 'bg-surface-muted text-text-secondary hover:text-text-primary border-border-neutral'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sets Score Summary Pill */}
          <div className="p-4 rounded-2xl bg-surface-muted border border-border-neutral flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                style={{ backgroundColor: match.team1.logoBg || '#182230' }}
              >
                {match.team1.shortName}
              </span>
              <span className="font-bold text-sm text-text-primary truncate max-w-[110px] sm:max-w-none">
                {match.team1.name}
              </span>
            </div>

            <div className="text-center px-3">
              <div className="font-score text-2xl font-black text-brand-orange">
                {t1SetsWon} - {t2SetsWon}
              </div>
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Sets Won
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm text-text-primary truncate max-w-[110px] sm:max-w-none text-right">
                {match.team2.name}
              </span>
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                style={{ backgroundColor: match.team2.logoBg || '#182230' }}
              >
                {match.team2.shortName}
              </span>
            </div>
          </div>

          {/* SET 1 SCORES */}
          <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral text-xs font-bold text-text-primary">
              <span>Set 1 (Target: {match.maxPointsPerSet || 29} pts)</span>
              <span className="text-brand-orange font-mono">
                {set1Team1 > set1Team2 ? `${match.team1.shortName} Won` : set1Team2 > set1Team1 ? `${match.team2.shortName} Won` : 'Tied'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 Set 1 */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-text-secondary block truncate">
                  {match.team1.shortName} Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet1Team1, -1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={set1Team1}
                    onChange={(e) => setSet1Team1(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet1Team1, 1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Team 2 Set 1 */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-text-secondary block truncate">
                  {match.team2.shortName} Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet1Team2, -1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={set1Team2}
                    onChange={(e) => setSet1Team2(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet1Team2, 1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SET 2 SCORES */}
          <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral text-xs font-bold text-text-primary">
              <span>Set 2 (Target: {match.maxPointsPerSet || 29} pts)</span>
              <span className="text-brand-orange font-mono">
                {set2Team1 > set2Team2 ? `${match.team1.shortName} Won` : set2Team2 > set2Team1 ? `${match.team2.shortName} Won` : 'Tied'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 Set 2 */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-text-secondary block truncate">
                  {match.team1.shortName} Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet2Team1, -1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={set2Team1}
                    onChange={(e) => setSet2Team1(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet2Team1, 1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Team 2 Set 2 */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-text-secondary block truncate">
                  {match.team2.shortName} Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet2Team2, -1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={set2Team2}
                    onChange={(e) => setSet2Team2(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreAdjust(setSet2Team2, 1)}
                    className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SET 3 DECIDER TOGGLE & SCORES */}
          <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral">
              <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSet3}
                  onChange={(e) => {
                    nativeHaptics.selection();
                    setIncludeSet3(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange"
                />
                <span>Include Deciding Set 3</span>
              </label>

              {includeSet3 && (
                <span className="text-brand-orange font-mono text-xs font-bold">
                  {set3Team1 > set3Team2 ? `${match.team1.shortName} Won` : set3Team2 > set3Team1 ? `${match.team2.shortName} Won` : 'Tied'}
                </span>
              )}
            </div>

            {includeSet3 ? (
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Team 1 Set 3 */}
                <div className="space-y-1.5 text-center">
                  <span className="text-xs font-semibold text-text-secondary block truncate">
                    {match.team1.shortName} Score
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScoreAdjust(setSet3Team1, -1)}
                      className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={set3Team1}
                      onChange={(e) => setSet3Team1(Math.max(0, Number(e.target.value)))}
                      className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={() => handleScoreAdjust(setSet3Team1, 1)}
                      className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team 2 Set 3 */}
                <div className="space-y-1.5 text-center">
                  <span className="text-xs font-semibold text-text-secondary block truncate">
                    {match.team2.shortName} Score
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScoreAdjust(setSet3Team2, -1)}
                      className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={set3Team2}
                      onChange={(e) => setSet3Team2(Math.max(0, Number(e.target.value)))}
                      className="w-16 h-10 text-center font-score text-xl font-black rounded-xl bg-surface-muted border border-border-neutral text-text-primary focus:outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={() => handleScoreAdjust(setSet3Team2, 1)}
                      className="w-9 h-9 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary flex items-center justify-center active:scale-95 font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-text-secondary">
                Match concluded in 2 straight sets ({t1SetsWon === 2 ? match.team1.shortName : match.team2.shortName} 2-0 victory). Enable checkbox if a 3rd set was contested.
              </p>
            )}
          </div>

          {/* Winner Confirmation Banner */}
          {determinedWinner && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-brand-orange/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-orange" />
                <span>
                  Match Victor: <strong className="text-text-primary">{determinedWinner.name}</strong> ({t1SetsWon}-{t2SetsWon} Sets)
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-brand-orange bg-white px-2 py-0.5 rounded border border-brand-orange/30">
                Official Winner
              </span>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          <div className="pt-2 sticky bottom-0 bg-white border-t border-border-neutral flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border-neutral text-text-secondary hover:text-text-primary font-bold text-xs active:scale-95 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 px-6 rounded-xl bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-40 text-white font-bold text-xs shadow-card active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Uploading...' : 'Upload & Commit Score'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
