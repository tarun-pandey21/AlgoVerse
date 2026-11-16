/**
 * Trusted write: store a judged submission for the signed-in user.
 *
 * Runs with the Supabase SECRET key (bypasses RLS) because users are not
 * allowed to insert submissions themselves, so verdicts can't be forged.
 * The user id ALWAYS comes from the verified access token (req.user.id).
 */
import { getAdminClient } from '../supabase.js';

function maxOf(results, field, scale = 1) {
  const values = results.map((r) => r?.[field]).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return values.length ? Math.round(Math.max(...values) * scale) : null;
}

/** Resolves to { saved: true, submission } or { saved: false, reason, message }. */
export async function saveSubmission({ userId, problemId, language, code, result }) {
  const admin = getAdminClient();
  if (!admin) {
    return {
      saved: false,
      reason: 'not_configured',
      message: 'Submissions can’t be saved to your account because SUPABASE_SECRET_KEY is not set on the server.',
    };
  }
  const row = {
    user_id: userId,
    problem_id: problemId,
    language,
    verdict: result.verdict,
    passed: result.passed,
    total: result.total,
    runtime_ms: maxOf(result.results ?? [], 'time', 1000),
    memory_kb: maxOf(result.results ?? [], 'memory'),
    code,
  };
  try {
    const { data, error } = await admin.from('submissions').insert(row).select('id, created_at').single();
    if (error) {
      console.error('[db] saving submission failed:', error.message);
      const missing = /does not exist|schema cache|could not find/i.test(error.message ?? '');
      return {
        saved: false,
        reason: 'database_error',
        message: missing
          ? 'Your submission was judged but not saved: the AlgoVerse tables are missing in Supabase (run the migrations).'
          : 'Your submission was judged but could not be saved to your account. Please try again.',
      };
    }
    return { saved: true, submission: { id: data.id, createdAt: data.created_at } };
  } catch (error) {
    console.error('[db] saving submission failed:', error?.message ?? error);
    return { saved: false, reason: 'database_error', message: 'Your submission was judged but Supabase could not be reached to save it.' };
  }
}
