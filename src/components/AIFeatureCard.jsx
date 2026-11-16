import { ArrowRight } from 'lucide-react';
import Button from './Button';
import './AIFeatureCard.css';

const STATUS_LABELS = {
  ready: { text: 'Ready', className: 'ai-card__status--ready' },
  not_configured: { text: 'Needs API key', className: 'ai-card__status--setup' },
  unavailable: { text: 'Server offline', className: 'ai-card__status--setup' },
};

/**
 * Introduces one AI feature and links to its page.
 * `aiState` is the backend's AI status ('ready' | 'not_configured' | 'unavailable' | 'checking').
 */
export default function AIFeatureCard({ feature, aiState }) {
  const status = STATUS_LABELS[aiState];
  const Icon = feature.icon;
  return (
    <article className="ai-card card">
      <div className="ai-card__head">
        <span className={`icon-tile tone-${feature.tone}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
        {status && <span className={`ai-card__status ${status.className}`}>{status.text}</span>}
      </div>
      <h3 className="ai-card__title">{feature.title}</h3>
      <p className="ai-card__description">{feature.description}</p>
      <Button to={feature.path} variant="ghost" size="sm" iconRight={ArrowRight} className="ai-card__cta">
        Open
      </Button>
    </article>
  );
}
