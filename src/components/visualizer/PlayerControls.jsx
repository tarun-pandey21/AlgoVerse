import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle2, XCircle, Info } from 'lucide-react';
import { SPEEDS } from './useFramePlayer';

const TONE_ICON = { success: CheckCircle2, error: XCircle, info: Info };
const STAT_LABELS = { comparisons: 'Comparisons', swaps: 'Swaps', shifts: 'Shifts' };

/** The explanation for the current step, plus running counters. */
export function StepMessage({ frame }) {
  const Icon = TONE_ICON[frame.tone] ?? Info;
  return (
    <div className={`viz-message viz-message--${frame.tone}`} aria-live="polite">
      <Icon size={17} />
      <p>{frame.message}</p>
      {Object.keys(frame.stats).length > 0 && (
        <div className="viz-message__stats">
          {Object.entries(frame.stats).map(([key, value]) => (
            <span key={key}>
              {STAT_LABELS[key] ?? key}: <strong>{value}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Reset / back / play-pause / forward, speed and step counter. */
export default function PlayerControls({ player }) {
  return (
    <div className="viz-controls">
      <div className="viz-controls__buttons">
        <button className="viz-btn" onClick={player.reset} disabled={player.atStart} aria-label="Restart">
          <RotateCcw size={16} />
        </button>
        <button className="viz-btn" onClick={player.stepBack} disabled={player.atStart} aria-label="Previous step">
          <SkipBack size={16} />
        </button>
        <button
          className="viz-btn viz-btn--primary"
          onClick={player.togglePlay}
          disabled={player.total <= 1}
          aria-label={player.playing ? 'Pause' : 'Play'}
        >
          {player.playing ? <Pause size={17} /> : <Play size={17} />}
          <span>{player.playing ? 'Pause' : player.atEnd && player.total > 1 ? 'Replay' : 'Play'}</span>
        </button>
        <button className="viz-btn" onClick={player.stepForward} disabled={player.atEnd} aria-label="Next step">
          <SkipForward size={16} />
        </button>
      </div>

      <div className="viz-controls__meta">
        <label className="viz-speed">
          <span>Speed</span>
          <select value={player.speed} onChange={(e) => player.setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s.ms} value={s.ms}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <span className="viz-step">
          Step {player.index + 1} / {player.total}
        </span>
      </div>
    </div>
  );
}
