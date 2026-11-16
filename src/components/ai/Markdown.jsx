import { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { highlightLine } from '../lesson/highlightCode';
import '../lesson/CodeBlock.css'; // token colours (.tok-*)
import './Markdown.css';

/**
 * Safe Markdown renderer for Claude's answers.
 *
 * Everything becomes React elements – no HTML string is ever injected, so
 * model output can't run scripts or add markup. Supports what the tutor uses:
 * headings, paragraphs, bold/italic/inline code, links (http/https only),
 * ordered/unordered (nested) lists, blockquotes, tables, horizontal rules and
 * fenced code blocks with Java/C++/Python highlighting. An unclosed code
 * fence (while streaming) renders as code up to the end.
 */

const LANGUAGE_ALIASES = { java: 'java', cpp: 'cpp', 'c++': 'cpp', cc: 'cpp', c: 'cpp', h: 'cpp', python: 'python', py: 'python', python3: 'python' };
const LANGUAGE_LABELS = { java: 'Java', cpp: 'C++', python: 'Python' };

/* ------------------------------------------------------------ inline */

const INLINE = /(`+)([\s\S]*?[^`])\1(?!`)|\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\s][^*]*?)\*|(?<![\w])_([^_\s][^_]*?)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text, keyPrefix = 'i') {
  const out = [];
  let last = 0;
  let match;
  let k = 0;
  // A fresh regex per call: renderInline recurses (bold inside a link, …),
  // and sharing one global regex's lastIndex across calls would loop forever.
  const pattern = new RegExp(INLINE.source, 'g');
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${k++}`;
    const [, , code, bold, bold2, italic, italic2, linkText, href] = match;
    if (code !== undefined) out.push(<code key={key} className="inline-code">{code.trim()}</code>);
    else if (bold !== undefined || bold2 !== undefined) out.push(<strong key={key}>{renderInline(bold ?? bold2, key)}</strong>);
    else if (italic !== undefined || italic2 !== undefined) out.push(<em key={key}>{renderInline(italic ?? italic2, key)}</em>);
    else if (linkText !== undefined) {
      out.push(
        /^https?:\/\//i.test(href) ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
            {renderInline(linkText, key)}
          </a>
        ) : (
          <span key={key}>{renderInline(linkText, key)}</span>
        ),
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ------------------------------------------------------------- blocks */

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const isTableSeparator = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const splitRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

function parseList(lines, start) {
  // Returns [listNode, nextIndex]. Nested by indentation.
  const baseIndent = lines[start].match(LIST_ITEM)[1].length;
  const ordered = /\d/.test(lines[start].match(LIST_ITEM)[2]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(LIST_ITEM);
    if (m && m[1].length === baseIndent) {
      items.push({ text: m[3], children: [] });
      i += 1;
    } else if (m && m[1].length > baseIndent && items.length) {
      const [child, next] = parseList(lines, i);
      items.at(-1).children.push(child);
      i = next;
    } else if (!m && line.trim() && /^\s{2,}/.test(line) && items.length) {
      items.at(-1).text += ` ${line.trim()}`; // continuation line
      i += 1;
    } else if (!line.trim() && i + 1 < lines.length && lines[i + 1].match(LIST_ITEM)?.[1].length >= baseIndent) {
      i += 1; // blank line between items
    } else break;
  }
  const startNumber = ordered ? parseInt(lines[start].match(LIST_ITEM)[2], 10) : undefined;
  return [{ type: 'list', ordered, start: startNumber, items }, i];
}

export function parseBlocks(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const fence = line.match(/^\s*(```+|~~~+)\s*([\w+#.-]*)/);
    if (fence) {
      const close = fence[1];
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(close)) body.push(lines[i++]);
      const closed = i < lines.length;
      i += 1;
      blocks.push({ type: 'code', lang: fence[2].toLowerCase(), code: body.join('\n'), closed });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].replace(/#+\s*$/, '') });
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
      blocks.push({ type: 'quote', children: parseBlocks(quote.join('\n')) });
      continue;
    }
    if (LIST_ITEM.test(line)) {
      const [list, next] = parseList(lines, i);
      blocks.push(list);
      i = next;
      continue;
    }
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(```|~~~)/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !LIST_ITEM.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      para.push(lines[i++].trim());
    }
    blocks.push({ type: 'paragraph', text: para.join(' ') });
  }
  return blocks;
}

/* ------------------------------------------------------------ render */

function CodeFence({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const language = LANGUAGE_ALIASES[lang];
  const label = LANGUAGE_LABELS[language] ?? (lang || 'Code');
  const lines = code.split('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable – ignore */
    }
  };

  return (
    <div className="md-code">
      <div className="md-code__bar">
        <span className="md-code__lang">{label}</span>
        <button type="button" className="md-code__copy" onClick={copy} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="md-code__pre">
        <code>
          {lines.map((line, n) => (
            <span className="md-code__line" key={n}>
              {language
                ? highlightLine(line, language).map((tok, j) => (
                    <span key={j} className={`tok-${tok.type}`}>
                      {tok.text}
                    </span>
                  ))
                : line}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function List({ node, k }) {
  const Tag = node.ordered ? 'ol' : 'ul';
  return (
    <Tag start={node.ordered && node.start !== 1 ? node.start : undefined}>
      {node.items.map((item, j) => (
        <li key={`${k}-${j}`}>
          {renderInline(item.text, `${k}-${j}`)}
          {item.children.map((child, c) => (
            <List key={c} node={child} k={`${k}-${j}-${c}`} />
          ))}
        </li>
      ))}
    </Tag>
  );
}

function renderBlocks(blocks, prefix = 'b') {
  return blocks.map((block, n) => {
    const k = `${prefix}${n}`;
    switch (block.type) {
      case 'code':
        return <CodeFence key={k} lang={block.lang} code={block.code} />;
      case 'heading': {
        const Tag = `h${Math.min(6, block.level + 2)}`; // h1 → h3 inside chat bubbles
        return <Tag key={k}>{renderInline(block.text, k)}</Tag>;
      }
      case 'hr':
        return <hr key={k} />;
      case 'table':
        return (
          <div className="md-table" key={k}>
            <table>
              <thead>
                <tr>
                  {block.header.map((cell, c) => (
                    <th key={c}>{renderInline(cell, `${k}h${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>{renderInline(cell, `${k}r${r}c${c}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'quote':
        return <blockquote key={k}>{renderBlocks(block.children, `${k}q`)}</blockquote>;
      case 'list':
        return <List key={k} node={block} k={k} />;
      default:
        return <p key={k}>{renderInline(block.text, k)}</p>;
    }
  });
}

function Markdown({ text, className = '' }) {
  return <div className={`md ${className}`}>{renderBlocks(parseBlocks(text ?? ''))}</div>;
}

export default memo(Markdown);

/** Inline-only rendering (for short strings such as list items in cards). */
export function InlineMarkdown({ text }) {
  return <>{renderInline(text ?? '')}</>;
}
