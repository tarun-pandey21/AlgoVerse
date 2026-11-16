import './ActivityChart.css';

/**
 * Lightweight bar chart for the last 7 days of activity.
 * Pure CSS – no charting library needed.
 * data: [{ day: 'Mon', solved: 4, isToday: false }, ...] – from real accepted submissions
 */
export default function ActivityChart({ data }) {
  const max = Math.max(...data.map((d) => d.solved), 1);
  const total = data.reduce((sum, d) => sum + d.solved, 0);

  return (
    <div className="activity">
      <div className="activity__summary">
        <span className="activity__total">{total}</span>
        <span className="activity__caption">problems solved in the last 7 days</span>
      </div>
      {total === 0 && <p className="activity__empty">No solved problems in the last 7 days. Accepted submissions will appear here.</p>}

      <ol className="activity__chart" aria-label="Problems solved per day">
        {data.map((d) => (
          <li key={d.day} className={`activity__col ${d.isToday ? 'activity__col--today' : ''}`}>
            <span className="activity__value">{d.solved}</span>
            <div className="activity__track">
              <div
                className="activity__bar"
                style={{ height: `${(d.solved / max) * 100}%` }}
                aria-label={`${d.day}: ${d.solved} solved`}
              />
            </div>
            <span className="activity__day">{d.isToday ? 'Today' : d.day}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
