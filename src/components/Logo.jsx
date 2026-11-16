import { useId } from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

/**
 * AlgoVerse brand mark: an "A" drawn as three connected graph nodes,
 * plus the wordmark and tagline.
 */
export function LogoMark({ size = 34 }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M10 21.5 16 10l6 11.5M12.7 17h6.6"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10" r="2.4" fill="#fff" />
      <circle cx="10" cy="21.5" r="2.4" fill="#fff" />
      <circle cx="22" cy="21.5" r="2.4" fill="#fff" />
    </svg>
  );
}

export default function Logo({ showTagline = true }) {
  return (
    <Link to="/" className="logo" aria-label="AlgoVerse home">
      <LogoMark />
      <span className="logo__text">
        <span className="logo__name">
          Algo<span className="logo__accent">Verse</span>
        </span>
        {showTagline && <span className="logo__tagline">Learn. Practice. Master.</span>}
      </span>
    </Link>
  );
}
