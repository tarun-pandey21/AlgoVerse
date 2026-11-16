import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import Button from './Button';
import ProgressBar from './ProgressBar';
import { useLearningProgress } from '../context/LearningProgressContext';
import { getTopicIndex } from '../data/topics';
import './TopicCard.css';

/**
 * Card for a single DSA topic. Progress comes from LearningProgressContext.
 * The button label adapts: Start Learning → Continue Learning → Review Topic.
 */
export default function TopicCard({ topic }) {
  const { getTopicStats } = useLearningProgress();
  const stats = getTopicStats(topic.id);
  const Icon = topic.icon;

  const buttonLabel = stats.completed ? 'Review Topic' : stats.started ? 'Continue Learning' : 'Start Learning';

  return (
    <article className="topic-card card">
      <div className="topic-card__head">
        <span className={`icon-tile tone-${topic.tone}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <span className="topic-card__level">
          Lesson {getTopicIndex(topic.id) + 1} · {topic.level}
        </span>
      </div>

      <div className="topic-card__body">
        <h3 className="topic-card__title">{topic.name}</h3>
        <p className="topic-card__description">{topic.description}</p>
      </div>

      <div className="topic-card__progress">
        <div className="topic-card__progress-row">
          <span className="topic-card__lessons">
            {stats.completed ? (
              <CheckCircle2 size={14} className="topic-card__done" />
            ) : (
              <Clock size={13} />
            )}
            {stats.completed ? 'Completed' : `${stats.read}/${stats.total} sections · ${topic.readingTime} min`}
          </span>
          <span className="topic-card__percent">{stats.percent}%</span>
        </div>
        <ProgressBar
          value={stats.percent}
          size="sm"
          tone={stats.completed ? 'success' : 'primary'}
          label={`${topic.name} progress`}
        />
      </div>

      <Button
        to={`/learn/${topic.id}`}
        variant={stats.started ? 'soft' : 'secondary'}
        size="sm"
        iconRight={ArrowRight}
        fullWidth
      >
        {buttonLabel}
      </Button>
    </article>
  );
}
