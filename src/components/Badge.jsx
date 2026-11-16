import './Badge.css';

/**
 * Small pill label.
 * tone: 'easy' | 'medium' | 'hard' | 'primary' | 'neutral' | 'success' | 'warning'
 * Use <DifficultyBadge> for problem difficulty.
 */
export default function Badge({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span className={`badge badge--${tone}`}>
      {Icon && <Icon size={12} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

export function DifficultyBadge({ level }) {
  return <Badge tone={level.toLowerCase()}>{level}</Badge>;
}
