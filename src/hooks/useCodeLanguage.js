import { useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getLanguage, languageIdFromLabel } from '../data/languages';

/**
 * The learner's preferred code language ('java' | 'cpp' | 'python').
 * Stored with the learner's preferences (Supabase when signed in, else
 * localStorage), so a change on any lesson page
 * applies to every code example across the site and to Settings.
 */
export default function useCodeLanguage() {
  const { profile, updateProfile } = useUser();
  const language = languageIdFromLabel(profile.preferredLanguage);

  const setLanguage = useCallback(
    (id) =>
      // A failed save is reported by UserContext (writeError) and reverted.
      updateProfile({ preferredLanguage: getLanguage(id).label }).catch(() => {}),
    [updateProfile]
  );

  return { language, setLanguage };
}
