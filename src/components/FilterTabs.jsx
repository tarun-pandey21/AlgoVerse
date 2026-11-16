import './FilterTabs.css';

/**
 * Segmented tab control for filtering lists.
 * tabs: [{ key, label, count? }]
 */
export default function FilterTabs({ tabs, active, onChange, ariaLabel = 'Filter' }) {
  return (
    <div className="filter-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          className={`filter-tabs__tab ${active === tab.key ? 'filter-tabs__tab--active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {typeof tab.count === 'number' && <span className="filter-tabs__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
