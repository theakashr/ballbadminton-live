import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Phone, 
  Trash2, 
  X, 
  Award 
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { SearchAndFilter, type FilterConfig } from '../../components/admin/common/SearchAndFilter';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { scorerRepository } from '../../repositories/scorerRepository';
import { tournamentRepository } from '../../repositories/tournamentRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ScorerAssignment } from '../../types';

export const AdminScorersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, canAssignScorers, authorizedUsers } = useAuth();
  const toast = useToast();

  const [scorers, setScorers] = useState<ScorerAssignment[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [certFilter, setCertFilter] = useState('');

  const eligibleAccounts = useMemo(() => {
    return authorizedUsers.filter((u) => u.role === 'official_scorer' || u.role === 'super_admin');
  }, [authorizedUsers]);

  // Assign modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newScorer, setNewScorer] = useState({
    scorerName: '',
    scorerEmail: '',
    court: 'Centre Court (Floodlit)',
    matchTitle: '',
    tournamentId: '',
    certificationLevel: 'BBFI Grade A' as const,
    phone: '',
    status: 'assigned' as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ScorerAssignment | null>(null);

  const reload = () => {
    setScorers(scorerRepository.getAll());
    const tourns = tournamentRepository.getAll();
    setTournaments(tourns.map((t) => ({ id: t.id, name: t.name })));
    if (tourns.length > 0 && !newScorer.tournamentId) {
      setNewScorer((prev) => ({ ...prev, tournamentId: tourns[0].id }));
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'assign') {
      setIsAddOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const certLevels = ['BBFI Grade A', 'BBFI Grade B', 'State Umpire', 'National Scorer'];

  const filters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      selectedValue: statusFilter,
      options: [
        { label: 'Scoring Live', value: 'active_scoring' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Available', value: 'available' },
        { label: 'Offline', value: 'offline' },
      ],
    },
    {
      id: 'cert',
      label: 'Certification',
      selectedValue: certFilter,
      options: certLevels.map((c) => ({ label: c, value: c })),
    },
  ];

  const filteredScorers = useMemo(() => {
    return scorers.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.scorerName.toLowerCase().includes(q);
        const matchEmail = s.scorerEmail.toLowerCase().includes(q);
        const matchCourt = s.court.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCourt) return false;
      }
      if (statusFilter && s.status !== statusFilter) return false;
      if (certFilter && s.certificationLevel !== certFilter) return false;
      return true;
    });
  }, [scorers, searchQuery, statusFilter, certFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newScorer.scorerName.trim()) errs.scorerName = 'Scorer name is required.';
    if (!newScorer.scorerEmail.trim()) errs.scorerEmail = 'Scorer email is required.';
    if (!newScorer.court.trim()) errs.court = 'Court name is required.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const tObj = tournaments.find((t) => t.id === newScorer.tournamentId);

    try {
      const created = scorerRepository.create({
        scorerName: newScorer.scorerName.trim(),
        scorerEmail: newScorer.scorerEmail.trim().toLowerCase(),
        court: newScorer.court.trim(),
        matchTitle: newScorer.matchTitle.trim() || undefined,
        tournamentId: newScorer.tournamentId,
        tournamentName: tObj?.name || 'BBFI Tournament',
        certificationLevel: newScorer.certificationLevel,
        phone: newScorer.phone.trim() || undefined,
        status: newScorer.status,
      });

      activityRepository.log({
        action: 'Scorer Assigned to Court',
        entityType: 'scorer',
        entityName: created.scorerName,
        userName: currentUser?.name || 'Admin',
        userEmail: currentUser?.email || 'admin@bbfi.org',
        details: `Assigned ${created.scorerName} to ${created.court} (${created.tournamentName})`,
      });

      toast.success('Court Scorer Assigned', `${created.scorerName} assigned to ${created.court}.`);
      setIsAddOpen(false);
      setNewScorer({
        scorerName: '',
        scorerEmail: '',
        court: 'Court 1 (Red Clay)',
        matchTitle: '',
        tournamentId: tournaments[0]?.id || '',
        certificationLevel: 'BBFI Grade A',
        phone: '',
        status: 'assigned',
      });
      setErrors({});
      reload();
    } catch (err: any) {
      toast.error('Assignment Failed', err.message);
    }
  };

  const handleStatusChange = (scorer: ScorerAssignment, newStatus: ScorerAssignment['status']) => {
    scorerRepository.update(scorer.id, { status: newStatus });
    toast.info('Scorer Status Updated', `${scorer.scorerName} is now marked ${newStatus}.`);
    reload();
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      scorerRepository.delete(deleteTarget.id);
      toast.success('Assignment Removed', `${deleteTarget.scorerName} assignment removed.`);
      setDeleteTarget(null);
      reload();
    }
  };

  const columns: Column<ScorerAssignment>[] = [
    {
      key: 'scorerName',
      header: 'Official Umpire / Scorer',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-plum-800 border border-plum-700 flex items-center justify-center font-bold text-xs text-brand-orange shrink-0">
            {s.scorerName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-soft-white block text-sm">{s.scorerName}</span>
            <span className="text-[11px] text-muted-grey block">{s.scorerEmail}</span>
            {s.phone && (
              <span className="text-[10px] text-muted-grey/80 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-brand-orange" />
                {s.phone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'certificationLevel',
      header: 'BBFI Certification',
      sortable: true,
      render: (s) => (
        <div className="text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-plum-950 border border-plum-700 text-brand-yellow font-medium">
            <Award className="w-3.5 h-3.5 text-brand-yellow" />
            {s.certificationLevel || 'State Umpire'}
          </span>
        </div>
      ),
    },
    {
      key: 'court',
      header: 'Court & Fixture',
      sortable: true,
      render: (s) => (
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-brand-orange block">{s.court}</span>
          <span className="text-soft-white block truncate max-w-[200px]">
            {s.matchTitle || 'Scheduled Match Rotation'}
          </span>
          <span className="text-[11px] text-muted-grey block truncate max-w-[200px]">
            {s.tournamentName}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s) => (
        <StatusBadge status={s.status} size="sm" pulse={s.status === 'active_scoring'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {canAssignScorers && (
            <>
              {s.status !== 'active_scoring' ? (
                <button
                  onClick={() => handleStatusChange(s, 'active_scoring')}
                  className="px-2 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-soft-white transition-colors"
                  title="Mark Active Scoring"
                >
                  Activate
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(s, 'available')}
                  className="px-2 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-muted-grey transition-colors"
                  title="Mark Available"
                >
                  Relieve
                </button>
              )}

              <button
                onClick={() => setDeleteTarget(s)}
                className="p-1.5 rounded-lg text-muted-grey hover:text-brand-coral hover:bg-charcoal-800 transition-colors"
                title="Remove Assignment"
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
            <ClipboardList className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-soft-white tracking-tight">
              Scorer &amp; Umpire Assignments
            </h1>
          </div>
          <p className="text-xs text-muted-grey mt-1">
            Assign certified BBFI Grade A and Grade B umpires to clay courts for official live scoring.
          </p>
        </div>

        {canAssignScorers && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 font-bold text-xs shadow-orange-glow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Assign Court Scorer</span>
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-charcoal-900 border border-plum-800 shadow-subtle">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search scorer name, email, or court..."
          filters={filters}
          onFilterChange={(id, val) => {
            if (id === 'status') setStatusFilter(val);
            if (id === 'cert') setCertFilter(val);
          }}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('');
            setCertFilter('');
          }}
          hasActiveFilters={Boolean(searchQuery || statusFilter || certFilter)}
          totalResults={filteredScorers.length}
          resultLabel="scorers"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredScorers}
        keyExtractor={(s) => s.id}
        pageSize={8}
        emptyTitle="No scorers assigned"
        emptyDescription="No court scorer assignments match the selected filters."
      />

      {/* Assign Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-charcoal-950/85 backdrop-blur-md" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-lg bg-charcoal-900 border border-plum-800 rounded-3xl shadow-elevated p-6 z-10 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-plum-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-plum-800 flex items-center justify-center text-brand-orange">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="text-base font-display font-bold text-soft-white">
                  Assign Court Scorer / Umpire
                </h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-muted-grey hover:text-soft-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                  Select Authorized Scorer Account <span className="text-brand-coral">*</span>
                </label>
                <select
                  value={newScorer.scorerEmail}
                  onChange={(e) => {
                    const found = eligibleAccounts.find((u) => u.email === e.target.value);
                    setNewScorer({
                      ...newScorer,
                      scorerEmail: e.target.value,
                      scorerName: found?.name || newScorer.scorerName,
                      phone: found?.contactNumber || newScorer.phone,
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="">-- Choose Authorized Official Scorer --</option>
                  {eligibleAccounts.map((acc) => (
                    <option key={acc.email} value={acc.email}>
                      {acc.name} ({acc.email}) — {acc.role.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.scorerEmail && <p className="text-xs text-brand-coral mt-1">{errors.scorerEmail}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                    Official Display Name <span className="text-brand-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={newScorer.scorerName}
                    onChange={(e) => setNewScorer({ ...newScorer, scorerName: e.target.value })}
                    placeholder="e.g. B. Ramachandra"
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                  />
                  {errors.scorerName && <p className="text-xs text-brand-coral mt-1">{errors.scorerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                    Certification Level
                  </label>
                  <select
                    value={newScorer.certificationLevel}
                    onChange={(e) => setNewScorer({ ...newScorer, certificationLevel: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="BBFI Grade A">BBFI Grade A (National)</option>
                    <option value="BBFI Grade B">BBFI Grade B</option>
                    <option value="State Umpire">State Association Umpire</option>
                    <option value="National Scorer">National Table Scorer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                  Tournament
                </label>
                <select
                  value={newScorer.tournamentId}
                  onChange={(e) => setNewScorer({ ...newScorer, tournamentId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                    Court Assignment <span className="text-brand-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={newScorer.court}
                    onChange={(e) => setNewScorer({ ...newScorer, court: e.target.value })}
                    placeholder="e.g. Centre Court"
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                  />
                  {errors.court && <p className="text-xs text-brand-coral mt-1">{errors.court}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-soft-white mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={newScorer.phone}
                    onChange={(e) => setNewScorer({ ...newScorer, phone: e.target.value })}
                    placeholder="+91 98400 12345"
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-sm text-soft-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-charcoal-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-muted-grey hover:text-soft-white border border-charcoal-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 font-bold text-xs shadow-orange-glow transition-all"
                >
                  Assign Scorer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Scorer Assignment?"
        message={`Are you sure you want to remove "${deleteTarget?.scorerName}" from ${deleteTarget?.court}?`}
        isDestructive={true}
        confirmLabel="Remove Assignment"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
