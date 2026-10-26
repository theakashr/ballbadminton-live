import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const forcedMode = import.meta.env.VITE_DATA_LAYER_MODE as string | undefined;

/**
 * Checks if the environment contains real, non-placeholder Supabase credentials.
 */
export const isSupabaseConfigured = (): boolean => {
  if (forcedMode === 'demo') return false;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
    return false;
  }
  return supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;
};

/**
 * Validates if an identifier adheres to the standard UUID v4 format.
 * Used to guard PostgreSQL RPC parameters from malformed or prototype-mock string IDs.
 */
export const isUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Shared Supabase Client singleton.
 * Returns null if Supabase environment variables are missing or placeholders.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Current operating data layer mode.
 */
export const getDataLayerMode = (): 'supabase' | 'demo' => {
  return isSupabaseConfigured() ? 'supabase' : 'demo';
};

/**
 * Tests live connection to Supabase backend and measures latency.
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      error: 'Supabase environment variables not configured in .env.local',
    };
  }

  const start = performance.now();
  try {
    const { error } = await supabase.from('tournaments').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error && error.code !== 'PGRST116') {
      return { connected: false, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Network connection failed' };
  }
};
