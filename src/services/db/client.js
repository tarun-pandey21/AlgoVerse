/**
 * Shared helpers for reading/writing the signed-in user's data in Supabase.
 *
 * Every query in src/services/db/* filters by the authenticated user's id
 * (`.eq('user_id', userId)`) in addition to Row Level Security, so a bug in
 * the app can never mix one user's rows with another's.
 */
import { supabase } from '../../lib/supabase';

export class DataError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }
}

/** Turn a PostgREST / network error into a clear, user-facing message. */
export function friendlyMessage(error) {
  const msg = `${error?.message ?? ''} ${error?.details ?? ''}`;
  const code = error?.code ?? '';
  if (code === '42P01' || code === 'PGRST205' || /relation .* does not exist|could not find the table|schema cache/i.test(msg)) {
    return 'The AlgoVerse tables were not found in Supabase. Run the SQL files in supabase/migrations, then reload.';
  }
  if (code === '42501' || /permission denied|row-level security/i.test(msg)) {
    return 'Supabase refused this request (permission denied). Check that the migrations, including the security policies, were applied.';
  }
  if (code === 'PGRST301' || code === 'PGRST303' || /jwt|token/i.test(msg)) {
    return 'Your session has expired. Please sign in again.';
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
    return 'Could not reach Supabase. Check your internet connection and try again.';
  }
  return error?.message ? `Database error: ${error.message}` : 'Unexpected database error.';
}

/** Throw a DataError if a Supabase response failed; otherwise return its data. */
export function unwrap(response, action) {
  if (response.error) {
    console.error(`[db] ${action} failed:`, response.error);
    throw new DataError(friendlyMessage(response.error), response.error);
  }
  return response.data;
}

export function db() {
  if (!supabase) throw new DataError('Supabase is not configured.');
  return supabase;
}

/** Run a query builder, converting thrown network errors as well. */
export async function run(builder, action) {
  let response;
  try {
    response = await builder;
  } catch (error) {
    console.error(`[db] ${action} failed:`, error);
    throw new DataError(friendlyMessage(error), error);
  }
  return unwrap(response, action);
}
