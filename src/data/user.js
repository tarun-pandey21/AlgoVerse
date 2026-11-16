/**
 * Default learning preferences for a new learner.
 *
 * There is deliberately NO default name, email or headline: when signed in
 * these come from the user's Supabase profile; otherwise the learner can
 * enter them in Settings (saved on this device only).
 */
export const defaultProfile = {
  name: '',
  email: '',
  role: '',
  dailyGoal: 3,
  preferredLanguage: 'Java', // code examples: 'Java' | 'C++' | 'Python'
  emailReminders: true,
  weeklyReport: true,
  streakAlerts: false,
};
