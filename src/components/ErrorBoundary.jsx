import { Component } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import './ErrorBoundary.css';

/**
 * Catches render errors (including a lazily loaded page that failed to
 * download, e.g. after a redeploy or a network drop) and shows a recovery
 * card instead of a blank screen.
 *
 * Reset it by changing `resetKey` (the route path), so navigating away
 * clears the error.
 */

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed|Unable to preload CSS/i;

export function isChunkLoadError(error) {
  return CHUNK_ERROR.test(String(error?.message ?? error ?? ''));
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AlgoVerse] page error:', error, info?.componentStack ?? '');
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = isChunkLoadError(error);
    return (
      <div className={`error-boundary ${this.props.fullScreen ? 'error-boundary--full' : ''}`} role="alert">
        <div className="card error-boundary__card">
          <span className="icon-tile icon-tile--lg tone-amber">
            <AlertTriangle size={24} />
          </span>
          <h1 className="error-boundary__title">{chunk ? 'This page couldn’t be loaded' : 'Something went wrong'}</h1>
          <p className="muted">
            {chunk
              ? 'Your connection dropped, or AlgoVerse was just updated. Reloading fetches the latest version. Your saved progress is not affected.'
              : 'An unexpected error stopped this page from showing. Reloading usually fixes it. Your saved progress is not affected.'}
          </p>
          <div className="error-boundary__actions">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              <span>Reload page</span>
            </button>
            <a className="btn btn--secondary" href="/">
              <Home size={16} />
              <span>Back to Overview</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
