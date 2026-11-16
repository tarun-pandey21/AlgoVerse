import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import ArrayView from './ArrayView';
import PlayerControls, { StepMessage } from './PlayerControls';
import Legend from './Legend';
import useFramePlayer from './useFramePlayer';
import { CAPACITY, access, update, insert, remove, search } from './arrayOperations';

const START = [10, 20, 30, 40, 50];

const OPERATIONS = {
  access: { label: 'Access arr[i]', fields: ['index'], cost: 'O(1)', run: (a, i) => access(a, i) },
  update: { label: 'Update arr[i]', fields: ['index', 'value'], cost: 'O(1)', run: (a, i, v) => update(a, i, v) },
  insert: { label: 'Insert at index', fields: ['index', 'value'], cost: 'O(n)', run: (a, i, v) => insert(a, i, v) },
  delete: { label: 'Delete at index', fields: ['index'], cost: 'O(n)', run: (a, i) => remove(a, i) },
  search: { label: 'Search for value', fields: ['value'], cost: 'O(n)', run: (a, i, v) => search(a, v) },
};

function initialFrames(array, message) {
  return [{ array, states: {}, pointers: {}, message, tone: 'info', stats: {} }];
}

/**
 * Hands-on array playground: pick an operation, an index and a value, then
 * watch elements shift (or not). The resulting array carries over to the next run.
 */
export default function ArrayOperationsVisualizer() {
  const [array, setArray] = useState(START);
  const [operation, setOperation] = useState('insert');
  const [index, setIndex] = useState('1');
  const [value, setValue] = useState('15');
  const [frames, setFrames] = useState(() =>
    initialFrames(START, 'Choose an operation, then press Run to watch what happens inside the array.')
  );
  const player = useFramePlayer(frames, { autoPlay: true });
  const op = OPERATIONS[operation];

  const run = (event) => {
    event.preventDefault();
    const i = Number(index);
    const v = Number(value);
    if (op.fields.includes('index') && (index === '' || !Number.isInteger(i))) {
      setFrames(initialFrames(array, 'Enter a whole-number index.').map((f) => ({ ...f, tone: 'error' })));
      return;
    }
    if (op.fields.includes('value') && (value === '' || !Number.isInteger(v) || v < 0 || v > 999)) {
      setFrames(initialFrames(array, 'Enter a whole-number value between 0 and 999.').map((f) => ({ ...f, tone: 'error' })));
      return;
    }
    const { frames: next, result } = op.run(array, i, v);
    setFrames(next);
    setArray(result);
  };

  const resetArray = () => {
    setArray(START);
    setFrames(initialFrames(START, 'Array reset to [10, 20, 30, 40, 50].'));
  };

  return (
    <div className="viz">
      <div className="viz__head">
        <div>
          <h4 className="viz__title">Array operations</h4>
          <p className="viz__description">
            See why reading an index is instant but inserting or deleting in the middle means shifting elements.
          </p>
        </div>
        <span className="viz__capacity">
          Size {array.length} / Capacity {CAPACITY}
        </span>
      </div>

      <form className="viz__inputs" onSubmit={run}>
        <div className="viz-field">
          <label htmlFor="array-op">Operation</label>
          <select id="array-op" value={operation} onChange={(e) => setOperation(e.target.value)}>
            {Object.entries(OPERATIONS).map(([key, o]) => (
              <option key={key} value={key}>
                {o.label} ({o.cost})
              </option>
            ))}
          </select>
        </div>
        {op.fields.includes('index') && (
          <div className="viz-field">
            <label htmlFor="array-index">Index</label>
            <input id="array-index" type="number" inputMode="numeric" value={index} onChange={(e) => setIndex(e.target.value)} />
          </div>
        )}
        {op.fields.includes('value') && (
          <div className="viz-field">
            <label htmlFor="array-value">Value</label>
            <input id="array-value" type="number" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        )}
        <button type="submit" className="viz-chip-btn viz-chip-btn--primary">
          <Play size={15} /> Run
        </button>
        <button type="button" className="viz-chip-btn" onClick={resetArray}>
          <RotateCcw size={15} /> Reset array
        </button>
      </form>

      <div className="viz__stage">
        <ArrayView frame={player.frame} mode="cells" />
      </div>

      <StepMessage frame={player.frame} />
      <PlayerControls player={player} />
      <Legend states={['active', 'swap', 'found', 'removed', 'empty']} />
    </div>
  );
}
