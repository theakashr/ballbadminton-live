import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser, UserRole } from '../types';
import { activityRepository } from '../repositories/activityRepository';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const USERS_STORAGE_KEY = 'bbfi_auth_users_v1';
const ACTIVE_USER_STORAGE_KEY = 'bbfi_active_user_v1';

export const SUPER_ADMIN_EMAIL = 'akashakashr505@gmail.com';

export const INITIAL_AUTHORIZED_USERS: AdminUser[] = [
  {
    id: 'user-super-admin',
    email: SUPER_ADMIN_EMAIL,
    name: 'Akash R',
    role: 'super_admin',
    grantedBy: 'System Primary Authority',
    grantedAt: '2026-10-01T00:00:00Z',
    avatarBg: '#FF851B',
    isActive: true,
    designation: 'Platform Super Admin & Owner',
    contactNumber: '+91 98400 12345',
  },
  {
    id: 'user-tournament-admin-1',
    email: 'organizer.coimbatore@bbfi.org',
    name: 'R. Soundararajan',
    role: 'tournament_admin',
    grantedBy: SUPER_ADMIN_EMAIL,
    grantedAt: '2026-10-15T10:00:00Z',
    avatarBg: '#623B78',
    isActive: true,
    designation: 'Tournament Director - 70th Nationals',
    assignedTournaments: ['tourn-70-senior-nat'],
    contactNumber: '+91 94432 55443',
  },
  {
    id: 'user-scorer-1',
    email: 'ramachandra.umpire@bbfi.org',
    name: 'B. Ramachandra',
    role: 'official_scorer',
    grantedBy: SUPER_ADMIN_EMAIL,
    grantedAt: '2026-10-18T14:30:00Z',
    avatarBg: '#FF5B45',
    isActive: true,
    designation: 'BBFI Chief Umpire & Live Scorer',
    contactNumber: '+91 98410 88776',
  },
  {
    id: 'user-viewer-1',
    email: 'sports.press@thehindu.co.in',
    name: 'K. S. Narayanan',
    role: 'viewer',
    grantedBy: SUPER_ADMIN_EMAIL,
    grantedAt: '2026-10-20T09:00:00Z',
    avatarBg: '#3F3B52',
    isActive: true,
    designation: 'Sports Media Analyst (Read-Only)',
  }
];

export interface AuthContextType {
  currentUser: AdminUser | null;
  authorizedUsers: AdminUser[];
  isDevMode: boolean;
  authBackend: 'supabase' | 'demo';
  isLoading: boolean;
  grantAccess: (data: {
    email: string;
    name: string;
    role: UserRole;
    designation?: string;
    contactNumber?: string;
    assignedTournaments?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  revokeAccess: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, newRole: UserRole, assignedTournaments?: string[]) => Promise<{ success: boolean; error?: string }>;
  switchActiveUser: (userIdOrEmail: string) => void;
  loginWithEmail: (email: string) => { success: boolean; error?: string };
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetUsersToDefault: () => void;
  // Role & permission checkers
  isSuperAdmin: boolean;
  isTournamentAdmin: boolean;
  isScorer: boolean;
  canManageUsers: boolean;
  canManageTournaments: boolean;
  canManageTeams: boolean;
  canScheduleMatches: boolean;
  canAssignScorers: boolean;
  canScoreMatches: boolean;
  canConfigureSettings: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authBackend, setAuthBackend] = useState<'supabase' | 'demo'>(
    isSupabaseConfigured() ? 'supabase' : 'demo'
  );

