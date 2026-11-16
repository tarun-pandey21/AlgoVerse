import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultProfile } from '../data/user';
import { LANGUAGES, getLanguage, languageIdFromLabel } from '../data/languages';
import { useAuth } from './AuthContext';
import useDataScope from '../hooks/useDataScope';
import { fetchProfile, updatePreferencesRow, updateProfileRow } from '../services/db/profileRepo';

/**
 * The learner's profile & preferences.
 *
 *   Signed in → `profiles` + `user_preferences` rows in Supabase (RLS, own row
 *               only). Email comes from Supabase Auth and is read-only here.
 *   Otherwise → this browser's localStorage.
 *
 * profile: { name, email, role, dailyGoal, preferredLanguage ('Java'|'C++'|'Python'),
 *            emailReminders, weeklyReport, streakAlerts }
 * status:  'loading' | 'ready' | 'error'
 */

const STORAGE_KEY = 'algoverse.profile.v2';
// Older versions stored a sample learner's name/email/headline under this key.
// Only the learner's own preferences are carried over from it; identity
// fields are dropped.
const LEGACY_KEY = 'algoverse.profile';
const PREFERENCE_KEYS = ['dailyGoal', 'preferredLanguage', 'emailReminders', 'weeklyReport', 'streakAlerts'];
const UserContext = createContext(null);

const PROFILE_FIELDS = { name: 'display_name', role: 'headline' };
const PREFERENCE_FIELDS = {
  dailyGoal: 'daily_goal',
  preferredLanguage: 'preferred_language',
  emailReminders: 'email_reminders',
  weeklyReport: 'weekly_report',
  streakAlerts: 'streak_alerts',
};

function loadDeviceProfile() {
  try {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null') ?? {};
      saved = Object.fromEntries(PREFERENCE_KEYS.filter((k) => k in legacy).map((k) => [k, legacy[k]]));
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    const profile = { ...defaultProfile, ...saved };
    if (!LANGUAGES.some((l) => l.label === profile.preferredLanguage)) profile.preferredLanguage = defaultProfile.preferredLanguage;
    return profile;
  } catch {
    return { ...defaultProfile };
  }
}

function saveDeviceProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable – keep the in-memory value */
  }
}

function fromRows({ profile, preferences }, email) {
  return {
    name: profile.display_name ?? '',
    email: email ?? '',
    role: profile.headline ?? '',
    dailyGoal: preferences.daily_goal,
    preferredLanguage: getLanguage(preferences.preferred_language).label,
    emailReminders: preferences.email_reminders,
    weeklyReport: preferences.weekly_report,
    streakAlerts: preferences.streak_alerts,
  };
}

/** Split UI field updates into profiles / user_preferences column updates. */
function toRows(updates) {
  const profile = {};
  const preferences = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key in PROFILE_FIELDS) profile[PROFILE_FIELDS[key]] = String(value ?? '').trim();
    else if (key === 'preferredLanguage') preferences.preferred_language = languageIdFromLabel(value);
    else if (key === 'dailyGoal') preferences.daily_goal = Number(value);
    else if (key in PREFERENCE_FIELDS) preferences[PREFERENCE_FIELDS[key]] = Boolean(value);
  }
  return { profile, preferences };
}

export function UserProvider({ children }) {
  const { user } = useAuth();
  const { mode, userId } = useDataScope();
  const [state, setState] = useState({ status: 'loading', profile: { ...defaultProfile }, error: null, scope: null });
  const [writeError, setWriteError] = useState(null);

  const scope = mode === 'account' ? `account:${userId}` : mode;

  const load = useCallback(async () => {
    if (mode === 'pending') {
      setState({ status: 'loading', profile: { ...defaultProfile }, error: null, scope });
      return;
    }
    if (mode === 'device') {
      setState({ status: 'ready', profile: loadDeviceProfile(), error: null, scope });
      return;
    }
    // Account: never show another scope's values while loading.
    setState({ status: 'loading', profile: { ...defaultProfile }, error: null, scope });
    try {
      const rows = await fetchProfile(userId);
      setState((s) => (s.scope === scope ? { status: 'ready', profile: fromRows(rows, user?.email), error: null, scope } : s));
    } catch (error) {
      setState((s) => (s.scope === scope ? { status: 'error', profile: { ...defaultProfile }, error: error.message, scope } : s));
    }
  }, [mode, userId, scope, user?.email]);

  useEffect(() => {
    setWriteError(null);
    load();
  }, [load]);

  /**
   * Apply profile/preference changes. Resolves when saved; rejects (and
   * restores the previous values) if the database write fails.
   */
  const updateProfile = useCallback(
    async (updates) => {
      const previous = state.profile;
      const next = { ...previous, ...updates };
      setState((s) => ({ ...s, profile: next }));
      if (mode !== 'account') {
        saveDeviceProfile(next);
        return;
      }
      try {
        const rows = toRows(updates);
        await Promise.all([updateProfileRow(userId, rows.profile), updatePreferencesRow(userId, rows.preferences)]);
        setWriteError(null);
      } catch (error) {
        setState((s) => (s.scope === scope ? { ...s, profile: previous } : s));
        setWriteError(`Your settings were not saved: ${error.message}`);
        throw error;
      }
    },
    [state.profile, mode, userId, scope],
  );

  /** Restore default preferences (keeps name and headline). */
  const resetProfile = useCallback(async () => {
    const { name, email, role, ...preferenceDefaults } = defaultProfile;
    if (mode !== 'account') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setState((s) => ({ ...s, profile: { ...defaultProfile } }));
      return;
    }
    await updateProfile(preferenceDefaults);
  }, [mode, updateProfile]);

  const value = useMemo(
    () => ({
      profile: state.profile,
      status: state.status,
      error: state.error,
      source: mode === 'account' ? 'account' : 'device',
      reload: load,
      writeError,
      clearWriteError: () => setWriteError(null),
      updateProfile,
      resetProfile,
    }),
    [state, mode, load, writeError, updateProfile, resetProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside <UserProvider>');
  return context;
}

/** "Ada Lovelace" -> "AL" */
export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** First name for greetings, or '' when the learner hasn't given a name. */
export function firstNameOf(name = '') {
  return name.trim().split(/\s+/)[0] ?? '';
}
