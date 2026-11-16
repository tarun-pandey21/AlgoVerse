import './ProgressBar.css';

/**
 * Horizontal progress bar that animates in on mount.
 * value: 0–100
 * tone:  'primary' | 'success' | 'warning' | 'danger'
 * size:  'sm' | 'md' | 'lg'
 */
export default function ProgressBar({ value = 0, tone = 'primary', size = 'md', label }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`progress progress--${size}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`progress__fill progress__fill--${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
