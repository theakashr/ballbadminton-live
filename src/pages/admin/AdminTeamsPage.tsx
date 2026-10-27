import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  MapPin, 
  Shield, 
  Eye, 
  Trash2, 
  X
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { SearchAndFilter, type FilterConfig } from '../../components/admin/common/SearchAndFilter';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { teamRepository } from '../../repositories/teamRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Team } from '../../types';

export const AdminTeamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, canManageTeams } = useAuth();
  const toast = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingRosterTeam, setViewingRosterTeam] = useState<Team | null>(null);

  // New Team Form
  const [newTeam, setNewTeam] = useState({
    name: '',
    shortName: '',
    state: 'Tamil Nadu',
    city: '',
    captainName: '',
    coachName: '',
    accentColor: '#FF851B',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  const reload = () => {
    setTeams(teamRepository.getAll());
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

  const states = useMemo(() => {
    const set = new Set(teams.map((t) => t.state));
    return Array.from(set).sort();
  }, [teams]);

  const filters: FilterConfig[] = [
    {
      id: 'state',
      label: 'State',
      selectedValue: stateFilter,
      options: states.map((s) => ({ label: s, value: s })),
    },
  ];

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCity = t.city.toLowerCase().includes(q);
        const matchCap = t.captainName.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchCap) return false;
      }
      if (stateFilter && t.state !== stateFilter) return false;
      return true;
    });
  }, [teams, searchQuery, stateFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newTeam.name.trim()) errs.name = 'Team name is required.';
    if (!newTeam.shortName.trim()) errs.shortName = 'Short abbreviation is required (2-4 chars).';
    if (!newTeam.city.trim()) errs.city = 'City is required.';
    if (!newTeam.captainName.trim()) errs.captainName = 'Captain name is required.';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      const created = teamRepository.create({
        name: newTeam.name.trim(),
        shortName: newTeam.shortName.trim().toUpperCase(),
        state: newTeam.state,
        city: newTeam.city.trim(),
        logoBg: '#211329',
        accentColor: newTeam.accentColor,
        captainName: newTeam.captainName.trim(),
        coachName: newTeam.coachName.trim() || undefined,
        roster: [],
      });

      activityRepository.log({
        action: 'Team Registered',
        entityType: 'team',
        entityName: created.name,
        userName: currentUser?.name || 'Admin',
        userEmail: currentUser?.email || 'admin@bbfi.org',
        details: `Registered ${created.name} (${created.city}, ${created.state})`,
      });

      toast.success('Team Registered', `"${created.name}" is now in the official team registry.`);
      setIsAddOpen(false);
      setNewTeam({
        name: '',
        shortName: '',
        state: 'Tamil Nadu',
        city: '',
        captainName: '',
        coachName: '',
        accentColor: '#FF851B',
      });
      setFormErrors({});
      reload();
    } catch (err: any) {
      toast.error('Failed to create team', err.message);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      teamRepository.delete(deleteTarget.id);
      toast.success('Team Removed', `"${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
      reload();
    }
  };

  const columns: Column<Team>[] = [
    {
      key: 'name',
      header: 'Team Name & Code',
      sortable: true,
      render: (team) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border border-border-neutral shrink-0 shadow-sm"
            style={{ backgroundColor: team.logoBg || '#182230', borderColor: team.accentColor || '#FF851B' }}
          >
            {team.shortName}
          </div>
          <div>
            <span className="font-bold text-text-primary block text-sm">{team.name}</span>
            <span className="text-[11px] text-text-secondary font-mono block">Code: {team.shortName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Region & City',
      sortable: true,
      render: (team) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <MapPin className="w-3.5 h-3.5 text-brand-orange" />
            <span>{team.city}</span>
          </div>
          <span className="text-[11px] text-text-secondary block mt-0.5">{team.state}</span>
        </div>
      ),
    },
    {
      key: 'captainName',
      header: 'Captain & Coach',
      sortable: true,
      render: (team) => (
        <div className="text-xs">
          <span className="font-medium text-text-primary block">{team.captainName}</span>
          <span className="text-[11px] text-text-secondary block">
            Coach: {team.coachName || 'TBD'}
          </span>
        </div>
      ),
    },
    {
      key: 'roster',
      header: 'Roster Count',
      render: (team) => (
        <div className="text-xs">
          <span className="font-bold text-brand-orange">
            {team.roster?.length || 0}
          </span>
          <span className="text-text-secondary"> players</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (team) => (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingRosterTeam(team);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-border-neutral text-xs font-semibold text-text-primary border border-border-neutral transition-colors active:scale-95"
            title="View Squad Roster"
          >
            <Eye className="w-3.5 h-3.5 text-brand-orange" />
            <span>View Roster</span>
          </button>

          {canManageTeams && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(team);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-status-live bg-red-50 hover:bg-red-100 border border-red-200 transition-colors active:scale-95"
              title="Delete Team"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
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
            <Users className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Team Directory
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Registered state association teams, collegiate squads, and certified clubs.
          </p>
        </div>

        {canManageTeams && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register New Team</span>
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-card">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search team name, city, or captain..."
          filters={filters}
          onFilterChange={(_, val) => setStateFilter(val)}
          onResetFilters={() => {
            setSearchQuery('');
            setStateFilter('');
          }}
          hasActiveFilters={Boolean(searchQuery || stateFilter)}
          totalResults={filteredTeams.length}
          resultLabel="teams"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredTeams}
        keyExtractor={(t) => t.id}
        pageSize={8}
        onRowClick={(t) => setViewingRosterTeam(t)}
        emptyTitle="No teams registered"
        emptyDescription="No teams match your search or filter criteria. Use 'Register New Team' to add a club."
      />

      {/* Add Team Modal - Mobile App Bottom Sheet / Full-Screen Friendly */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto pt-safe pb-safe">
          <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-lg min-h-screen sm:min-h-0 bg-white border-0 sm:border border-border-neutral rounded-none sm:rounded-3xl shadow-card-hover overflow-hidden z-10 my-0 sm:my-8 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-muted flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/20 flex items-center justify-center text-brand-orange shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-text-primary">
                    Register New Team
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Official state, collegiate, or certified club squad
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted active:scale-95 transition-all"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Team Name <span className="text-status-live">*</span>
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g. Bengaluru Smashers"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
                {formErrors.name && <p className="text-xs text-status-live mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Short Code (3-4 chars) <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newTeam.shortName}
                    onChange={(e) => setNewTeam({ ...newTeam, shortName: e.target.value.toUpperCase() })}
                    placeholder="BLR"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary uppercase font-bold focus:outline-none focus:border-brand-orange"
                  />
                  {formErrors.shortName && <p className="text-xs text-status-live mt-1">{formErrors.shortName}</p>}
                </div>

                {/* Team Badge Preview */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Badge Preview
                  </label>
                  <div className="flex items-center gap-2.5 h-[48px] px-3 rounded-xl bg-surface-muted border border-border-neutral">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs"
                      style={{ backgroundColor: newTeam.accentColor }}
                    >
                      {newTeam.shortName || 'TAG'}
                    </div>
                    <span className="text-xs font-mono font-bold text-text-secondary">
                      {newTeam.accentColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Presets for Fast Mobile Tap */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Team Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { color: '#FF851B', label: 'Sports Orange' },
                    { color: '#2563EB', label: 'Royal Blue' },
                    { color: '#059669', label: 'Emerald' },
                    { color: '#DC2626', label: 'Crimson' },
                    { color: '#7C3AED', label: 'Purple' },
                    { color: '#0891B2', label: 'Cyan' },
                    { color: '#D97706', label: 'Amber Gold' },
                    { color: '#1E293B', label: 'Slate Navy' },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setNewTeam({ ...newTeam, accentColor: preset.color })}
                      className={`w-8 h-8 rounded-xl transition-all shadow-xs ${
                        newTeam.accentColor.toLowerCase() === preset.color.toLowerCase()
                          ? 'ring-2 ring-offset-2 ring-brand-orange scale-110'
                          : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                  <div className="flex items-center ml-1">
                    <input
                      type="color"
                      value={newTeam.accentColor}
                      onChange={(e) => setNewTeam({ ...newTeam, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                      title="Custom Color"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    State Association
                  </label>
                  <select
                    value={newTeam.state}
                    onChange={(e) => setNewTeam({ ...newTeam, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Goa">Goa</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Punjab">Punjab</option>
                    <option value="All India">All India Public Sector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    City <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeam.city}
                    onChange={(e) => setNewTeam({ ...newTeam, city: e.target.value })}
                    placeholder="e.g. Mysuru"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  {formErrors.city && <p className="text-xs text-status-live mt-1">{formErrors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Captain Name <span className="text-status-live">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeam.captainName}
                    onChange={(e) => setNewTeam({ ...newTeam, captainName: e.target.value })}
                    placeholder="Captain's full name"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                  {formErrors.captainName && <p className="text-xs text-status-live mt-1">{formErrors.captainName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Coach Name
                  </label>
                  <input
                    type="text"
                    value={newTeam.coachName}
                    onChange={(e) => setNewTeam({ ...newTeam, coachName: e.target.value })}
                    placeholder="Coach name (optional)"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="pt-4 border-t border-border-neutral flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-card active:scale-95 transition-all text-center"
                >
                  Register Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster View Modal - Mobile App Friendly */}
      {viewingRosterTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto pt-safe pb-safe">
          <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={() => setViewingRosterTeam(null)} />
          <div className="relative w-full max-w-md min-h-screen sm:min-h-0 bg-white border-0 sm:border border-border-neutral rounded-none sm:rounded-2xl shadow-elevated p-5 sm:p-6 z-10 my-0 sm:my-8 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border-neutral mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                  style={{ backgroundColor: viewingRosterTeam.logoBg }}
                >
                  {viewingRosterTeam.shortName}
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-text-primary">{viewingRosterTeam.name}</h3>
                  <p className="text-[11px] text-text-secondary">{viewingRosterTeam.city}, {viewingRosterTeam.state}</p>
                </div>
              </div>
              <button onClick={() => setViewingRosterTeam(null)} className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {viewingRosterTeam.roster && viewingRosterTeam.roster.length > 0 ? (
                viewingRosterTeam.roster.map((player) => (
                  <div key={player.id} className="p-2.5 rounded-xl bg-surface-muted border border-border-neutral flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white border border-border-neutral flex items-center justify-center font-mono font-bold text-[11px] text-brand-orange">
                        #{player.number}
                      </span>
                      <div>
                        <span className="font-semibold text-text-primary block">
                          {player.name} {player.isCaptain && <span className="text-amber-600 font-bold">(C)</span>}
                        </span>
                        <span className="text-[10px] text-text-secondary">{player.position}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-secondary py-6 text-center">
                  No players assigned to this roster yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Team?"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
        isDestructive={true}
        confirmLabel="Delete Team"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
