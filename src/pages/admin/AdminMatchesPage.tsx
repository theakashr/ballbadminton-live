import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CalendarClock, 
  Plus, 
  Clock, 
  Trash2, 
  Play, 
  CheckCircle,
  Flame,
  Edit3
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { SearchAndFilter, type FilterConfig } from '../../components/admin/common/SearchAndFilter';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { MatchCreationWizard } from '../../components/admin/matches/MatchCreationWizard';
import { LiveScorerConsole } from '../../components/admin/matches/LiveScorerConsole';
import { QuickScoreUploadModal } from '../../components/admin/matches/QuickScoreUploadModal';
import { matchRepository } from '../../repositories/matchRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Match, MatchStage, MatchStatus } from '../../types';

export const AdminMatchesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, canScheduleMatches } = useAuth();
  const toast = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const [scoringModalMatch, setScoringModalMatch] = useState<Match | null>(null);
  const [quickScoreMatch, setQuickScoreMatch] = useState<Match | null>(null);

  const reload = () => {
    setMatches(matchRepository.getAll());
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const stages: MatchStage[] = [
    'Championship Final',
    'Semi-Final 1',
    'Semi-Final 2',
    'Quarter-Final',
    'Super 8 League',
    'Group Stage',
  ];

  const filters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      selectedValue: statusFilter,
      options: [
        { label: 'Live Active', value: 'live' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      id: 'stage',
      label: 'Tournament Stage',
      selectedValue: stageFilter,
      options: stages.map((s) => ({ label: s, value: s })),
    },
  ];

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchT1 = m.team1.name.toLowerCase().includes(q);
        const matchT2 = m.team2.name.toLowerCase().includes(q);
        const matchTourn = m.tournamentName.toLowerCase().includes(q);
        const matchCourt = m.court.toLowerCase().includes(q);
        if (!matchT1 && !matchT2 && !matchTourn && !matchCourt) return false;
      }
      if (statusFilter && m.status !== statusFilter) return false;
      if (stageFilter && m.stage !== stageFilter) return false;
      return true;
    });
  }, [matches, searchQuery, statusFilter, stageFilter]);

  const handleUpdateStatus = (match: Match, newStatus: MatchStatus) => {
    try {
      matchRepository.update(match.id, { status: newStatus });
      activityRepository.log({
        action: `Match Marked as ${newStatus.toUpperCase()}`,
        entityType: 'match',
        entityName: `${match.team1.shortName} vs ${match.team2.shortName}`,
        userName: currentUser?.name || 'Admin',
        userEmail: currentUser?.email || 'admin@bbfi.org',
        details: `Updated fixture status to ${newStatus}`,
      });
      toast.info('Status Updated', `Match status changed to ${newStatus}.`);
      reload();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      matchRepository.delete(deleteTarget.id);
      toast.success('Match Removed', 'Fixture was removed from schedule.');
      setDeleteTarget(null);
      reload();
    }
  };

  const columns: Column<Match>[] = [
    {
      key: 'teams',
      header: 'Contesting Teams',
      sortable: false,
      render: (m) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white shrink-0"
              style={{ backgroundColor: m.team1.logoBg }}
            >
              {m.team1.shortName}
            </span>
            <span className="font-bold text-text-primary text-sm">{m.team1.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white shrink-0"
              style={{ backgroundColor: m.team2.logoBg }}
            >
              {m.team2.shortName}
            </span>
            <span className="font-bold text-text-primary text-sm">{m.team2.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Tournament & Stage',
      sortable: true,
      render: (m) => (
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-brand-orange block">{m.stage}</span>
          <span className="text-text-secondary block truncate max-w-[200px]">{m.tournamentName}</span>
          <span className="text-[11px] text-text-secondary font-medium block">{m.category}</span>
        </div>
      ),
    },
    {
      key: 'court',
      header: 'Court & Schedule',
      sortable: true,
      render: (m) => (
        <div className="text-xs space-y-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>{m.scheduledTime}</span>
          </div>
          <span className="text-text-secondary text-[11px] block">{m.court}</span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Current Sets / Score',
      render: (m) => {
        if (m.status === 'live') {
          return (
            <div className="text-xs">
              <span className="px-2 py-0.5 rounded bg-red-50 text-status-live font-bold font-mono border border-red-200">
                Set {m.currentSet} ({m.team1SetsWon} - {m.team2SetsWon})
              </span>
              <span className="text-[11px] text-text-secondary block mt-0.5">
                Target: {m.maxPointsPerSet} pts
              </span>
            </div>
          );
        }
        if (m.status === 'completed') {
          return (
            <div className="text-xs font-mono font-bold text-text-primary">
              {m.team1SetsWon} - {m.team2SetsWon} Sets
            </div>
          );
        }
        return <span className="text-xs text-text-secondary">—</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (m) => <StatusBadge status={m.status} size="sm" pulse={m.status === 'live'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            onClick={() => setScoringModalMatch(m)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-soft hover:bg-brand-orange/20 text-brand-orange text-xs font-semibold border border-brand-orange/30 transition-colors active:scale-95"
            title="Live Court Scoring Console"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>

          <button
            onClick={() => setQuickScoreMatch(m)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-border-neutral text-text-primary text-xs font-semibold border border-border-neutral transition-colors active:scale-95"
            title="Upload / Edit Set Scores"
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-orange" />
            <span>Upload Score</span>
          </button>

          {canScheduleMatches && (
            <>
              {m.status === 'upcoming' && (
                <button
                  onClick={() => handleUpdateStatus(m, 'live')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-status-live text-xs font-semibold border border-red-200 transition-colors active:scale-95"
                  title="Mark Match as LIVE"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              )}

              {m.status === 'live' && (
                <button
                  onClick={() => handleUpdateStatus(m, 'completed')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-status-success text-xs font-semibold border border-emerald-200 transition-colors active:scale-95"
                  title="Mark Match as Completed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>End</span>
                </button>
              )}

              <button
                onClick={() => setDeleteTarget(m)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-status-live hover:bg-red-50 transition-colors"
                title="Remove Fixture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Match Scheduling &amp; Fixtures
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Organize court orders of play, assign stages, and oversee live rally proceedings.
          </p>
        </div>

        {canScheduleMatches && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule New Match</span>
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-card">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by team names, tournament, or court..."
          filters={filters}
          onFilterChange={(id, val) => {
            if (id === 'status') setStatusFilter(val);
            if (id === 'stage') setStageFilter(val);
          }}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('');
            setStageFilter('');
          }}
          hasActiveFilters={Boolean(searchQuery || statusFilter || stageFilter)}
          totalResults={filteredMatches.length}
          resultLabel="matches"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredMatches}
        keyExtractor={(m) => m.id}
        pageSize={8}
        emptyTitle="No matches scheduled"
        emptyDescription="No matches match the filters. Click 'Schedule New Match' to add one."
      />

      {/* 6-Step Match Creation Wizard */}
      <MatchCreationWizard
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onMatchCreated={() => {
          reload();
          toast.success('Schedule Updated', 'New fixture is now available in tournament calendar.');
        }}
      />

      {/* Upgraded Live Scorer Console */}
      {scoringModalMatch && (
        <LiveScorerConsole
          matchId={scoringModalMatch.id}
          isOpen={Boolean(scoringModalMatch)}
          onClose={() => setScoringModalMatch(null)}
          onMatchUpdated={reload}
        />
      )}

      {/* Fast Score Upload / Manual Score Editor */}
      {quickScoreMatch && (
        <QuickScoreUploadModal
          match={quickScoreMatch}
          isOpen={Boolean(quickScoreMatch)}
          onClose={() => setQuickScoreMatch(null)}
          onMatchUpdated={reload}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Fixture?"
        message={`Are you sure you want to remove ${deleteTarget?.team1.name} vs ${deleteTarget?.team2.name}?`}
        isDestructive={true}
        confirmLabel="Remove Fixture"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
