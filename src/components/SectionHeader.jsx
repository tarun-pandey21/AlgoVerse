import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './SectionHeader.css';

/**
 * Title + description for a dashboard section, with an optional
 * "View all"-style link on the right.
 */
export default function SectionHeader({ title, description, actionLabel, actionTo }) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-header__title">{title}</h2>
        {description && <p className="section-header__description">{description}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="section-header__action">
          {actionLabel}
          <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}