  const [authorizedUsers, setAuthorizedUsers] = useState<AdminUser[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_AUTHORIZED_USERS));
    return INITIAL_AUTHORIZED_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const storedActive = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (storedActive) return JSON.parse(storedActive);
    } catch {
      // fallback
    }
    const superAdmin = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL) || INITIAL_AUTHORIZED_USERS[0];
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(superAdmin));
    return superAdmin;
  });

  // Supabase Auth Integration & Session Listener
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthBackend('demo');
      setIsLoading(false);
      return;
    }

    const client = supabase;

    const initSupabaseAuth = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        } else if (session?.user) {
          // Fetch verified profile from database
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const adminUser: AdminUser = {
              id: profile.id,
              email: profile.email,
              name: profile.full_name,
              role: profile.role as UserRole,
              grantedBy: profile.email === SUPER_ADMIN_EMAIL ? 'Root Setup' : 'Admin Grant',
              grantedAt: profile.created_at,
              avatarBg: profile.role === 'super_admin' ? '#FF851B' : '#623B78',
              isActive: profile.is_active,
              designation: profile.designation,
              contactNumber: profile.phone,
            };
            setCurrentUser(adminUser);
            setAuthBackend('supabase');
          }
        }
      } catch (err) {
        console.warn('Auth initialization error, using fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSupabaseAuth();

    // Listen to live Auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            role: profile.role as UserRole,
            grantedBy: profile.email === SUPER_ADMIN_EMAIL ? 'Root Setup' : 'Admin Grant',
            grantedAt: profile.created_at,
            avatarBg: profile.role === 'super_admin' ? '#FF851B' : '#623B78',
            isActive: profile.is_active,
            designation: profile.designation,
            contactNumber: profile.phone,
          });
          setAuthBackend('supabase');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync users to localStorage in demo mode
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  // Sync active user to localStorage in demo mode
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // Permission evaluations
  const role = currentUser?.role;
  const isSuperAdmin = role === 'super_admin';
  const isTournamentAdmin = role === 'tournament_admin';
  const isScorer = role === 'official_scorer';

  const canManageUsers = isSuperAdmin;
  const canManageTournaments = isSuperAdmin || isTournamentAdmin;
  const canManageTeams = isSuperAdmin || isTournamentAdmin;
  const canScheduleMatches = isSuperAdmin || isTournamentAdmin;
  const canAssignScorers = isSuperAdmin || isTournamentAdmin;
  const canScoreMatches = isSuperAdmin || isTournamentAdmin || isScorer;
  const canConfigureSettings = isSuperAdmin;

  // Real Supabase Sign-in with Email & Password
  const signInWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            role: profile.role as UserRole,
            grantedBy: profile.email === SUPER_ADMIN_EMAIL ? 'Root Setup' : 'Admin Grant',
            grantedAt: profile.created_at,
            avatarBg: profile.role === 'super_admin' ? '#FF851B' : '#623B78',
            isActive: profile.is_active,
            designation: profile.designation,
            contactNumber: profile.phone,
          });
          setAuthBackend('supabase');
          return { success: true };
        }
      }
      return { success: true };
    }

    // Demo mode fallback
    return loginWithEmail(email);
  };

  // Real Supabase User Sign-Up
  const signUpWithPassword = async (
    email: string, 
    password: string, 
    fullName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    return { success: false, error: 'Sign up requires Supabase connection.' };
  };

  // Grant access to a new person
  const grantAccess = async (data: {
    email: string;
    name: string;
    role: UserRole;
    designation?: string;
    contactNumber?: string;
    assignedTournaments?: string[];
  }): Promise<{ success: boolean; error?: string }> => {
    if (!canManageUsers) {
      return { 
        success: false, 
        error: `Only the Super Admin (${SUPER_ADMIN_EMAIL}) has authority to grant dashboard access.` 
      };
    }

    const emailTrimmed = data.email.trim().toLowerCase();
    if (!emailTrimmed) {
      return { success: false, error: 'Email address is required.' };
    }

    // If Supabase is connected, execute PostgreSQL security definer grant_user_role function
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.rpc('grant_user_role', {
        p_target_email: emailTrimmed,
        p_new_role: data.role,
        p_designation: data.designation?.trim(),
      });

      if (error) {
        // If user profile doesn't exist yet, we still record it locally in authorized list
        console.info('Supabase rpc note:', error.message);
      }
    }

    if (authorizedUsers.some((u) => u.email.toLowerCase() === emailTrimmed)) {
      return { success: false, error: `User with email "${emailTrimmed}" already has access.` };
    }

    const newUser: AdminUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: emailTrimmed,
      name: data.name.trim() || emailTrimmed.split('@')[0],
      role: data.role,
      grantedBy: currentUser?.email || SUPER_ADMIN_EMAIL,
      grantedAt: new Date().toISOString(),
      avatarBg: data.role === 'super_admin' ? '#FF851B' : data.role === 'tournament_admin' ? '#623B78' : '#FF5B45',
      isActive: true,
      designation: data.designation?.trim(),
      contactNumber: data.contactNumber?.trim(),
      assignedTournaments: data.assignedTournaments || [],
    };

    const updated = [newUser, ...authorizedUsers];
    setAuthorizedUsers(updated);

    activityRepository.log({
      action: 'Dashboard Access Granted',
      entityType: 'user',
      entityName: newUser.name,
      userName: currentUser?.name || 'Super Admin',
      userEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
      details: `Granted ${data.role} access to ${newUser.email}`,
    });

    return { success: true };
  };

  // Revoke user access
  const revokeAccess = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!canManageUsers) {
      return { success: false, error: 'Only Super Admin can revoke access.' };
    }

    const targetUser = authorizedUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return { success: false, error: 'The Primary Super Admin cannot be removed.' };
    }

    if (isSupabaseConfigured() && supabase) {
      await supabase.rpc('grant_user_role', {
        p_target_email: targetUser.email,
        p_new_role: 'viewer',
        p_designation: 'Access Revoked',
      });
    }

    const updated = authorizedUsers.filter((u) => u.id !== userId);
    setAuthorizedUsers(updated);

    if (currentUser?.id === userId) {
      const superAdmin = updated.find((u) => u.email === SUPER_ADMIN_EMAIL) || null;
      setCurrentUser(superAdmin);
    }

    activityRepository.log({
      action: 'Dashboard Access Revoked',
      entityType: 'user',
      entityName: targetUser.name,
      userName: currentUser?.name || 'Super Admin',
      userEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
      details: `Revoked access for ${targetUser.email}`,
    });

    return { success: true };
  };

  // Update user role and assigned tournaments
  const updateUserRole = async (
    userId: string, 
    newRole: UserRole, 
    assignedTournaments?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!canManageUsers) {
      return { success: false, error: 'Only Super Admin can update roles.' };
    }

    const target = authorizedUsers.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User not found.' };
    }

    if (target.email === SUPER_ADMIN_EMAIL && newRole !== 'super_admin') {
      return { success: false, error: 'Cannot demote the primary Super Admin.' };
    }

    if (isSupabaseConfigured() && supabase) {
      await supabase.rpc('grant_user_role', {
        p_target_email: target.email,
        p_new_role: newRole,
      });
    }

    const updated = authorizedUsers.map((u) => 
      u.id === userId 
        ? { 
            ...u, 
            role: newRole,
            assignedTournaments: assignedTournaments !== undefined ? assignedTournaments : u.assignedTournaments,
          } 
        : u
    );
    setAuthorizedUsers(updated);

    if (currentUser?.id === userId) {
      setCurrentUser({ 
        ...currentUser, 
        role: newRole,
        assignedTournaments: assignedTournaments !== undefined ? assignedTournaments : currentUser.assignedTournaments,
      });
    }

    activityRepository.log({
      action: 'User Role Modified',
      entityType: 'user',
      entityName: target.name,
      userName: currentUser?.name || 'Super Admin',
      userEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
      details: `Changed role from ${target.role} to ${newRole}`,
    });

    return { success: true };
  };

  // Switch active user session (simulates logging in as any authorized user for development testing)
  const switchActiveUser = (userIdOrEmail: string) => {
    const found = authorizedUsers.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
    }
  };

  // Login with email (development fallback)
  const loginWithEmail = (email: string) => {
    const emailTrimmed = email.trim().toLowerCase();
    const found = authorizedUsers.find((u) => u.email.toLowerCase() === emailTrimmed);
    if (!found) {
      return {
        success: false,
        error: `No authorization found for "${emailTrimmed}". Contact Super Admin (${SUPER_ADMIN_EMAIL}) to request access.`
      };
    }
    setCurrentUser(found);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const resetUsersToDefault = () => {
    setAuthorizedUsers(INITIAL_AUTHORIZED_USERS);
    const superAdmin = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL) || INITIAL_AUTHORIZED_USERS[0];
    setCurrentUser(superAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authorizedUsers,
        isDevMode: authBackend === 'demo',
        authBackend,
        isLoading,
        grantAccess,
        revokeAccess,
        updateUserRole,
        switchActiveUser,
        loginWithEmail,
        signInWithPassword,
        signUpWithPassword,
        logout,
        resetUsersToDefault,
        isSuperAdmin,
        isTournamentAdmin,
        isScorer,
        canManageUsers,
        canManageTournaments,
        canManageTeams,
        canScheduleMatches,
        canAssignScorers,
        canScoreMatches,
        canConfigureSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
