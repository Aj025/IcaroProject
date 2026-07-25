import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[auth] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — auth disabled (dev mode only).',
  );
}

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isAuthEnabled = supabase !== null;
