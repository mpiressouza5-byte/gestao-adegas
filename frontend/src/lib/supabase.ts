import { createClient } from '@supabase/supabase-js';

const runtimeConfig = window.__APP_CONFIG__;

const supabaseUrl =
  runtimeConfig?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  runtimeConfig?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl?.trim() && supabaseAnonKey?.trim(),
);

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
