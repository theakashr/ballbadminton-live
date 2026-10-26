import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  X
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { SearchAndFilter, type FilterConfig } from '../../components/admin/common/SearchAndFilter';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { playerRepository, type EnrichedPlayer } from '../../repositories/playerRepository';
import { teamRepository } from '../../repositories/teamRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminPlayersPage: React.FC = () => {
  const { currentUser, canManageTeams } = useAuth();
  const toast = useToast();

  const [players, setPlayers] = useState<EnrichedPlayer[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; state: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 7,
    position: 'Front / Net' as const,
    teamId: '',
    isCaptain: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<EnrichedPlayer | null>(null);

  const reload = () => {
    setPlayers(playerRepository.getAll());
    const tList = teamRepository.getAll();
    setTeams(tList.map((t) => ({ id: t.id, name: t.name, state: t.state })));
    if (tList.length > 0 && !newPlayer.teamId) {
      setNewPlayer((prev) => ({ ...prev, teamId: tList[0].id }));
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const positions = ['Front / Net', 'Centre / Pivot', 'Base / Deep', 'Server'];

  const filters: FilterConfig[] = [
    {
      id: 'position',
      label: 'Position',
      selectedValue: positionFilter,
      options: positions.map((p) => ({ label: p, value: p })),
    },
    {
      id: 'team',
      label: 'Team',
      selectedValue: teamFilter,
      options: teams.map((t) => ({ label: t.name, value: t.id })),
    },
  ];

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchTeam = p.teamName.toLowerCase().includes(q);
        if (!matchName && !matchTeam) return false;
      }
      if (positionFilter && p.position !== positionFilter) return false;
      if (teamFilter && p.teamId !== teamFilter) return false;
      return true;
    });
  }, [players, searchQuery, positionFilter, teamFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newPlayer.name.trim()) errs.name = 'Player name is required.';
    if (!newPlayer.teamId) errs.teamId = 'Please select a team.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const selectedTeam = teams.find((t) => t.id === newPlayer.teamId);

    try {
      const created = playerRepository.create({
        name: newPlayer.name.trim(),
        number: Number(newPlayer.number) || 1,
        position: newPlayer.position,
        teamId: newPlayer.teamId,
        teamName: selectedTeam?.name || 'Club Team',
        state: selectedTeam?.state || 'Tamil Nadu',
        isCaptain: newPlayer.isCaptain,
      });

      activityRepository.log({
        action: 'Player Added',
        entityType: 'team',
        entityName: created.name,
        userName: currentUser?.name || 'Admin',
        userEmail: currentUser?.email || 'admin@bbfi.org',
        details: `Assigned #${created.number} ${created.name} (${created.position}) to ${created.teamName}`,
      });

      toast.success('Player Registered', `${created.name} assigned to ${created.teamName}.`);
      setIsAddOpen(false);
      setNewPlayer({
        name: '',
        number: 7,
        position: 'Front / Net',
        teamId: teams[0]?.id || '',
        isCaptain: false,
      });
      setErrors({});
      reload();
    } catch (err: any) {
      toast.error('Failed to register player', err.message);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      playerRepository.delete(deleteTarget.id);
      toast.success('Player Removed', `${deleteTarget.name} removed from roster.`);
      setDeleteTarget(null);
      reload();
    }
  };

  const columns: Column<EnrichedPlayer>[] = [
    {
      key: 'name',
      header: 'Player & Jersey',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-surface-muted border border-border-neutral flex items-center justify-center font-mono font-bold text-xs text-brand-orange shrink-0">
            #{p.number}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary text-sm">{p.name}</span>
              {p.isCaptain && (
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                  CAPTAIN
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-secondary block mt-0.5">{p.state}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Court Position',
      sortable: true,
      render: (p) => {
        let badgeColor = 'bg-surface-muted text-text-primary border-border-neutral';
        if (p.position === 'Front / Net') badgeColor = 'bg-brand-soft text-brand-orange border-brand-orange/20';
        if (p.position === 'Centre / Pivot') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        if (p.position === 'Server') badgeColor = 'bg-red-50 text-status-live border-red-200';
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
            {p.position}
          </span>
        );
      },
    },
    {
      key: 'teamName',
      header: 'Team Affiliation',
      sortable: true,
      render: (p) => (
        <div className="text-xs">
          <span className="font-medium text-text-primary block">{p.teamName}</span>
          <span className="text-[11px] text-text-secondary">{p.state}</span>
        </div>
      ),
    },
    {
      key: 'pointsScored',
      header: 'Stats',
      render: (p) => (
        <div className="text-xs">
          <span className="font-bold text-brand-orange">{p.pointsScored || 0} pts</span>
          <span className="text-text-secondary text-[11px] block">{p.matchesPlayed || 0} matches</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end">
          {canManageTeams && (
            <button
              onClick={() => setDeleteTarget(p)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-status-live hover:bg-red-50 transition-colors"
              title="Remove Player"
            >
              <Trash2 className="w-4 h-4" />
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
            <UserCheck className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Player Registry
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Registered Ball Badminton smashers, pivots, deep defenders, and servers.
          </p>
        </div>

        {canManageTeams && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Player</span>
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-white border border-border-neutral shadow-card">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search player name or team..."
          filters={filters}
          onFilterChange={(id, val) => {
            if (id === 'position') setPositionFilter(val);
            if (id === 'team') setTeamFilter(val);
          }}
          onResetFilters={() => {
            setSearchQuery('');
            setPositionFilter('');
            setTeamFilter('');
          }}
          hasActiveFilters={Boolean(searchQuery || positionFilter || teamFilter)}
          totalResults={filteredPlayers.length}
          resultLabel="players"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredPlayers}
        keyExtractor={(p) => p.id}
        pageSize={10}
        emptyTitle="No players found"
        emptyDescription="No players match the chosen filters. Click 'Add Player' to register one."
      />

      {/* Add Player Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-elevated p-6 z-10 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border-neutral mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-soft border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-display font-bold text-text-primary">
                  Add Player to Squad
                </h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Player Full Name <span className="text-status-live">*</span>
                </label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="e.g. K. Vignesh"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
                {errors.name && <p className="text-xs text-status-live mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Jersey Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Position
                  </label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Front / Net">Front / Net (Smasher)</option>
                    <option value="Centre / Pivot">Centre / Pivot</option>
                    <option value="Base / Deep">Base / Deep (Defender)</option>
                    <option value="Server">Server</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Team Affiliation <span className="text-status-live">*</span>
                </label>
                <select
                  value={newPlayer.teamId}
                  onChange={(e) => setNewPlayer({ ...newPlayer, teamId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.state})
                    </option>
                  ))}
                </select>
                {errors.teamId && <p className="text-xs text-status-live mt-1">{errors.teamId}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCaptainCheck"
                  checked={newPlayer.isCaptain}
                  onChange={(e) => setNewPlayer({ ...newPlayer, isCaptain: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-orange bg-white border-border-neutral focus:ring-brand-orange"
                />
                <label htmlFor="isCaptainCheck" className="text-xs font-medium text-text-primary cursor-pointer">
                  Assign as Team Captain (C)
                </label>
              </div>

              <div className="pt-4 border-t border-border-neutral flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all"
                >
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Player?"
        message={`Remove "${deleteTarget?.name}" from ${deleteTarget?.teamName}?`}
        isDestructive={true}
        confirmLabel="Remove Player"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
