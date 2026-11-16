/**
 * Lesson progress for the signed-in user:
 *   section_progress (rows the client inserts/deletes)
 *   topic_progress   (sections_read / completed_at maintained by a trigger;
 *                     the client only records last_visited_at)
 */
import { db, run } from './client';

/** → { [topicId]: { read: [sectionKey…], visitedAt, completedAt } } */
export async function fetchLearning(userId) {
  const [sections, topics] = await Promise.all([
    run(db().from('section_progress').select('topic_id, section_key').eq('user_id', userId), 'load lesson sections'),
    run(db().from('topic_progress').select('topic_id, last_visited_at, completed_at').eq('user_id', userId), 'load topic progress'),
  ]);
  const progress = {};
  for (const row of sections) {
    (progress[row.topic_id] ??= { read: [] }).read.push(row.section_key);
  }
  for (const row of topics) {
    const entry = (progress[row.topic_id] ??= { read: [] });
    if (row.last_visited_at) entry.visitedAt = Date.parse(row.last_visited_at);
    if (row.completed_at) entry.completedAt = Date.parse(row.completed_at);
  }
  return progress;
}

export async function addSections(userId, topicId, sectionKeys) {
  if (!sectionKeys.length) return;
  const rows = sectionKeys.map((key) => ({ user_id: userId, topic_id: topicId, section_key: key }));
  // ON CONFLICT DO NOTHING: marking an already-read section is harmless.
  await run(
    db().from('section_progress').upsert(rows, { onConflict: 'user_id,topic_id,section_key', ignoreDuplicates: true }),
    'save lesson progress',
  );
}

export async function removeSections(userId, topicId, sectionKeys = null) {
  let query = db().from('section_progress').delete().eq('user_id', userId).eq('topic_id', topicId);
  if (sectionKeys) query = query.in('section_key', sectionKeys);
  await run(query, 'remove lesson progress');
}

/**
 * Record that the user opened a lesson: create the topic_progress row if it
 * doesn't exist yet (ON CONFLICT DO NOTHING), then set last_visited_at.
 * Two steps because users may only UPDATE last_visited_at (column grant).
 */
export async function recordVisit(userId, topicId, when = new Date()) {
  const last_visited_at = when.toISOString();
  await run(
    db().from('topic_progress').upsert({ user_id: userId, topic_id: topicId, last_visited_at }, { onConflict: 'user_id,topic_id', ignoreDuplicates: true }),
    'record lesson visit',
  );
  await run(db().from('topic_progress').update({ last_visited_at }).eq('user_id', userId).eq('topic_id', topicId), 'record lesson visit');
}

export async function resetLearning(userId) {
  await run(db().from('section_progress').delete().eq('user_id', userId), 'reset lesson progress');
  await run(db().from('topic_progress').delete().eq('user_id', userId), 'reset topic progress');
}
