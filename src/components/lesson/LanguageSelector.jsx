import { LANGUAGES } from '../../data/languages';
import useCodeLanguage from '../../hooks/useCodeLanguage';
import './LanguageSelector.css';

/**
 * Segmented control for choosing the code language.
 * Every instance reads and writes the same saved preference, so switching
 * here updates every code example on every lesson page.
 */
export default function LanguageSelector({ size = 'md', label = 'Code language' }) {
  const { language, setLanguage } = useCodeLanguage();

  const onKeyDown = (event) => {
    // Arrow keys move between options, as expected for a radio group
    const index = LANGUAGES.findIndex((l) => l.id === language);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % LANGUAGES.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + LANGUAGES.length) % LANGUAGES.length;
    if (next !== null) {
      event.preventDefault();
      setLanguage(LANGUAGES[next].id);
      event.currentTarget.querySelectorAll('button')[next]?.focus();
    }
  };

  return (
    <div className={`lang-select lang-select--${size}`} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {LANGUAGES.map((lang) => {
        const active = lang.id === language;
        return (
          <button
            key={lang.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`lang-select__option ${active ? 'lang-select__option--active' : ''}`}
            data-lang={lang.id}
            onClick={() => setLanguage(lang.id)}
          >
            <span className={`lang-dot lang-dot--${lang.id}`} aria-hidden="true" />
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
