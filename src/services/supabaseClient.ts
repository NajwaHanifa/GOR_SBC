import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve config from env or user settings
const SUPABASE_CONFIG_KEY = 'sbc_supabase_config_v1';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return supabaseInstance;
  }
  return null;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      connected: false,
      message: 'URL Supabase dan Anon Key wajib diisi.',
    };
  }

  try {
    const tempClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { error } = await tempClient.from('tables').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        message: `Koneksi Supabase error: ${error.message} (Code: ${error.code})`,
      };
    }
    return {
      connected: true,
      message: 'Koneksi ke Supabase PostgreSQL berhasil terhubung!',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Gagal menghubungi server Supabase: ${err?.message || 'Network error'}`,
    };
  }
}
