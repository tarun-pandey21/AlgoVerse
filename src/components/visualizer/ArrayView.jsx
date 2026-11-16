/**
 * Draws one frame of an array.
 * mode 'cells': boxes with values and indices (searching, array operations)
 * mode 'bars':  bars whose height is the value (sorting)
 */
export default function ArrayView({ frame, mode = 'cells' }) {
  const values = frame.array;
  const max = Math.max(...values.filter((v) => v != null), 1);

  return (
    <div className={`array-view array-view--${mode}`} role="img" aria-label={`Array: ${values.map((v) => v ?? 'empty').join(', ')}`}>
      {values.map((value, i) => {
        const state = frame.states[i] ?? (value == null ? 'empty' : 'default');
        const labels = frame.pointers[i] ?? [];
        return (
          <div key={i} className={`array-item array-item--${state}`}>
            <div className="array-item__pointers">
              {labels.map((label) => (
                <span key={label} className="array-item__pointer">
                  {label}
                </span>
              ))}
            </div>

            {mode === 'bars' ? (
              <div className="array-item__track">
                <div className="array-item__bar" style={{ height: `${Math.max((value / max) * 100, 8)}%` }}>
                  <span>{value}</span>
                </div>
              </div>
            ) : (
              <div className="array-item__cell">{value ?? ''}</div>
            )}

            <span className="array-item__index">{i}</span>
          </div>
        );
      })}
    </div>
  );
}
