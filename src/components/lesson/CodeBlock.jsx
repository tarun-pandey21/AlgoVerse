import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Terminal, Clock, HardDrive } from 'lucide-react';
import RichText from './RichText';
import LanguageSelector from './LanguageSelector';
import { highlightLine } from './highlightCode';
import useCodeLanguage from '../../hooks/useCodeLanguage';
import { fileNameFor } from '../../data/languages';
import './CodeBlock.css';

/** Copies text to the clipboard, with a fallback for older browsers. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * A complete code example shown in the learner's chosen language:
 * highlighted code with line numbers, numbered notes on important lines,
 * the expected output and complexity. Explanations stay the same across
 * languages; only the implementation switches.
 */
export default function CodeBlock({ example }) {
  const { language } = useCodeLanguage();
  // Lessons always provide Java; C++ and Python come from implementations/<topic>.js
  const impl = example.implementations?.[language] ?? example.implementations?.java ?? example;
  const { title, description } = example;
  const { code, notes = [], output } = impl;
  const time = impl.time ?? example.time;
  const space = impl.space ?? example.space;
  const [copied, setCopied] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  const lines = useMemo(() => code.split('\n'), [code]);
  const baseName = example.implementations?.java?.code.match(/public class (\w+)/)?.[1] ?? 'Main';
  const fileName = fileNameFor(baseName, impl === example ? 'java' : language);
  const highlighted = useMemo(() => lines.map((line) => highlightLine(line, language)), [lines, language]);

  // Attach each note to the first line containing its `match` snippet
  const annotated = useMemo(
    () =>
      notes
        .map((note, i) => ({ ...note, number: i + 1, line: lines.findIndex((l) => l.includes(note.match)) }))
        .filter((note) => note.line !== -1),
    [notes, lines]
  );
  const noteByLine = useMemo(() => new Map(annotated.map((n) => [n.line, n])), [annotated]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => setCopied(await copyText(code));

  return (
    <article className="code-example">
      <header className="code-example__head">
        <h4>{title}</h4>
        {description && (
          <p>
            <RichText text={description} />
          </p>
        )}
      </header>

      <div className="code-block">
        <div className="code-block__bar">
          <LanguageSelector size="sm" />
          <span className="code-block__file">{fileName}</span>
          <button className="code-block__copy" onClick={handleCopy} aria-label="Copy code">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="code-block__pre" tabIndex={0} aria-label={`${fileName} source code`}>
          <code>
            {lines.map((line, i) => {
              const note = noteByLine.get(i);
              const lineClass = [
                'code-line',
                note ? 'code-line--noted' : '',
                note && activeNote === note.number ? 'code-line--active' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <span key={i} className={lineClass}>
                  <span className="code-line__number" aria-hidden="true">
                    {note ? <span className="code-line__marker">{note.number}</span> : i + 1}
                  </span>
                  <span className="code-line__content">
                    {highlighted[i].map((token, t) => (
                      <span key={t} className={`tok-${token.type}`}>
                        {token.text}
                      </span>
                    ))}
                    {'\n'}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {annotated.length > 0 && (
        <div className="code-notes">
          <p className="code-notes__title">Important lines</p>
          <ol>
            {annotated.map((note) => (
              <li
                key={note.number}
                onMouseEnter={() => setActiveNote(note.number)}
                onMouseLeave={() => setActiveNote(null)}
              >
                <span className="code-notes__marker">{note.number}</span>
                <span>
                  <span className="code-notes__line">Line {note.line + 1}</span> <RichText text={note.text} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="code-meta">
        <div className="code-output">
          <p className="code-output__label">
            <Terminal size={14} /> Expected output
          </p>
          <pre>{output}</pre>
        </div>
        <div className="code-complexity">
          <div>
            <Clock size={15} />
            <span>Time</span>
            <strong>{time}</strong>
          </div>
          <div>
            <HardDrive size={15} />
            <span>Space</span>
            <strong>{space}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
