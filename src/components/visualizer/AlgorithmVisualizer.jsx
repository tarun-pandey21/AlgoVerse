import { useMemo, useState } from 'react';
import { Shuffle, Check } from 'lucide-react';
import ArrayView from './ArrayView';
import PlayerControls, { StepMessage } from './PlayerControls';
import Legend from './Legend';
import useFramePlayer from './useFramePlayer';
import {
  linearSearch,
  binarySearch,
  bubbleSort,
  selectionSort,
  insertionSort,
  randomArray,
  randomUniqueArray,
  pickRandom,
} from './algorithms';

/** Settings for each algorithm the visualizer can play. */
const CONFIG = {
  'linear-search': {
    title: 'Linear Search',
    description: 'Checks each element in turn until it finds the target or runs out of elements.',
    complexity: 'O(n)',
    kind: 'search',
    sorted: false,
    mode: 'cells',
    size: 10,
    run: linearSearch,
    legend: ['compare', 'found', 'eliminated'],
  },
  'binary-search': {
    title: 'Binary Search',
    description: 'Compares the target with the middle of a sorted range and discards the half that cannot contain it.',
    complexity: 'O(log n)',
    kind: 'search',
    sorted: true,
    mode: 'cells',
    size: 12,
    run: binarySearch,
    legend: ['compare', 'found', 'eliminated'],
  },
  'bubble-sort': {
    title: 'Bubble Sort',
    description: 'Swaps adjacent elements that are out of order; large values bubble to the end.',
    complexity: 'O(n²)',
    kind: 'sort',
    mode: 'bars',
    size: 8,
    run: bubbleSort,
    legend: ['compare', 'swap', 'sorted'],
  },
  'selection-sort': {
    title: 'Selection Sort',
    description: 'Finds the smallest unsorted value and swaps it to the front of the unsorted part.',
    complexity: 'O(n²)',
    kind: 'sort',
    mode: 'bars',
    size: 8,
    run: selectionSort,
    legend: ['compare', 'min', 'swap', 'sorted'],
  },
  'insertion-sort': {
    title: 'Insertion Sort',
    description: 'Takes each value (the key) and shifts it left into its place in the sorted section.',
    complexity: 'O(n²)',
    kind: 'sort',
    mode: 'bars',
    size: 8,
    run: insertionSort,
    legend: ['key', 'compare', 'partial', 'sorted'],
  },
};

function makeInput(config) {
  if (config.kind === 'search') {
    let array = randomUniqueArray(config.size);
    if (config.sorted) array = array.sort((a, b) => a - b);
    return { array, target: pickRandom(array) };
  }
  return { array: randomArray(config.size) };
}

/** Parses "5, 3, 8" into numbers; returns an error string if invalid. */
function parseValues(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const values = parts.map(Number);
  if (values.length < 2 || values.length > 12) return { error: 'Enter between 2 and 12 numbers.' };
  if (values.some((v) => !Number.isInteger(v) || v < 1 || v > 99)) return { error: 'Use whole numbers from 1 to 99.' };
  return { values };
}

/**
 * Interactive player for searching and sorting algorithms.
 * Learners can shuffle, enter their own values and choose a search target.
 */
export default function AlgorithmVisualizer({ algorithm }) {
  const config = CONFIG[algorithm];
  const [input, setInput] = useState(() => makeInput(config));
  const [targetDraft, setTargetDraft] = useState(String(input.target ?? ''));
  const [customDraft, setCustomDraft] = useState('');
  const [inputError, setInputError] = useState('');

  const frames = useMemo(
    () => (config.kind === 'search' ? config.run(input.array, input.target) : config.run(input.array)),
    [config, input]
  );
  const player = useFramePlayer(frames);

  const shuffle = () => {
    const next = makeInput(config);
    setInput(next);
    setTargetDraft(String(next.target ?? ''));
    setInputError('');
  };

  // The target applies as soon as it's a valid number, so the demo updates while typing
  const changeTarget = (text) => {
    setTargetDraft(text);
    const target = Number(text);
    if (text.trim() === '' || !Number.isInteger(target) || target < 0 || target > 999) {
      setInputError('Enter a whole-number target from 0 to 999.');
      return;
    }
    setInputError('');
    setInput((current) => ({ ...current, target }));
  };

  const applyCustom = (event) => {
    event.preventDefault();
    const { values, error } = parseValues(customDraft);
    if (error) {
      setInputError(error);
      return;
    }
    let array = values;
    if (config.sorted) array = [...values].sort((a, b) => a - b);
    if (config.kind === 'search' && config.sorted && values.join() !== array.join()) {
      setInputError('Binary search needs sorted data, so your values were sorted first.');
    } else {
      setInputError('');
    }
    setInput((current) => ({ ...current, array }));
  };

  return (
    <div className="viz">
      <div className="viz__head">
        <div>
          <h4 className="viz__title">
            {config.title} <code className="big-o">{config.complexity}</code>
          </h4>
          <p className="viz__description">{config.description}</p>
        </div>
      </div>

      <div className="viz__inputs">
        <button className="viz-chip-btn" onClick={shuffle}>
          <Shuffle size={15} /> New random array
        </button>

        {config.kind === 'search' && (
          <div className="viz-field">
            <label htmlFor={`${algorithm}-target`}>Target</label>
            <input
              id={`${algorithm}-target`}
              type="number"
              inputMode="numeric"
              value={targetDraft}
              onChange={(e) => changeTarget(e.target.value)}
            />
          </div>
        )}

        <form className="viz-field viz-field--grow" onSubmit={applyCustom}>
          <label htmlFor={`${algorithm}-custom`}>Your values</label>
          <input
            id={`${algorithm}-custom`}
            placeholder="e.g. 42, 7, 19, 73"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
          />
          <button type="submit" className="viz-chip-btn" aria-label="Use these values">
            <Check size={15} /> Use
          </button>
        </form>
      </div>
      {inputError && <p className="viz__input-note">{inputError}</p>}

      <div className="viz__stage">
        <ArrayView frame={player.frame} mode={config.mode} />
      </div>

      <StepMessage frame={player.frame} />
      <PlayerControls player={player} />
      <Legend states={config.legend} />
    </div>
  );
}
