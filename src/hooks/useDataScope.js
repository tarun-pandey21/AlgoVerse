import { useAuth } from '../context/AuthContext';

/**
 * Where the learner's personal data comes from:
 *
 *   'account' – signed in: everything is read from / written to Supabase,
 *               filtered by this user's id (and protected by RLS).
 *   'device'  – not signed in (or Supabase not configured): data is kept in
 *               this browser's localStorage only.
 *   'pending' – the saved session is still being restored; nothing is shown
 *               yet, so one user's data never flashes for another.
 */
export default function useDataScope() {
  const { status, user } = useAuth();
  if (status === 'loading') return { mode: 'pending', userId: null };
  if (status === 'signed_in' && user) return { mode: 'account', userId: user.id };
  return { mode: 'device', userId: null };
}
