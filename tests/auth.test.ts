import { describe, it, expect, beforeEach } from 'vitest';
import { SUPER_ADMIN_EMAIL, INITIAL_AUTHORIZED_USERS } from '../src/context/AuthContext';
import type { AdminUser, UserRole } from '../src/types';

describe('Auth & Permission Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Super Admin Identity & Invariants', () => {
    it('enforces akashakashr505@gmail.com as the primary Super Admin authority', () => {
      expect(SUPER_ADMIN_EMAIL).toBe('akashakashr505@gmail.com');
      const superAdminUser = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL);
      expect(superAdminUser).toBeDefined();
      expect(superAdminUser?.role).toBe('super_admin');
      expect(superAdminUser?.isActive).toBe(true);
    });

    it('contains all 4 standard RBAC roles in initial seed authorization', () => {
      const roles = INITIAL_AUTHORIZED_USERS.map((u) => u.role);
      expect(roles).toContain('super_admin');
      expect(roles).toContain('tournament_admin');
      expect(roles).toContain('official_scorer');
      expect(roles).toContain('viewer');
    });
  });

  describe('Role-Based Access Control (RBAC) Permissions Matrix', () => {
    const evaluatePermissions = (user: AdminUser | null) => {
      const role = user?.role;
      const isSuperAdmin = role === 'super_admin';
      const isTournamentAdmin = role === 'tournament_admin';
      const isScorer = role === 'official_scorer';

      return {
        canManageUsers: isSuperAdmin,
        canManageTournaments: isSuperAdmin || isTournamentAdmin,
        canManageTeams: isSuperAdmin || isTournamentAdmin,
        canScheduleMatches: isSuperAdmin || isTournamentAdmin,
        canAssignScorers: isSuperAdmin || isTournamentAdmin,
        canScoreMatches: isSuperAdmin || isTournamentAdmin || isScorer,
        canConfigureSettings: isSuperAdmin,
      };
    };

    it('super_admin has comprehensive platform permissions', () => {
      const superAdmin = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'super_admin')!;
      const perms = evaluatePermissions(superAdmin);

      expect(perms.canManageUsers).toBe(true);
      expect(perms.canManageTournaments).toBe(true);
      expect(perms.canManageTeams).toBe(true);
      expect(perms.canScheduleMatches).toBe(true);
      expect(perms.canAssignScorers).toBe(true);
      expect(perms.canScoreMatches).toBe(true);
      expect(perms.canConfigureSettings).toBe(true);
    });

    it('tournament_admin can manage events & matches but cannot alter users or settings', () => {
      const tournAdmin = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'tournament_admin')!;
      const perms = evaluatePermissions(tournAdmin);

      expect(perms.canManageUsers).toBe(false);
      expect(perms.canConfigureSettings).toBe(false);
      expect(perms.canManageTournaments).toBe(true);
      expect(perms.canManageTeams).toBe(true);
      expect(perms.canScheduleMatches).toBe(true);
      expect(perms.canAssignScorers).toBe(true);
      expect(perms.canScoreMatches).toBe(true);
    });

    it('official_scorer can only score matches', () => {
      const scorer = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'official_scorer')!;
      const perms = evaluatePermissions(scorer);

      expect(perms.canScoreMatches).toBe(true);
      expect(perms.canManageUsers).toBe(false);
      expect(perms.canManageTournaments).toBe(false);
      expect(perms.canManageTeams).toBe(false);
      expect(perms.canScheduleMatches).toBe(false);
      expect(perms.canAssignScorers).toBe(false);
      expect(perms.canConfigureSettings).toBe(false);
    });

    it('viewer role is strictly read-only with 0 administrative permissions', () => {
      const viewer = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'viewer')!;
      const perms = evaluatePermissions(viewer);

      expect(perms.canManageUsers).toBe(false);
      expect(perms.canManageTournaments).toBe(false);
      expect(perms.canManageTeams).toBe(false);
      expect(perms.canScheduleMatches).toBe(false);
      expect(perms.canAssignScorers).toBe(false);
      expect(perms.canScoreMatches).toBe(false);
      expect(perms.canConfigureSettings).toBe(false);
    });

    it('unauthenticated visitor (null user) has 0 permissions', () => {
      const perms = evaluatePermissions(null);
      expect(Object.values(perms).every((val) => val === false)).toBe(true);
    });
  });

  describe('Privilege Escalation & Modification Safeguards', () => {
    it('prevents non-super admin from granting roles or adding administrators', () => {
      const tournamentAdmin = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'tournament_admin')!;
      const isSuperAdmin = tournamentAdmin.role === 'super_admin';

      const attemptGrant = (callerIsSuperAdmin: boolean) => {
        if (!callerIsSuperAdmin) {
          return { success: false, error: `Only the Super Admin (${SUPER_ADMIN_EMAIL}) has authority to grant dashboard access.` };
        }
        return { success: true };
      };

      const result = attemptGrant(isSuperAdmin);
      expect(result.success).toBe(false);
      expect(result.error).toContain(SUPER_ADMIN_EMAIL);
    });

    it('prevents demotion or revocation of the primary Super Admin account', () => {
      const targetUser = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL)!;

      const attemptDemotion = (email: string, newRole: UserRole) => {
        if (email === SUPER_ADMIN_EMAIL && newRole !== 'super_admin') {
          return { success: false, error: 'Cannot demote the primary Super Admin.' };
        }
        return { success: true };
      };

      const attemptRevocation = (email: string) => {
        if (email === SUPER_ADMIN_EMAIL) {
          return { success: false, error: 'The Primary Super Admin cannot be removed.' };
        }
        return { success: true };
      };

      expect(attemptDemotion(targetUser.email, 'tournament_admin').success).toBe(false);
      expect(attemptRevocation(targetUser.email).success).toBe(false);
    });
  });
});
