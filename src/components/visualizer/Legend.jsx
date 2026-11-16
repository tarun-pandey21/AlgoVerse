const LABELS = {
  compare: 'Comparing',
  swap: 'Moving / swapping',
  sorted: 'In final position',
  partial: 'Sorted section',
  found: 'Found / placed',
  eliminated: 'Ruled out',
  min: 'Current minimum',
  key: 'Key being inserted',
  active: 'Selected',
  removed: 'Being removed',
  empty: 'Empty slot',
};

/** Colour key for the array states used by a visualizer. */
export default function Legend({ states }) {
  return (
    <ul className="viz-legend" aria-label="Colour legend">
      {states.map((state) => (
        <li key={state}>
          <span className={`viz-legend__swatch array-item--${state}`} />
          {LABELS[state]}
        </li>
      ))}
    </ul>
  );
}
