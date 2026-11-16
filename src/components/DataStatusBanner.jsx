import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, RotateCw, X, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useLearningProgress } from '../context/LearningProgressContext';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import './DataStatusBanner.css';

/**
 * Combined loading/error state of the learner's personal data
 * (profile, lesson progress, practice). Pages use it to avoid showing
 * zeros as if they were real while data is loading or failed to load.
 */
export function useProgressData() {
  const user = useUser();
  const learning = useLearningProgress();
  const practice = usePracticeProgress();
  const parts = [user, learning, practice];
  const errors = [...new Set(parts.filter((p) => p.status === 'error').map((p) => p.error))];
  return {
    loading: parts.some((p) => p.status === 'loading'),
    error: errors.length ? errors.join(' ') : null,
    ready: parts.every((p) => p.status === 'ready'),
    source: learning.source,
    retry: () => parts.forEach((p) => p.reload()),
  };
}

/** App-wide: load failures and failed saves for the signed-in user's data. */
export default function DataStatusBanner() {
  const { loading, error, retry, source } = useProgressData();
  const user = useUser();
  const learning = useLearningProgress();
  const practice = usePracticeProgress();
  const writeErrors = [
    [user.writeError, user.clearWriteError],
    [learning.writeError, learning.clearWriteError],
    [practice.writeError, practice.clearWriteError],
  ].filter(([message]) => message);

  if (!error && !writeErrors.length && !(loading && source === 'account')) return null;

  return (
    <div className="data-banners">
      {error && (
        <div className="data-banner data-banner--error" role="alert">
          <AlertTriangle size={17} />
          <div>
            <p className="data-banner__title">Your progress couldn’t be loaded from your account</p>
            <p>{error}</p>
            <p className="data-banner__hint">Nothing below is from your account until this is fixed. No sample data is shown instead.</p>
          </div>
          <button type="button" className="data-banner__action" onClick={retry}>
            <RotateCw size={14} /> Retry
          </button>
        </div>
      )}
      {!error && loading && source === 'account' && (
        <div className="data-banner data-banner--info" role="status">
          <Loader2 size={16} className="spin" />
          <p>Loading your progress from your account…</p>
        </div>
      )}
      {writeErrors.map(([message, clear]) => (
        <div key={message} className="data-banner data-banner--warning" role="alert">
          <AlertTriangle size={17} />
          <p>{message}</p>
          <button type="button" className="data-banner__close" onClick={clear} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Shown on personal pages when the learner isn't signed in (data stays on this device). */
export function DeviceDataNotice() {
  const { enabled, status } = useAuth();
  const { pathname } = useLocation();
  if (!enabled || status !== 'signed_out') return null;
  return (
    <div className="data-banner data-banner--muted">
      <HardDrive size={16} />
      <p>
        You’re not signed in, so your progress is saved on this device only.{' '}
        <Link to={`/auth?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to keep it in your account.
      </p>
    </div>
  );
}
