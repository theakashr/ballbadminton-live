import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Archive, 
  RotateCcw, 
  Eye, 
  Trash2, 
  MapPin, 
  Calendar, 
  X,
  Users,
  Shield
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { SearchAndFilter, type FilterConfig } from '../../components/admin/common/SearchAndFilter';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { TournamentForm, type TournamentFormData } from '../../components/admin/common/TournamentForm';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { TournamentTeamRegistrationModal } from '../../components/admin/tournaments/TournamentTeamRegistrationModal';
import { tournamentRepository } from '../../repositories/tournamentRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { AdminTournament } from '../../types';

export const AdminTournamentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, canManageTournaments } = useAuth();
  const toast = useToast();

  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [regFilter, setRegFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<AdminTournament | null>(null);
  const [viewingTournament, setViewingTournament] = useState<AdminTournament | null>(null);
  const [teamRegTournament, setTeamRegTournament] = useState<AdminTournament | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load from repository
  const reload = async () => {
    const list = await dataService.getTournaments();
    setTournaments(list);
  };

  useEffect(() => {
    reload();
  }, []);

  // Handle URL query action (e.g. ?action=new)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingTournament(null);
      setIsFormOpen(true);
      // Clean up param
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Filters setup
  const filters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      selectedValue: statusFilter,
      options: [
        { label: 'Live Active', value: 'live' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      selectedValue: formatFilter,
      options: [
        { label: '5s Traditional', value: '5s' },
        { label: 'Doubles Open', value: 'Doubles' },
        { label: 'Mixed Fives', value: 'Mixed' },
      ],
    },
    {
      id: 'reg',
      label: 'Registration',
      selectedValue: regFilter,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
        { label: 'Invite Only', value: 'invite-only' },
        { label: 'Upcoming', value: 'upcoming' },
      ],
    },
  ];

  const handleFilterChange = (id: string, value: string) => {
    if (id === 'status') setStatusFilter(value);
    if (id === 'format') setFormatFilter(value);
    if (id === 'reg') setRegFilter(value);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setFormatFilter('');
    setRegFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(statusFilter || formatFilter || regFilter || searchQuery);

  // Filtered tournament records
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      // Scoped RBAC: if user is not super_admin and has assignedTournaments, only show their tournaments
      if (currentUser?.role !== 'super_admin' && currentUser?.assignedTournaments && currentUser.assignedTournaments.length > 0) {
        if (!currentUser.assignedTournaments.includes(t.id)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesCity = t.city.toLowerCase().includes(q);
        const matchesVenue = t.venue.toLowerCase().includes(q);
        const matchesOrg = t.organizer.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesVenue && !matchesOrg) return false;
      }
      if (statusFilter && t.status !== statusFilter) return false;
      if (formatFilter && t.format !== formatFilter) return false;
      if (regFilter && t.registrationStatus !== regFilter) return false;
      return true;
    });
  }, [tournaments, searchQuery, statusFilter, formatFilter, regFilter, currentUser]);

  // Form submit handler (Create / Edit)
  const handleFormSubmit = async (data: TournamentFormData) => {
    try {
      if (editingTournament) {
        // Edit existing
        const updated = tournamentRepository.update(editingTournament.id, data);
        activityRepository.log({
          action: 'Tournament Updated',
          entityType: 'tournament',
          entityName: updated.name,
          userName: currentUser?.name || 'Admin',
          userEmail: currentUser?.email || 'admin@bbfi.org',
          details: `Modified tournament configuration and details`,
        });
        toast.success('Tournament Updated', `"${updated.name}" has been successfully updated.`);
      } else {
        // Create new via dataService to sync local & cloud
        const created = await dataService.createTournament({
          ...data,
          totalTeams: data.totalTeams ?? data.maxTeams ?? 0,
        });
        activityRepository.log({
          action: 'New Tournament Created',
          entityType: 'tournament',
          entityName: created.name,
          userName: currentUser?.name || 'Admin',
          userEmail: currentUser?.email || 'admin@bbfi.org',
          details: `Created new ${created.format} tournament in ${created.city}`,
        });
        toast.success('Tournament Created', `"${created.name}" is now published.`);
      }

      await reload();
      setIsFormOpen(false);
      setEditingTournament(null);
    } catch (err: any) {
      toast.error('Operation Failed', err.message || 'Could not save tournament.');
    }
  };

  // Archive tournament
  const handleArchive = (t: AdminTournament) => {
    const isAlreadyArchived = t.status === 'archived';
    setConfirmDialog({
      isOpen: true,
      title: isAlreadyArchived ? 'Restore Tournament' : 'Archive Tournament',
      message: isAlreadyArchived
        ? `Are you sure you want to restore "${t.name}" back to upcoming status?`
        : `Are you sure you want to archive "${t.name}"? It will be hidden from the active public schedule.`,
      isDestructive: !isAlreadyArchived,
      onConfirm: () => {
        if (isAlreadyArchived) {
          tournamentRepository.unarchive(t.id);
          toast.info('Tournament Restored', `"${t.name}" is active again.`);
        } else {
          tournamentRepository.archive(t.id);
          toast.info('Tournament Archived', `"${t.name}" has been moved to archives.`);
        }
        reload();
      },
    });
  };

  // Delete tournament
  const handleDelete = (t: AdminTournament) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete Tournament?',
      message: `Are you sure you want to delete "${t.name}" from local storage? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: () => {
        tournamentRepository.delete(t.id);
        toast.success('Tournament Deleted', `"${t.name}" was removed.`);
        reload();
      },
    });
  };

  // Reset to default seed tournaments
  const handleResetDefaults = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset to Seed Tournaments?',
      message: 'This will reset all tournaments back to the original BBFI demo dataset in your browser.',
      isDestructive: true,
      onConfirm: () => {
        tournamentRepository.resetToDefaults();
        reload();
        toast.success('Reset Complete', 'Default seed tournaments have been restored.');
      },
    });
  };

  // Table columns definition
  const columns: Column<AdminTournament>[] = [
    {
      key: 'name',
      header: 'Tournament & Organizer',
      sortable: true,
      render: (t) => (
        <div className="max-w-xs">
          <button
            onClick={() => setViewingTournament(t)}
            className="font-bold text-text-primary hover:text-brand-orange text-left transition-colors truncate block max-w-full"
          >
            {t.name}
          </button>
          <span className="text-xs text-text-secondary truncate block mt-0.5">
            {t.organizer}
          </span>
          <span className="text-[11px] text-brand-orange font-semibold block mt-0.5">
            {t.category}
          </span>
        </div>
      ),
    },
    {
      key: 'venue',
      header: 'Venue & City',
      sortable: true,
      render: (t) => (
        <div className="text-xs space-y-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-text-primary font-medium">
            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>{t.city}</span>
          </div>
          <span className="text-text-secondary block text-[11px] truncate max-w-[160px]">
            {t.venue}
          </span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Schedule Dates',
      sortable: true,
      render: (t) => (
        <div className="text-xs space-y-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-text-primary">
            <Calendar className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>{t.startDate}</span>
          </div>
          <span className="text-text-secondary text-[11px] block">
            to {t.endDate}
          </span>
        </div>
      ),
    },
    {
      key: 'totalTeams',
      header: 'Teams & Courts',
      sortable: true,
      render: (t) => (
        <div className="text-xs">
          <span className="font-bold text-text-primary">
            {t.registeredTeamsCount ?? t.totalTeams}
          </span>
          <span className="text-text-secondary"> / {t.maxTeams || 32} teams</span>
          <span className="text-[11px] text-text-secondary block mt-0.5">
            {t.courtsCount} courts
          </span>
        </div>
      ),
    },
    {
      key: 'format',
      header: 'Format',
      sortable: true,
      render: (t) => (
        <div className="text-xs">
          <span className="px-2 py-0.5 rounded-md bg-brand-soft border border-brand-orange/20 text-brand-orange font-bold text-[11px]">
            {t.format}
          </span>
        </div>
      ),
    },
    {
      key: 'registrationStatus',
      header: 'Registration',
      render: (t) => (
        <StatusBadge status={t.registrationStatus || 'open'} size="sm" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <StatusBadge status={t.status} size="sm" pulse={t.status === 'live'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingTournament(t)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTeamRegTournament(t)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-brand-orange hover:bg-surface-muted transition-colors"
            title="Manage Teams & Rosters"
          >
            <Users className="w-4 h-4" />
          </button>

          {canManageTournaments && (
            <>
              <button
                onClick={() => {
                  setEditingTournament(t);
                  setIsFormOpen(true);
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:text-brand-orange hover:bg-surface-muted transition-colors"
                title="Edit Tournament"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleArchive(t)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                title={t.status === 'archived' ? 'Restore' : 'Archive'}
              >
                {t.status === 'archived' ? (
                  <RotateCcw className="w-4 h-4 text-brand-orange" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => handleDelete(t)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-status-live hover:bg-red-50 transition-colors"
                title="Delete"
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
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Tournament Management
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Create, schedule, configure 5s formats, and supervise official Ball Badminton championships.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-surface-muted border border-border-neutral transition-colors shadow-sm"
            title="Reset repository to seed tournaments"
          >
            Reset Demo Data
          </button>

          {canManageTournaments && (
            <button
              onClick={() => {
                setEditingTournament(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>
          )}
        </div>
      </div>

      {/* Scoped Tournament RBAC Notice */}
      {currentUser?.role !== 'super_admin' && currentUser?.assignedTournaments && currentUser.assignedTournaments.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-between text-xs text-brand-orange font-medium">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>
              <strong>Delegated Tournament Access:</strong> Your official credentials are authorized to manage <strong>{currentUser.assignedTournaments.length}</strong> assigned tournament(s).
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-white text-brand-orange px-2 py-0.5 rounded border border-brand-orange/20 shrink-0">
            Scoped Access
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-card">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by tournament name, venue, city, or organizer..."
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          totalResults={filteredTournaments.length}
          resultLabel="tournaments"
        />
      </div>

      {/* Tournaments Data Table */}
      <DataTable
        columns={columns}
        data={filteredTournaments}
        keyExtractor={(item) => item.id}
        pageSize={8}
        emptyTitle="No tournaments found"
        emptyDescription="Try adjusting your search terms or filter criteria, or click 'Create Tournament' to add one."
      />

      {/* Create / Edit Tournament Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="relative w-full max-w-3xl bg-white border border-border-neutral rounded-2xl shadow-elevated overflow-hidden z-10 my-8">
            <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-text-primary">
                    {editingTournament ? 'Edit Tournament Configuration' : 'Create Ball Badminton Tournament'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Configure dates, venue, 5s rules, court surface &amp; registration limits
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <TournamentForm
                initialData={editingTournament}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Tournament Details Modal */}
      {viewingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm"
            onClick={() => setViewingTournament(null)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-border-neutral rounded-2xl shadow-elevated overflow-hidden z-10 my-8">
            <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-text-primary">
                    Tournament Specification Sheet
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Official BBFI sanctioned tournament profile
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingTournament(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Title & Status Badges */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={viewingTournament.status} />
                  <StatusBadge status={viewingTournament.registrationStatus || 'open'} />
                  <span className="px-2 py-0.5 rounded bg-brand-soft border border-brand-orange/20 text-brand-orange font-bold uppercase text-[10px]">
                    {viewingTournament.format}
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-text-primary">
                  {viewingTournament.name}
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  {viewingTournament.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-muted border border-border-neutral">
                <div>
                  <span className="text-text-secondary block text-[11px]">Organizing Body:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.organizer}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Host Venue &amp; City:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.venue}, {viewingTournament.city}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Tournament Dates:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.startDate} to {viewingTournament.endDate}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Registration Deadline:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.registrationDeadline || 'Closed / Completed'}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Court Surface:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.surfaceType || 'Outdoor Red Clay'}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Match Format:</span>
                  <span className="font-semibold text-brand-orange">{viewingTournament.matchFormat || 'Best of 3 Sets (29 Points)'}</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Courts &amp; Capacity:</span>
                  <span className="font-semibold text-text-primary">
                    {viewingTournament.courtsCount} Courts • {viewingTournament.registeredTeamsCount ?? viewingTournament.totalTeams} of {viewingTournament.maxTeams || 32} Teams
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">Chief Referee:</span>
                  <span className="font-semibold text-text-primary">{viewingTournament.chiefReferee || 'BBFI Appointed Umpire'}</span>
                </div>
              </div>

              {/* Contact & Awards */}
              {(viewingTournament.prizePool || viewingTournament.contactEmail) && (
                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-xs space-y-1.5">
                  {viewingTournament.prizePool && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Prize Pool:</span>
                      <span className="font-bold text-amber-700">{viewingTournament.prizePool}</span>
                    </div>
                  )}
                  {viewingTournament.contactEmail && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Official Email:</span>
                      <span className="text-text-primary">{viewingTournament.contactEmail}</span>
                    </div>
                  )}
                  {viewingTournament.contactPhone && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contact Phone:</span>
                      <span className="text-text-primary">{viewingTournament.contactPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions Button Bar */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingTournament;
                    setViewingTournament(null);
                    setTeamRegTournament(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Manage Participating Teams &amp; Rosters</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingTournament(null)}
                  className="px-5 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary font-semibold text-xs border border-border-neutral transition-colors"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration & Rosters Modal */}
      {teamRegTournament && (
        <TournamentTeamRegistrationModal
          tournament={teamRegTournament}
          isOpen={Boolean(teamRegTournament)}
          onClose={() => setTeamRegTournament(null)}
          onUpdated={reload}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
