import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import './CodeEditor.css';

// Each language's parser is loaded only when that language is first used
const LANGUAGE_LOADERS = {
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
};

/* Light theme matching AlgoVerse's code blocks */
const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13.5px', backgroundColor: '#fbfcfe', color: '#1e293b' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
  '.cm-content': { padding: '12px 0', caretColor: '#4f46e5' },
  '.cm-gutters': { backgroundColor: '#fbfcfe', color: '#b6c0ce', border: 'none', borderRight: '1px solid #eef2f6' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 14px' },
  '.cm-activeLine': { backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#4f46e5' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#4f46e5', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#dfe3ff !important' },
  '.cm-matchingBracket': { backgroundColor: '#e0e7ff', outline: '1px solid #c7d2fe' },
  '.cm-foldGutter .cm-gutterElement': { color: '#94a3b8' },
  '.cm-tooltip': { border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 6px 16px -4px rgba(15,23,42,0.12)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#eef2ff', color: '#3730a3' },
  '.cm-panels': { backgroundColor: '#f8fafc', color: '#0f172a' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword], color: '#7c3aed', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#7c3aed' },
  { tag: [t.string, t.special(t.string), t.character], color: '#15803d' },
  { tag: [t.number, t.integer, t.float], color: '#c2410c' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#94a3b8', fontStyle: 'italic' },
  { tag: [t.typeName, t.className, t.namespace], color: '#0e7490' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: '#2563eb' },
  { tag: [t.processingInstruction, t.meta, t.annotation], color: '#b45309' },
  { tag: [t.propertyName], color: '#1e293b' },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#475569' },
]);

/**
 * CodeMirror 6 editor: syntax highlighting, line numbers, auto-indent,
 * bracket matching, undo history and search. Controlled by `value`;
 * typing calls `onChange` with the new text.
 */
export default function CodeEditor({ value, language, onChange, ariaLabel = 'Code editor', onRun }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const languageSlot = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  const applyingExternal = useRef(false);
  onRunRef.current = onRun;

  // Create the editor once
  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          // Highest precedence so these win over the default keymap (which uses Mod-Enter too)
          Prec.highest(
            keymap.of([
              // Ctrl/Cmd + Enter runs the code
              { key: 'Mod-Enter', run: () => (onRunRef.current?.(), true) },
              indentWithTab,
            ])
          ),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          languageSlot.current.of([]),
          theme,
          syntaxHighlighting(highlight),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel, spellcheck: 'false' }),
          EditorView.updateListener.of((update) => {
            // Only report the learner's own edits, not documents we set from
            // outside (loading a draft, switching language, reset).
            if (update.docChanged && !applyingExternal.current) onChangeRef.current?.(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load and switch the language mode
  useEffect(() => {
    let cancelled = false;
    (LANGUAGE_LOADERS[language] ?? LANGUAGE_LOADERS.java)().then((extension) => {
      if (!cancelled) viewRef.current?.dispatch({ effects: languageSlot.current.reconfigure(extension) });
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Replace the document when `value` changes from outside (reset, language switch)
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      applyingExternal.current = true;
      try {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
      } finally {
        applyingExternal.current = false;
      }
    }
  }, [value]);

  return <div className="code-editor" ref={hostRef} data-language={language} />;
}
