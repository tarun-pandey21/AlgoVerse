import { useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import FilterTabs from '../FilterTabs';
import AlgorithmVisualizer from './AlgorithmVisualizer';
import ArrayOperationsVisualizer from './ArrayOperationsVisualizer';
import './Visualizer.css';

const TAB_LABELS = {
  'array-operations': 'Array operations',
  'linear-search': 'Linear search',
  'binary-search': 'Binary search',
  'bubble-sort': 'Bubble sort',
  'selection-sort': 'Selection sort',
  'insertion-sort': 'Insertion sort',
};

/**
 * Card holding one or more visualizers for a lesson, with tabs to switch.
 * Visualizations are optional practice and don't count toward progress.
 */
export default function VisualizerPanel({ visualizers }) {
  const [active, setActive] = useState(visualizers[0]);

  return (
    <section className="viz-panel card" aria-label="Interactive visualization">
      <header className="viz-panel__head">
        <span className="icon-tile icon-tile--sm tone-blue">
          <MousePointerClick size={16} />
        </span>
        <div>
          <h3>Interactive visualization</h3>
          <p>Step through the algorithm at your own pace. Change the input and see how the work changes.</p>
        </div>
      </header>

      {visualizers.length > 1 && (
        <FilterTabs
          ariaLabel="Choose a visualization"
          tabs={visualizers.map((key) => ({ key, label: TAB_LABELS[key] }))}
          active={active}
          onChange={setActive}
        />
      )}

      {active === 'array-operations' ? (
        <ArrayOperationsVisualizer />
      ) : (
        <AlgorithmVisualizer key={active} algorithm={active} />
      )}
    </section>
  );
}
