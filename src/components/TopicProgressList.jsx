import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { useLearningProgress } from '../context/LearningProgressContext';
import './TopicProgressList.css';

/** Topic-wise progress bars. Each row links to that topic's lesson. */
export default function TopicProgressList({ topics }) {
  const { getTopicStats } = useLearningProgress();

  return (
    <ul className="topic-progress">
      {topics.map((topic) => {
        const Icon = topic.icon;
        const stats = getTopicStats(topic.id);
        return (
          <li key={topic.id}>
            <Link to={`/learn/${topic.id}`} className="topic-progress__row">
              <span className={`icon-tile icon-tile--sm tone-${topic.tone}`}>
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <div className="topic-progress__body">
                <div className="topic-progress__labels">
                  <span className="topic-progress__name">{topic.name}</span>
                  <span className="topic-progress__count">
                    {stats.read}/{stats.total}
                    <strong>{stats.percent}%</strong>
                  </span>
                </div>
                <ProgressBar
                  value={stats.percent}
                  size="sm"
                  tone={stats.completed ? 'success' : 'primary'}
                  label={`${topic.name} progress`}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
