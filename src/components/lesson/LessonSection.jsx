import { ChevronDown, CheckCircle2, Circle, Check, ArrowDown } from 'lucide-react';
import Button from '../Button';
import './LessonSection.css';

/**
 * One expandable lesson section.
 * - The header toggles open/closed.
 * - The round button marks the section read or unread.
 * - The footer button marks it read and opens the next section.
 */
export default function LessonSection({
  section,
  index,
  isOpen,
  isRead,
  isLast,
  onToggle,
  onToggleRead,
  onContinue,
  children,
}) {
  const Icon = section.icon;
  const panelId = `panel-${section.key}`;

  return (
    <section
      id={`section-${section.key}`}
      className={`lesson-section card ${isOpen ? 'lesson-section--open' : ''} ${isRead ? 'lesson-section--read' : ''}`}
    >
      <div className="lesson-section__header">
        <button
          className="lesson-section__toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className={`icon-tile icon-tile--sm ${isRead ? 'tone-green' : 'tone-indigo'}`}>
            <Icon size={16} />
          </span>
          <span className="lesson-section__heading">
            <span className="lesson-section__step">Section {index + 1}</span>
            <span className="lesson-section__title">{section.title}</span>
          </span>
          <ChevronDown size={18} className="lesson-section__chevron" />
        </button>

        <button
          className={`lesson-section__read ${isRead ? 'lesson-section__read--done' : ''}`}
          onClick={onToggleRead}
          aria-pressed={isRead}
          title={isRead ? 'Mark as unread' : 'Mark as read'}
        >
          {isRead ? <CheckCircle2 size={17} /> : <Circle size={17} />}
          <span>{isRead ? 'Read' : 'Mark as read'}</span>
        </button>
      </div>

      {isOpen && (
        <div id={panelId} className="lesson-section__body">
          {children}
          <div className="lesson-section__footer">
            {isRead ? (
              <p className="lesson-section__done">
                <CheckCircle2 size={16} /> You&apos;ve read this section
              </p>
            ) : (
              <Button variant="soft" size="sm" icon={isLast ? Check : ArrowDown} onClick={onContinue}>
                {isLast ? 'Mark as read' : 'Mark as read & continue'}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
