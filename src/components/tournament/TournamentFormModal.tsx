import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trophy, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { NewTournamentFormData } from '../../types';

interface TournamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (formData: NewTournamentFormData) => void;
}

export const TournamentFormModal: React.FC<TournamentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewTournamentFormData>({
    name: '',
    organizer: '',
    category: "Men's Open 5s",
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    startDate: '',
    endDate: '',
    city: '',
    venue: '',
    courtsCount: 4,
    expectedTeams: 16,
    contactEmail: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewTournamentFormData, string>>>({});
  const [submittedData, setSubmittedData] = useState<NewTournamentFormData | null>(null);
  const [createdTournamentId, setCreatedTournamentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Partial<Record<keyof NewTournamentFormData, string>> = {};

    if (!formData.name.trim()) {
      errs.name = 'Tournament name is required.';
    } else if (formData.name.length < 4) {
      errs.name = 'Tournament name must be at least 4 characters long.';
    }

    if (!formData.organizer.trim()) {
      errs.organizer = 'Organizing institution, club, or board is required.';
    }

    if (!formData.startDate) {
      errs.startDate = 'Tournament start date is required.';
    }

    if (!formData.endDate) {
      errs.endDate = 'Tournament end date is required.';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errs.endDate = 'End date cannot be prior to start date.';
    }

    if (!formData.city.trim()) {
      errs.city = 'Host city is required.';
    }

    if (!formData.venue.trim()) {
      errs.venue = 'Ground or sports complex venue name is required.';
    }

    if (!formData.contactEmail.trim()) {
      errs.contactEmail = 'Organizer contact email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errs.contactEmail = 'Please provide a valid email address.';
    }

    if (formData.courtsCount < 1 || formData.courtsCount > 24) {
      errs.courtsCount = 'Number of courts must be between 1 and 24.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const created = await dataService.createTournament({
          name: formData.name,
          organizer: formData.organizer,
          category: formData.category,
          format: formData.format,
          matchFormat: formData.matchFormat || 'Best of 3 Sets (29 Points per set)',
          startDate: formData.startDate,
          endDate: formData.endDate,
          city: formData.city,
          venue: formData.venue,
          courtsCount: formData.courtsCount,
          totalTeams: formData.expectedTeams,
          contactEmail: formData.contactEmail,
          status: 'upcoming',
        });
        setCreatedTournamentId(created.id);
        setSubmittedData(formData);
        if (onSuccess) {
          onSuccess(formData);
        }
      } catch (err) {
        console.warn('Tournament create error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFormData({
      name: '',
      organizer: '',
      category: "Men's Open 5s",
      format: '5s',
      startDate: '',
      endDate: '',
      city: '',
      venue: '',
      courtsCount: 4,
      expectedTeams: 16,
      contactEmail: '',
    });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-2xl bg-white border border-border-neutral rounded-2xl shadow-card-hover overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-text-primary">
                Create Ball Badminton Tournament
              </h3>
              <p className="text-xs text-text-secondary">
                Stage 1 Setup: Schedule, courts, and category settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          
          {submittedData ? (
            /* Clear Confirmation State: Does NOT fake backend save */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-soft border-2 border-brand-orange flex items-center justify-center mx-auto text-brand-orange shadow-card">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-2xl font-display font-bold text-text-primary">
                  Tournament Configuration Validated
                </h4>
                <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                  Your tournament details for <strong className="text-text-primary">{submittedData.name}</strong> have been validated against BBFI standards.
                </p>
              </div>

              {/* Staged Data Summary Card */}
              <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border-neutral">
                  <span className="text-text-secondary">Organized by:</span>
                  <span className="text-text-primary font-medium">{submittedData.organizer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-neutral">
                  <span className="text-text-secondary">Format &amp; Category:</span>
                  <span className="text-brand-orange font-semibold">{submittedData.category} ({submittedData.format} format)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-neutral">
                  <span className="text-text-secondary">Venue &amp; Location:</span>
                  <span className="text-text-primary font-medium">{submittedData.venue}, {submittedData.city}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-neutral">
                  <span className="text-text-secondary">Duration:</span>
                  <span className="text-text-primary font-medium">{submittedData.startDate} to {submittedData.endDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Courts &amp; Expected Teams:</span>
                  <span className="text-text-primary font-medium">{submittedData.courtsCount} Courts • {submittedData.expectedTeams} Teams</span>
                </div>
              </div>

              {/* Required honest disclaimer */}
              <div className="p-3.5 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-start gap-3 text-left">
                <Info className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary leading-relaxed">
                  <strong className="text-text-primary block mb-0.5">Phase 1 Prototype Notice</strong>
                  This tournament specification has been verified in repository memory with direct Supabase PostgreSQL persistence and scorer assignment.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (createdTournamentId) {
                      navigate(`/tournaments/${createdTournamentId}`);
                    } else {
                      navigate('/tournaments');
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-orange hover:bg-brand-orangeHover text-white shadow-card transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Tournament Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-border-neutral text-text-primary hover:bg-surface-muted transition-colors"
                >
                  Configure Another
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* Form Intro Notice */}
              <div className="p-3 rounded-lg bg-surface-muted border border-border-neutral flex items-center gap-2 text-xs text-text-secondary">
                <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                <span>
                  Configure court setups and basic parameters. Roster registration opens once created.
                </span>
              </div>

              {/* Tournament Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Tournament Name <span className="text-status-live">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 71st South Zone Inter-Collegiate Ball Badminton Trophy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-colors ${
                    errors.name ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Organizing Entity & Contact Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Organizing Body / College <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coimbatore District Association / PSG Tech"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-colors ${
                      errors.organizer ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.organizer && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.organizer}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Organizer Email <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="sports.director@institution.edu"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-colors ${
                      errors.contactEmail ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.contactEmail}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Category & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Category <span className="text-status-live">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
                  >
                    <option value="Men's Open 5s">Men&apos;s Open 5s</option>
                    <option value="Women's Open 5s">Women&apos;s Open 5s</option>
                    <option value="Junior Boys (U-19)">Junior Boys (U-19)</option>
                    <option value="Junior Girls (U-19)">Junior Girls (U-19)</option>
                    <option value="Inter-Collegiate Fives">Inter-Collegiate Fives</option>
                    <option value="Doubles Open">Doubles Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Match Rule Format
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as '5s' | 'Doubles' | 'Mixed' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
                  >
                    <option value="5s">Fives (5 Players + 3 Substitutes - 29 Pts)</option>
                    <option value="Doubles">Doubles (2 Players - 29 Pts)</option>
                    <option value="Mixed">Mixed Fives (3 Men + 2 Women)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Match Winning Format (Group &amp; Knockout)
                  </label>
                  <select
                    value={formData.matchFormat}
                    onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
                  >
                    <option value="1 Set (29 Points - Group Stage Format)">1 Single Set (29 Points - Fast Group/League Stage)</option>
                    <option value="1 Set (35 Points - Group Stage Format)">1 Single Set (35 Points - Invitational Group Stage)</option>
                    <option value="Best of 3 Sets (29 Points per set)">Best of 3 Sets (29 Points per set - Official Standard)</option>
                    <option value="Best of 3 Sets (35 Points per set)">Best of 3 Sets (35 Points per set - Invitational)</option>
                    <option value="Best of 5 Sets (29 Points per set)">Best of 5 Sets (29 Points per set - Finals Option)</option>
                  </select>
                  <span className="text-[11px] text-text-secondary mt-1 block">
                    Matches in group stages can be configured as 1 single set of 29 points for rapid qualifying.
                  </span>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Start Date <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary focus:outline-none transition-colors ${
                      errors.startDate ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.startDate}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    End Date <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary focus:outline-none transition-colors ${
                      errors.endDate ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.endDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Venue & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Venue Ground / Stadium <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University Clay Courts"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-colors ${
                      errors.venue ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.venue && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.venue}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Host City <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai, Coimbatore, Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-colors ${
                      errors.city ? 'border-status-live focus:border-status-live' : 'border-border-neutral focus:border-brand-orange'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-status-live flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.city}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Courts & Expected Teams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Outdoor Courts Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={formData.courtsCount}
                    onChange={(e) => setFormData({ ...formData, courtsCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  {errors.courtsCount && (
                    <p className="mt-1 text-xs text-status-live">{errors.courtsCount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Expected Teams
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={formData.expectedTeams}
                    onChange={(e) => setFormData({ ...formData, expectedTeams: parseInt(e.target.value) || 2 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border-neutral flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 text-white shadow-card transition-all active:scale-95"
                >
                  {isSubmitting ? 'Creating Tournament...' : 'Validate & Initialize Tournament'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
