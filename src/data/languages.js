/**
 * Programming languages available for code examples.
 * Java is the default. The learner's choice is saved as
 * profile.preferredLanguage (UserContext → localStorage), so the selector in
 * lessons and the Settings page always agree.
 */
export const LANGUAGES = [
  { id: 'java', label: 'Java', extension: 'java' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
  { id: 'python', label: 'Python', extension: 'py' },
];

export const DEFAULT_LANGUAGE = 'java';
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

export function getLanguage(id) {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

/** Maps a saved label ("C++") to an id ("cpp"); unknown values fall back to Java. */
export function languageIdFromLabel(label) {
  return LANGUAGES.find((l) => l.label === label)?.id ?? DEFAULT_LANGUAGE;
}

/** "BinarySearch" → BinarySearch.java / binary_search.cpp / binary_search.py */
export function fileNameFor(baseName, languageId) {
  const lang = getLanguage(languageId);
  if (lang.id === 'java') return `${baseName}.java`;
  const snake = baseName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
  return `${snake}.${lang.extension}`;
}
