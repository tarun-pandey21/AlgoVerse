import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Authentication state (Supabase Auth).
 *
 * status:
 *   'disabled'   – Supabase isn't configured; the app runs in local mode
 *   'loading'    – restoring a saved session
 *   'signed_out' – configured, nobody signed in
 *   'signed_in'  – `user` and `session` are set
 *
 * Passwords are sent straight to Supabase Auth and are never stored by
 * AlgoVerse. Sessions are kept and refreshed by supabase-js.
 */

const AuthContext = createContext(null);

const siteUrl = () => window.location.origin;

/** Turn Supabase Auth errors into friendly messages. */
export function authErrorMessage(error) {
  const message = error?.message ?? '';
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for the link.';
  if (/user already registered/i.test(message)) return 'An account with this email already exists. Try signing in.';
  if (/password should be at least/i.test(message)) return message;
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  if (/fetch|network/i.test(message)) return 'Could not reach the sign-in service. Check your connection.';
  return message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'disabled');
  const [recovery, setRecovery] = useState(false); // arrived from a password-reset link

  useEffect(() => {
    if (!supabase) return undefined;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setStatus(data.session ? 'signed_in' : 'signed_out');
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(next);
      setStatus(next ? 'signed_in' : 'signed_out');
    });
    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, displayName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: `${siteUrl()}/` },
    });
    if (error) throw error;
    // With email confirmation on, there is no session until the link is clicked.
    return { needsConfirmation: !data.session };
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/reset` });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovery(false);
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      enabled: isSupabaseConfigured,
      status,
      session,
      user: session?.user ?? null,
      recovery,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [status, session, recovery, signIn, signUp, signOut, sendPasswordReset, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** Display name for the signed-in user (metadata → email). */
export function userDisplayName(user) {
  return user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
}
