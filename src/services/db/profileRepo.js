/**
 * profiles + user_preferences for the signed-in user.
 * Both rows are created by the database's sign-up trigger.
 */
import { db, run, DataError } from './client';

const PROFILE_COLUMNS = 'id, display_name, headline';
const PREF_COLUMNS = 'preferred_language, daily_goal, email_reminders, weekly_report, streak_alerts';

export async function fetchProfile(userId) {
  const [profile, preferences] = await Promise.all([
    run(db().from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle(), 'load profile'),
    run(db().from('user_preferences').select(PREF_COLUMNS).eq('user_id', userId).maybeSingle(), 'load preferences'),
  ]);
  if (!profile || !preferences) {
    throw new DataError(
      'Your account has no profile row yet. This happens when the user signed up before the database migrations were applied. Run the migrations, then sign up again (or ask an admin to create the profile).',
    );
  }
  return { profile, preferences };
}

export async function updateProfileRow(userId, fields) {
  if (!Object.keys(fields).length) return;
  await run(db().from('profiles').update(fields).eq('id', userId), 'update profile');
}

export async function updatePreferencesRow(userId, fields) {
  if (!Object.keys(fields).length) return;
  await run(db().from('user_preferences').update(fields).eq('user_id', userId), 'update preferences');
}
