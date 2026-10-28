import React, { useState, useEffect } from 'react';
import type { AdminTournament, TournamentVisibility, TournamentRegistrationStatus, TournamentFullStatus } from '../../../types';
import { 
  Trophy, 
  Calendar, 
  Sliders, 
  AlertCircle, 
  Check, 
  Info
} from 'lucide-react';

export interface TournamentFormData {
  name: string;
  description: string;
  organizer: string;
  venue: string;
  city: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  totalTeams?: number;
  registeredTeamsCount?: number;
  courtsCount: number;
  format: '5s' | 'Doubles' | 'Mixed';
  category: string;
  matchFormat: string;
  visibility: TournamentVisibility;
  registrationStatus: TournamentRegistrationStatus;
  status: TournamentFullStatus;
  prizePool?: string;
  surfaceType?: string;
  chiefReferee?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface TournamentFormProps {
  initialData?: AdminTournament | null;
  onSubmit: (data: TournamentFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'schedule' | 'rules'>('basics');

  const [formData, setFormData] = useState<TournamentFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    organizer: initialData?.organizer || '',
    venue: initialData?.venue || '',
    city: initialData?.city || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    registrationDeadline: initialData?.registrationDeadline || '',
    maxTeams: initialData?.maxTeams || 24,
    registeredTeamsCount: initialData?.registeredTeamsCount || 0,
    courtsCount: initialData?.courtsCount || 4,
    format: initialData?.format || '5s',
    category: initialData?.category || "Men's Open 5s",
    matchFormat: initialData?.matchFormat || 'Best of 3 Sets (29 Points per set)',
    visibility: initialData?.visibility || 'public',
    registrationStatus: initialData?.registrationStatus || 'open',
    status: initialData?.status || 'upcoming',
    prizePool: initialData?.prizePool || '₹2,50,000 + Trophies',
    surfaceType: initialData?.surfaceType || 'Outdoor Red Clay',
    chiefReferee: initialData?.chiefReferee || 'BBFI Grade A Official',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        organizer: initialData.organizer,
        venue: initialData.venue,
        city: initialData.city,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        registrationDeadline: initialData.registrationDeadline || '',
        maxTeams: initialData.maxTeams || initialData.totalTeams || 24,
        registeredTeamsCount: initialData.registeredTeamsCount || initialData.totalTeams || 0,
        courtsCount: initialData.courtsCount,
        format: initialData.format,
        category: initialData.category,
        matchFormat: initialData.matchFormat || 'Best of 3 Sets (29 Points per set)',
        visibility: initialData.visibility || 'public',
        registrationStatus: initialData.registrationStatus || 'open',
        status: initialData.status,
        prizePool: initialData.prizePool || '',
        surfaceType: initialData.surfaceType || 'Outdoor Red Clay',
        chiefReferee: initialData.chiefReferee || '',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required.';
    } else if (formData.name.length < 5) {
      newErrors.name = 'Name must be at least 5 characters.';
    }

    if (!formData.organizer.trim()) {
      newErrors.organizer = 'Organizer/association is required.';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue name is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Host city is required.';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be earlier than start date.';
    }

    if (formData.registrationDeadline && formData.startDate && formData.registrationDeadline > formData.startDate) {
      newErrors.registrationDeadline = 'Registration deadline must be on or before start date.';
    }

    if (formData.maxTeams < 2 || formData.maxTeams > 64) {
      newErrors.maxTeams = 'Max teams must be between 2 and 64.';
    }

    if (formData.courtsCount < 1 || formData.courtsCount > 24) {
      newErrors.courtsCount = 'Courts must be between 1 and 24.';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please provide a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
      // Focus the first section containing an error
      if (errors.name || errors.organizer) {
        setActiveTab('basics');
      } else if (errors.venue || errors.city || errors.startDate || errors.endDate || errors.registrationDeadline) {
        setActiveTab('schedule');
      } else {
        setActiveTab('rules');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border-neutral">
        <button
          type="button"
          onClick={() => setActiveTab('basics')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'basics'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>1. Basic Info</span>
          {(errors.name || errors.organizer) && (
            <span className="w-2 h-2 rounded-full bg-status-live" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Location & Schedule</span>
          {(errors.venue || errors.city || errors.startDate || errors.endDate || errors.registrationDeadline) && (
            <span className="w-2 h-2 rounded-full bg-status-live" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'rules'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Rules & Capacity</span>
          {(errors.maxTeams || errors.courtsCount) && (
            <span className="w-2 h-2 rounded-full bg-status-live" />
          )}
        </button>
      </div>

      {/* Tab 1: Basic Info */}
      {activeTab === 'basics' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              Tournament Name <span className="text-status-live">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 71st Senior National Ball Badminton Championship 2027"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              Description / Overview
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide tournament context, history, eligibility rules, and broadcast notes..."
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Organizing Body / Association <span className="text-status-live">*</span>
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="e.g. Ball Badminton Federation of India (BBFI)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.organizer && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.organizer}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Visibility Status
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as TournamentVisibility })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="public">Public (Visible on home & tournament pages)</option>
                <option value="unlisted">Unlisted (Direct link only)</option>
                <option value="draft">Draft (Admin eyes only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="director@tournament.org"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.contactEmail && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 94432 12345"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Location & Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Venue Name <span className="text-status-live">*</span>
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. Jawaharlal Nehru Outdoor Stadium"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.venue && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.venue}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Host City & State <span className="text-status-live">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Coimbatore, Tamil Nadu"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.city && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.city}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Start Date <span className="text-status-live">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.startDate && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.startDate}
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
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.endDate && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.endDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Registration Deadline
              </label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.registrationDeadline && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.registrationDeadline}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Court Surface Type
              </label>
              <select
                value={formData.surfaceType}
                onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="Outdoor Red Clay">Outdoor Red Clay (Traditional)</option>
                <option value="Indoor Synthetic Mat">Indoor Synthetic Mat</option>
                <option value="Outdoor Sand/Grit">Outdoor Sand / Grit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Chief Referee / Umpire in-Charge
              </label>
              <input
                type="text"
                value={formData.chiefReferee}
                onChange={(e) => setFormData({ ...formData, chiefReferee: e.target.value })}
                placeholder="e.g. B. Ramachandra (BBFI Grade A)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rules & Capacity */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Tournament Format <span className="text-status-live">*</span>
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as '5s' | 'Doubles' | 'Mixed' })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="5s">5s (Five-a-side - Traditional BBFI)</option>
                <option value="Doubles">Doubles Open</option>
                <option value="Mixed">Mixed Fives</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Men's Open 5s"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Match Format
              </label>
              <select
                value={formData.matchFormat}
                onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="1 Set (29 Points - Group Stage Format)">1 Single Set (29 Points - Group / League Stage)</option>
                <option value="1 Set (35 Points - Group Stage Format)">1 Single Set (35 Points - Invitational Group Stage)</option>
                <option value="Best of 3 Sets (29 Points per set)">Best of 3 Sets (29 Points - Standard BBFI)</option>
                <option value="Best of 3 Sets (35 Points per set)">Best of 3 Sets (35 Points - Invitational)</option>
                <option value="Best of 5 Sets (29 Points per set)">Best of 5 Sets (29 Points - Championship Finals)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Maximum Teams <span className="text-status-live">*</span>
              </label>
              <input
                type="number"
                min={2}
                max={64}
                value={formData.maxTeams}
                onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 2 })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.maxTeams && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.maxTeams}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Courts Available <span className="text-status-live">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={formData.courtsCount}
                onChange={(e) => setFormData({ ...formData, courtsCount: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              />
              {errors.courtsCount && (
                <p className="text-xs text-status-live mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.courtsCount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Registration Status
              </label>
              <select
                value={formData.registrationStatus}
                onChange={(e) => setFormData({ ...formData, registrationStatus: e.target.value as TournamentRegistrationStatus })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="open">Registration Open</option>
                <option value="closed">Registration Closed</option>
                <option value="invite-only">Invite-Only</option>
                <option value="upcoming">Opening Soon</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Tournament Stage / Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TournamentFullStatus })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              >
                <option value="upcoming">Upcoming (Not started)</option>
                <option value="live">LIVE (Matches active)</option>
                <option value="completed">Completed (Finals concluded)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Prize Pool & Awards
              </label>
              <input
                type="text"
                value={formData.prizePool}
                onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                placeholder="e.g. ₹5,00,000 + Rolling Trophy"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Storage Limitation Notice */}
      <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral flex items-start gap-2.5 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
        <span>
          <strong className="text-text-primary">Storage & Sync:</strong> Changes are saved to the repository layer with automatic synchronization to Supabase PostgreSQL when connected, or browser localStorage in prototype mode.
        </span>
      </div>

      {/* Form Actions */}
      <div className="pt-4 border-t border-border-neutral flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-neutral transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {activeTab !== 'rules' ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'basics' ? 'schedule' : 'rules')}
              className="px-5 py-2.5 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary font-semibold text-xs border border-border-neutral transition-colors"
            >
              Continue to {activeTab === 'basics' ? 'Schedule' : 'Rules'} →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{initialData ? 'Save Tournament Changes' : 'Create & Publish Tournament'}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
