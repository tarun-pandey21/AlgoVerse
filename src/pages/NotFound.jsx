import { Home, BookOpen } from 'lucide-react';
import Button from '../components/Button';

/** Shown for unknown URLs and for missing topics/problems. */
export default function NotFound() {
  return (
    <div className="page">
      <div className="card empty-state" style={{ padding: '72px 24px' }}>
        <p style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--primary)' }}>404</p>
        <h1 className="empty-state__title">This page doesn&apos;t exist</h1>
        <p className="muted">The link may be broken, or the page may have moved.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
          <Button to="/" icon={Home}>
            Back to Overview
          </Button>
          <Button to="/learn" variant="secondary" icon={BookOpen}>
            Learn DSA
          </Button>
        </div>
      </div>
    </div>
  );
}
