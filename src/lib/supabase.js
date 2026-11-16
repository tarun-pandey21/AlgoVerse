/**
 * Browser Supabase client.
 *
 * Uses ONLY the project URL and the *publishable* key (VITE_SUPABASE_URL,
 * VITE_SUPABASE_PUBLISHABLE_KEY). Those are designed to be public: every
 * query the browser makes is limited by Row Level Security to the signed-in
 * user's own rows. The secret / service-role key must never appear here
 * (vite.config.js refuses to build if it does).
 *
 * When the variables are missing, `supabase` is null and AlgoVerse keeps
 * working in local mode (localStorage), exactly as before Phase 6.
 */
import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // email confirmation & password-recovery links
        flowType: 'pkce',
      },
    })
  : null;

/** The current user's access token, or null when signed out / not configured. */
export async function getAccessToken() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Headers for calls to our own Express API (/api/*). */
export async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
