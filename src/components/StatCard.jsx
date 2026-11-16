import ProgressBar from './ProgressBar';
import './StatCard.css';

/**
 * Headline metric card.
 * Shows a label, big value, optional suffix ("days"), helper text and
 * an optional progress bar.
 */
export default function StatCard({ label, value, suffix, helper, icon: Icon, tone = 'indigo', progress }) {
  return (
    <article className="stat-card card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {Icon && (
          <span className={`icon-tile icon-tile--sm tone-${tone}`}>
            <Icon size={17} strokeWidth={2.2} />
          </span>
        )}
      </div>

      <p className="stat-card__value">
        {value}
        {suffix && <span className="stat-card__suffix">{suffix}</span>}
      </p>

      {typeof progress === 'number' && <ProgressBar value={progress} size="sm" label={label} />}
      {helper && <p className="stat-card__helper">{helper}</p>}
    </article>
  );
}
