import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Database, 
  UserPlus, 
  Trash2, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Shield, 
  Download,
  Upload,
  X,
  Server,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { DataTable, type Column } from '../../components/admin/common/DataTable';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { ConfirmDialog } from '../../components/admin/common/ConfirmDialog';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { settingsRepository } from '../../repositories/settingsRepository';
import { tournamentRepository } from '../../repositories/tournamentRepository';
import { teamRepository } from '../../repositories/teamRepository';
import { playerRepository } from '../../repositories/playerRepository';
import { matchRepository } from '../../repositories/matchRepository';
import { scorerRepository } from '../../repositories/scorerRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';
import { migrationService, type MigrationSummary } from '../../services/migrationService';
import type { AdminUser, UserRole, ScoringSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { 
    currentUser, 
    authorizedUsers, 
    canManageUsers, 
    grantAccess, 
    revokeAccess, 
    updateUserRole, 
    switchActiveUser, 
    resetUsersToDefault 
  } = useAuth();
  
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'access' | 'scoring' | 'storage'>('access');

  // Scoring Settings State
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(() => settingsRepository.get());

  // Tournaments list for scoping
  const allTournaments = tournamentRepository.getAll();

  // Grant Access Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'tournament_admin' as UserRole,
    designation: '',
    contactNumber: '',
    assignedTournaments: [] as string[],
  });
  const [grantErrors, setGrantErrors] = useState<Record<string, string>>({});

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null);

  // Edit role modal
  const [editRoleUser, setEditRoleUser] = useState<AdminUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('tournament_admin');
  const [editAssignedTournaments, setEditAssignedTournaments] = useState<string[]>([]);

  // Reset all data confirm
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Supabase Connection & Migration State
  const [connTest, setConnTest] = useState<{
    tested: boolean;
    testing: boolean;
    connected: boolean;
    latencyMs?: number;
    error?: string;
  }>({
    tested: false,
    testing: false,
    connected: false,
  });

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);

  const handleTestConnection = async () => {
    setConnTest({ tested: false, testing: true, connected: false });
    const res = await testSupabaseConnection();
    setConnTest({
      tested: true,
      testing: false,
      connected: res.connected,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  };

  const handlePushToSupabase = async () => {
    setIsMigrating(true);
    const summary = await migrationService.pushLocalPrototypeToSupabase();
    setMigrationSummary(summary);
    setIsMigrating(false);
    if (summary.success) {
      toast.success('Migration Completed', `Pushed ${summary.counts.tournaments} tournaments and ${summary.counts.teams} teams to Supabase.`);
    } else {
      toast.error('Migration Notice', summary.errors[0] || 'Could not complete Supabase push.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = migrationService.importLocalPrototypeJSON(content);
      if (res.success) {
        toast.success('Import Successful', `Imported ${res.importedCount} records into local storage.`);
        window.location.reload();
      } else {
        toast.error('Import Failed', res.error);
      }
    };
    reader.readAsText(file);
  };

  // Handle Grant Access Submission
  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newUserData.name.trim()) errs.name = 'Full name is required.';
    if (!newUserData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
      errs.email = 'Please provide a valid email format.';
    }

    if (Object.keys(errs).length > 0) {
      setGrantErrors(errs);
      return;
    }

    const res = await grantAccess(newUserData);
    if (!res.success) {
      setGrantErrors({ email: res.error || 'Failed to grant access.' });
      return;
    }

    toast.success(
      'Access Granted',
      `${newUserData.name} (${newUserData.email}) has been granted ${newUserData.role.replace('_', ' ')} access.`
    );
    setIsGrantModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      role: 'tournament_admin',
      designation: '',
      contactNumber: '',
      assignedTournaments: [],
    });
    setGrantErrors({});
  };

  // Handle Revoke Access
  const handleRevokeConfirm = async () => {
    if (revokeTarget) {
      const res = await revokeAccess(revokeTarget.id);
      if (res.success) {
        toast.info('Access Revoked', `Privileges for ${revokeTarget.email} were revoked.`);
      } else {
        toast.error('Revoke Failed', res.error);
      }
      setRevokeTarget(null);
    }
  };

  // Handle Update Role & Tournament Scope
  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editRoleUser) {
      const res = await updateUserRole(editRoleUser.id, selectedNewRole, editAssignedTournaments);
      if (res.success) {
        toast.success('Role & Scope Updated', `${editRoleUser.name} credentials updated.`);
        setEditRoleUser(null);
      } else {
        toast.error('Update Failed', res.error);
      }
    }
  };

  // Save Scoring Rules
  const handleSaveScoringRules = (e: React.FormEvent) => {
    e.preventDefault();
    settingsRepository.update(scoringSettings);
    activityRepository.log({
      action: 'Scoring Rules Updated',
      entityType: 'system',
      entityName: 'BBFI Rule Configuration',
      userName: currentUser?.name || 'Admin',
      userEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
      details: `${scoringSettings.pointsPerSet} pts/set, ${scoringSettings.servingSystem.replace('_', ' ')} serving`,
    });
    toast.success('Settings Saved', 'Official Ball Badminton match rules updated.');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      superAdmin: SUPER_ADMIN_EMAIL,
      tournaments: tournamentRepository.getAll(),
      teams: teamRepository.getAll(),
      players: playerRepository.getAll(),
      matches: matchRepository.getAll(),
      scorers: scorerRepository.getAll(),
      users: authorizedUsers,
      settings: settingsRepository.get(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ball-badminton-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup Exported', 'Local prototype repository downloaded as JSON.');
  };

  // Reset all local storage prototype data
  const handleResetAllData = () => {
    tournamentRepository.resetToDefaults();
    teamRepository.resetToDefaults();
    playerRepository.resetToDefaults();
    matchRepository.resetToDefaults();
    scorerRepository.resetToDefaults();
    activityRepository.resetToDefaults();
    settingsRepository.reset();
    resetUsersToDefault();
    setScoringSettings(settingsRepository.get());
    toast.success('Full Reset Complete', 'All local data reset to initial BBFI demo seeds.');
    setIsResetConfirmOpen(false);
  };

  // Columns for Authorized Users Table
  const userColumns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Authorized Official',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 shadow-sm"
            style={{ backgroundColor: u.avatarBg || '#FF851B' }}
          >
            {u.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary text-sm">{u.name}</span>
              {u.email === SUPER_ADMIN_EMAIL && (
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                  SUPER ADMIN
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-secondary block">{u.email}</span>
            {u.designation && (
              <span className="text-[10px] text-text-secondary/80 block mt-0.5">{u.designation}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (u) => <StatusBadge status={u.role} size="sm" />,
    },
    {
      key: 'grantedBy',
      header: 'Authority / Granted By',
      sortable: true,
      render: (u) => (
        <div className="text-xs">
          <span className="font-medium text-text-primary block truncate max-w-[180px]">
            {u.grantedBy}
          </span>
          <span className="text-[10px] text-text-secondary block">
            {new Date(u.grantedAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tournament Scope',
      render: (u) => {
        if (!u.assignedTournaments || u.assignedTournaments.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Global Scope
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {u.assignedTournaments.map((tid) => {
              const tour = allTournaments.find((t) => t.id === tid);
              return (
                <span
                  key={tid}
                  className="px-1.5 py-0.5 rounded bg-brand-soft text-brand-orange text-[10px] font-bold border border-brand-orange/20 truncate"
                  title={tour?.name || tid}
                >
                  {tour?.name.split(' ')[0] || tid}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => {
        const isCurrent = currentUser?.id === u.id;
        const isSuper = u.email === SUPER_ADMIN_EMAIL;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick Switch Button (for simulation testing) */}
            <button
              onClick={() => switchActiveUser(u.id)}
              disabled={isCurrent}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-brand-soft text-brand-orange border border-brand-orange/30 pointer-events-none'
                  : 'bg-surface-muted hover:bg-border-neutral text-text-primary border border-border-neutral'
              }`}
              title="Simulate session as this persona"
            >
              {isCurrent ? 'Active Now' : 'Switch Persona'}
            </button>

            {canManageUsers && !isSuper && (
              <>
                <button
                  onClick={() => {
                    setEditRoleUser(u);
                    setSelectedNewRole(u.role);
                    setEditAssignedTournaments(u.assignedTournaments || []);
                  }}
                  className="px-2 py-1 rounded-lg bg-surface-muted hover:bg-border-neutral text-xs text-text-secondary hover:text-text-primary border border-border-neutral transition-colors"
                  title="Modify Role"
                >
                  Edit Role
                </button>

                <button
                  onClick={() => setRevokeTarget(u)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-status-live hover:bg-red-50 transition-colors"
                  title="Revoke Dashboard Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Platform &amp; Scoring Configuration
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Super Admin user access governance, official Ball Badminton 5s scoring parameters, and local data controls.
          </p>
        </div>

        {activeTab === 'access' && canManageUsers && (
          <button
            onClick={() => setIsGrantModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Grant Access to Person</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-neutral">
        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'access'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Access Control &amp; Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('scoring')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'scoring'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ball Badminton Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'storage'
              ? 'border-brand-orange text-brand-orange bg-brand-soft'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Prototype Storage &amp; Cloud Roadmap</span>
        </button>
      </div>

      {/* Tab 1: Access Control & Permissions */}
      {activeTab === 'access' && !canManageUsers && (
        <div className="p-8 rounded-2xl bg-white border border-border-neutral text-center space-y-4 max-w-xl mx-auto shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-text-primary">Owner-Only Access Governance</h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Platform user access governance, role elevation, and tournament assignments are strictly restricted to the Super Admin &amp; Owner (<strong className="text-brand-orange">{SUPER_ADMIN_EMAIL}</strong>).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral inline-block text-[11px] text-text-secondary">
            Current active session: <strong className="text-text-primary">{currentUser?.name}</strong> ({currentUser?.email}) • Role: <span className="font-semibold text-brand-orange">{currentUser?.role?.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      )}

      {activeTab === 'access' && canManageUsers && (
        <div className="space-y-6">
          {/* Highlight Card for akashakashr505@gmail.com */}
          <div className="p-5 rounded-2xl bg-white border border-border-neutral shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-display font-bold text-text-primary">
                      Super Admin &amp; Authority Architecture
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                      Primary Admin &amp; Owner
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Designated Primary Authority: <strong className="text-brand-orange">{SUPER_ADMIN_EMAIL}</strong>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed max-w-2xl">
                    As specified, <strong>{SUPER_ADMIN_EMAIL}</strong> holds full Super Admin permissions to manage tournaments, configure match scoring, and grant or revoke access to other persons.
                  </p>
                </div>
              </div>

              {canManageUsers && (
                <button
                  onClick={() => setIsGrantModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Grant Access to Person</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Explanations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-border-neutral shadow-card">
              <StatusBadge status="super_admin" size="sm" />
              <p className="font-semibold text-text-primary mt-2">Super Admin</p>
              <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                Full authority: create tournaments, teams, schedule fixtures, configure rules, and grant/revoke access.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-border-neutral shadow-card">
              <StatusBadge status="tournament_admin" size="sm" />
              <p className="font-semibold text-text-primary mt-2">Tournament Admin</p>
              <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                Can create and manage tournaments, verify team rosters, schedule matches, and assign umpires.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-border-neutral shadow-card">
              <StatusBadge status="official_scorer" size="sm" />
              <p className="font-semibold text-text-primary mt-2">Official Scorer</p>
              <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                Authorized court umpire access to input live rally points, set scores, and service hands.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-border-neutral shadow-card">
              <StatusBadge status="viewer" size="sm" />
              <p className="font-semibold text-text-primary mt-2">Viewer</p>
              <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                Read-only analytics and match summary access for media representatives and observers.
              </p>
            </div>
          </div>

          {/* Authorized Users Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Authorized Platform Users ({authorizedUsers.length})
              </h3>
              <span className="text-xs text-text-secondary">
                Active Session: <strong className="text-brand-orange">{currentUser?.name}</strong> ({currentUser?.email})
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <DataTable
                columns={userColumns}
                data={authorizedUsers}
                keyExtractor={(u) => u.id}
                pageSize={10}
              />
            </div>

            {/* Mobile-First Card View */}
            <div className="block md:hidden space-y-3">
              {authorizedUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isSuper = u.email === SUPER_ADMIN_EMAIL;
                return (
                  <div key={u.id} className="p-4 rounded-xl bg-white border border-border-neutral shadow-card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 shadow-sm"
                          style={{ backgroundColor: u.avatarBg || '#FF851B' }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-text-primary text-sm">{u.name}</span>
                            {isSuper && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                                OWNER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-secondary block break-all">{u.email}</span>
                        </div>
                      </div>
                      <StatusBadge status={u.role} size="sm" />
                    </div>

                    {u.designation && (
                      <p className="text-xs text-text-secondary bg-surface-muted px-2.5 py-1.5 rounded-lg border border-border-neutral">
                        {u.designation}
                      </p>
                    )}

                    <div className="space-y-1 text-[11px] text-text-secondary border-t border-border-neutral pt-2">
                      <div className="flex justify-between">
                        <span>Authority:</span>
                        <span className="font-medium text-text-primary truncate max-w-[160px]">{u.grantedBy}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tournament Scope:</span>
                        <span className="font-medium text-text-primary">
                          {u.assignedTournaments && u.assignedTournaments.length > 0 ? (
                            <span className="text-brand-orange font-bold">
                              {u.assignedTournaments.length} Assigned
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Global (All)</span>
                          )}
                        </span>
                      </div>
                      {u.assignedTournaments && u.assignedTournaments.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {u.assignedTournaments.map((tid) => {
                            const tour = allTournaments.find((t) => t.id === tid);
                            return (
                              <span
                                key={tid}
                                className="px-1.5 py-0.5 rounded bg-brand-soft text-brand-orange text-[9px] font-bold border border-brand-orange/20 truncate"
                              >
                                {tour?.name || tid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border-neutral">
                      <button
                        onClick={() => switchActiveUser(u.id)}
                        disabled={isCurrent}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                          isCurrent
                            ? 'bg-brand-soft text-brand-orange border border-brand-orange/30 pointer-events-none'
                            : 'bg-surface-muted hover:bg-border-neutral text-text-primary border border-border-neutral'
                        }`}
                      >
                        {isCurrent ? 'Active Now' : 'Switch Persona'}
                      </button>

                      {canManageUsers && !isSuper && (
                        <>
                          <button
                            onClick={() => {
                              setEditRoleUser(u);
                              setSelectedNewRole(u.role);
                              setEditAssignedTournaments(u.assignedTournaments || []);
                            }}
                            className="px-3 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-neutral transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRevokeTarget(u)}
                            className="p-2 rounded-xl text-text-secondary hover:text-status-live hover:bg-red-50 border border-border-neutral transition-colors"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scoring Rules Configuration */}
      {activeTab === 'scoring' && (
        <form onSubmit={handleSaveScoringRules} className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-2xl bg-white border border-border-neutral space-y-5 shadow-card">
            <div>
              <h3 className="text-base font-display font-bold text-text-primary">
                Official Ball Badminton Federation of India (BBFI) Rules
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Default regulations applied when creating matches and live scoreboards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Points Per Set
                </label>
                <select
                  value={scoringSettings.pointsPerSet}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, pointsPerSet: parseInt(e.target.value) as 29 | 35 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  <option value={29}>29 Points (BBFI Traditional Standard)</option>
                  <option value={35}>35 Points (Invitational Extended Set)</option>
                </select>
                <p className="text-[11px] text-text-secondary mt-1">
                  Ball Badminton traditional games are contested up to 29 points.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Sets Per Match
                </label>
                <select
                  value={scoringSettings.bestOfSets}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, bestOfSets: parseInt(e.target.value) as 3 | 5 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  <option value={3}>Best of 3 Sets (Standard Championship)</option>
                  <option value={5}>Best of 5 Sets (Finals Option)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Service System
                </label>
                <select
                  value={scoringSettings.servingSystem}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, servingSystem: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  <option value="two_hands">Two Hands (1st Hand &amp; 2nd Hand - Traditional)</option>
                  <option value="single_hand">Single Hand Rotation</option>
                </select>
                <p className="text-[11px] text-text-secondary mt-1">
                  In traditional 5s, each team has two hands to serve before service switches.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Max Deuce Point Cap
                </label>
                <input
                  type="number"
                  value={scoringSettings.maxOvertimeCap}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, maxOvertimeCap: parseInt(e.target.value) || 33 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Upper ceiling for deciding rallies at 28-28 (typically 33).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Official Ball Specification
                </label>
                <input
                  type="text"
                  disabled
                  value={scoringSettings.ballSpecification}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-border-neutral text-sm text-text-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Standard Court Surface
                </label>
                <select
                  value={scoringSettings.courtSurface}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, courtSurface: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  <option value="Outdoor Red Clay">Outdoor Red Clay (12m x 24m)</option>
                  <option value="Indoor Synthetic Mat">Indoor Synthetic Mat</option>
                  <option value="Outdoor Sand/Grit">Outdoor Sand / Grit</option>
                </select>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoPublishCheck"
                  checked={scoringSettings.autoPublishLiveScores}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, autoPublishLiveScores: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-orange bg-white border-border-neutral focus:ring-brand-orange"
                />
                <label htmlFor="autoPublishCheck" className="text-xs font-medium text-text-primary cursor-pointer">
                  Auto-publish court umpire score updates to live scoreboard
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinRequiredCheck"
                  checked={scoringSettings.umpirePinRequired}
                  onChange={(e) => setScoringSettings({ ...scoringSettings, umpirePinRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-orange bg-white border-border-neutral focus:ring-brand-orange"
                />
                <label htmlFor="pinRequiredCheck" className="text-xs font-medium text-text-primary cursor-pointer">
                  Require official umpire verification PIN for match finalization
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-border-neutral flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Scoring Rules</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Supabase Backend & Data Migration */}
      {activeTab === 'storage' && (
        <div className="space-y-6 max-w-3xl">
          {/* Supabase Connection Status Card */}
          <div className="p-6 rounded-2xl bg-white border border-border-neutral space-y-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-display font-bold text-text-primary">
                      Supabase PostgreSQL &amp; Auth Architecture
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isSupabaseConfigured()
                        ? 'bg-emerald-50 text-status-success border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isSupabaseConfigured() ? 'Supabase Connected' : 'Local Prototype Active'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    PostgreSQL schema with Row Level Security (RLS), transactional scoring RPCs, and Realtime pub/sub.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connTest.testing}
                className="px-3.5 py-1.5 rounded-xl bg-surface-muted hover:bg-border-neutral text-xs font-semibold text-text-primary border border-border-neutral transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Activity className="w-3.5 h-3.5 text-brand-orange" />
                <span>{connTest.testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Test result banner */}
            {connTest.tested && (
              <div className={`p-3.5 rounded-xl text-xs border flex items-start gap-2.5 ${
                connTest.connected
                  ? 'bg-emerald-50 border-emerald-200 text-status-success'
                  : 'bg-red-50 border-red-200 text-status-live'
              }`}>
                {connTest.connected ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {connTest.connected
                      ? `Successfully connected to Supabase backend (Latency: ${connTest.latencyMs}ms)`
                      : 'Connection Failed'}
                  </p>
                  {connTest.error && (
                    <p className="text-[11px] text-text-secondary mt-0.5">{connTest.error}</p>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span className="text-text-secondary">Target Database:</span>
                <span className="font-mono text-text-primary font-medium">
                  {isSupabaseConfigured() ? 'Supabase PostgreSQL (Cloud)' : 'Browser LocalStorage (Prototype Fallback)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span className="text-text-secondary">Row Level Security (RLS):</span>
                <span className="font-semibold text-status-success">13 Tables Protected</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span className="text-text-secondary">Scoring Transactions:</span>
                <span className="font-mono text-brand-orange font-medium">record_point_rpc (Idempotent &amp; Concurrency Checked)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-secondary">Realtime Engine:</span>
                <span className="font-semibold text-text-primary">Supabase Realtime (postgres_changes)</span>
              </div>
            </div>

            {/* One-click Migration Button */}
            <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">Migrate Local Prototype to Supabase</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Batch-upload tournaments, teams, rosters, and scoring configs into your live PostgreSQL tables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePushToSupabase}
                  disabled={isMigrating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>{isMigrating ? 'Migrating...' : 'Push to Supabase'}</span>
                </button>
              </div>

              {migrationSummary && (
                <div className="p-3 rounded-lg bg-white border border-border-neutral text-[11px] text-text-secondary space-y-1">
                  <p className="font-semibold text-text-primary">Migration Summary:</p>
                  <p>Tournaments: {migrationSummary.counts.tournaments} • Teams: {migrationSummary.counts.teams} • Players: {migrationSummary.counts.players}</p>
                  {migrationSummary.errors.length > 0 && (
                    <p className="text-status-live">{migrationSummary.errors[0]}</p>
                  )}
                </div>
              )}
            </div>

            {/* Backup & Restore Tools */}
            <div className="pt-4 border-t border-border-neutral flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary text-xs font-semibold border border-border-neutral transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Export JSON</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary text-xs font-semibold border border-border-neutral transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-status-live text-xs font-semibold border border-red-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Seeds</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={() => setIsGrantModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-border-neutral rounded-2xl shadow-elevated p-6 z-10 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border-neutral mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-soft border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-text-primary">
                    Grant Dashboard Access
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Authorizing official by Super Admin ({SUPER_ADMIN_EMAIL})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsGrantModalOpen(false)} className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Full Name <span className="text-status-live">*</span>
                </label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
                {grantErrors.name && <p className="text-xs text-status-live mt-1">{grantErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Email Address <span className="text-status-live">*</span>
                </label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="official@bbfi.org or person@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
                {grantErrors.email && <p className="text-xs text-status-live mt-1">{grantErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Access Role Level
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  >
                    <option value="tournament_admin">Tournament Admin</option>
                    <option value="official_scorer">Official Court Scorer</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newUserData.contactNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, contactNumber: e.target.value })}
                    placeholder="+91 94432 11223"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Official Designation / Notes
                </label>
                <input
                  type="text"
                  value={newUserData.designation}
                  onChange={(e) => setNewUserData({ ...newUserData, designation: e.target.value })}
                  placeholder="e.g. Coimbatore District Secretary / Court 2 Umpire"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Assigned Tournament Scope (Optional)
                </label>
                <p className="text-[11px] text-text-secondary mb-2">
                  Select specific tournaments to restrict this official, or leave all unselected for global platform access.
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border-neutral bg-surface-muted">
                  {allTournaments.map((t) => (
                    <label key={t.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUserData.assignedTournaments.includes(t.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNewUserData((prev) => ({
                            ...prev,
                            assignedTournaments: checked
                              ? [...prev.assignedTournaments, t.id]
                              : prev.assignedTournaments.filter((id) => id !== t.id),
                          }));
                        }}
                        className="rounded border-border-neutral text-brand-orange focus:ring-brand-orange h-4 w-4"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-text-primary block truncate">{t.name}</span>
                        <span className="text-[10px] text-text-secondary">{t.city} • {t.format}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary">
                <span className="text-text-primary font-semibold block mb-0.5">Permission Notice:</span>
                This grant will authorize the user immediately in local repository. They will be able to sign in or be simulated from the active persona switcher.
              </div>

              <div className="pt-4 border-t border-border-neutral flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all"
                >
                  Confirm &amp; Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={() => setEditRoleUser(null)} />
          <div className="relative w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-elevated p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-display font-bold text-text-primary mb-2">
              Update Role &amp; Scope for {editRoleUser.name}
            </h3>
            <p className="text-xs text-text-secondary mb-4">{editRoleUser.email}</p>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Select New Privilege Level
                </label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="tournament_admin">Tournament Admin</option>
                  <option value="official_scorer">Official Court Scorer</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1">
                  Assigned Tournament Scope (Optional)
                </label>
                <p className="text-[11px] text-text-secondary mb-2">
                  Select specific tournaments to restrict this official, or leave all unselected for global access.
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border-neutral bg-surface-muted">
                  {allTournaments.map((t) => (
                    <label key={t.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAssignedTournaments.includes(t.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditAssignedTournaments((prev) =>
                            checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)
                          );
                        }}
                        className="rounded border-border-neutral text-brand-orange focus:ring-brand-orange h-4 w-4"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-text-primary block truncate">{t.name}</span>
                        <span className="text-[10px] text-text-secondary">{t.city} • {t.format}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border-neutral flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditRoleUser(null)}
                  className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revokeTarget)}
        title="Revoke Dashboard Access?"
        message={`Are you sure you want to revoke privileges for ${revokeTarget?.name} (${revokeTarget?.email})?`}
        isDestructive={true}
        confirmLabel="Revoke Access"
        onConfirm={handleRevokeConfirm}
        onClose={() => setRevokeTarget(null)}
      />

      {/* Reset All Demo Data Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset All Local Prototype Data?"
        message="This will reset all tournaments, teams, players, matches, scorer assignments, and user privileges back to factory demo defaults."
        isDestructive={true}
        confirmLabel="Reset Everything"
        onConfirm={handleResetAllData}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
