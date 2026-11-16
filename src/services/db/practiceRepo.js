/**
 * Coding practice data for the signed-in user.
 *
 *   submissions      – judged submissions. Inserted ONLY by the API server
 *                      after Judge0 returns a verdict (users cannot insert).
 *   problem_progress – solved/attempted per problem (maintained by a trigger)
 *   code_drafts      – the user's unsaved code per problem + language
 */
import { db, run } from './client';

const HISTORY_LIMIT = 500; // recent submissions shown in history lists
const ACCEPTED_LIMIT = 10000; // accepted timestamps used for streaks and activity

const toSubmission = (row) => ({
  id: row.id,
  problemId: row.problem_id,
  language: row.language,
  verdict: row.verdict,
  passed: row.passed,
  total: row.total,
  runtimeMs: row.runtime_ms,
  submittedAt: row.created_at,
});

export async function fetchPractice(userId) {
  const [recent, accepted, progress] = await Promise.all([
    run(
      db()
        .from('submissions')
        .select('id, problem_id, language, verdict, passed, total, runtime_ms, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      'load submissions',
    ),
    run(
      db()
        .from('submissions')
        .select('problem_id, created_at')
        .eq('user_id', userId)
        .eq('verdict', 'accepted')
        .order('created_at', { ascending: false })
        .limit(ACCEPTED_LIMIT),
      'load accepted submissions',
    ),
    run(
      db().from('problem_progress').select('problem_id, status, attempts, accepted_count, solved_at, last_attempted_at').eq('user_id', userId),
      'load problem progress',
    ),
  ]);
  return {
    submissions: recent.map(toSubmission).reverse(), // oldest → newest, like local mode
    accepted: accepted.map((row) => ({ problemId: row.problem_id, submittedAt: row.created_at })),
    progress,
  };
}

export async function resetPracticeData(userId) {
  await run(db().from('code_drafts').delete().eq('user_id', userId), 'delete code drafts');
  await run(db().from('submissions').delete().eq('user_id', userId), 'delete submissions');
  await run(db().from('problem_progress').delete().eq('user_id', userId), 'delete problem progress');
}

export async function fetchDraft(userId, problemId, language) {
  const row = await run(
    db().from('code_drafts').select('code').eq('user_id', userId).eq('problem_id', problemId).eq('language', language).maybeSingle(),
    'load code draft',
  );
  return row?.code ?? null;
}

export async function saveDraftRow(userId, problemId, language, code) {
  await run(
    db().from('code_drafts').upsert({ user_id: userId, problem_id: problemId, language, code }, { onConflict: 'user_id,problem_id,language' }),
    'save code draft',
  );
}

export async function deleteDraftRow(userId, problemId, language) {
  await run(db().from('code_drafts').delete().eq('user_id', userId).eq('problem_id', problemId).eq('language', language), 'delete code draft');
}
