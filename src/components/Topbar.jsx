import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Menu, Flame, LogIn, LogOut, Settings as SettingsIcon, Cloud, User as UserIcon } from 'lucide-react';
import { LogoMark } from './Logo';
import { navItems } from '../data/navigation';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { useUser, getInitials } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

/** Works out which nav item the current URL belongs to. */
function getPageTitle(pathname) {
  const match = navItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );
  return match ? match.label : 'AlgoVerse';
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function Topbar({ onMenuClick, isMenuOpen }) {
  const { pathname } = useLocation();
  const { profile } = useUser();
  const { stats, status: practiceStatus } = usePracticeProgress();
  const auth = useAuth();
  const streak = practiceStatus === 'ready' ? stats.currentStreak : '–';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__menu"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-controls="app-sidebar"
          aria-expanded={isMenuOpen}
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="topbar__mobile-logo" aria-label="AlgoVerse home">
          <LogoMark size={28} />
        </Link>
        <div>
          <p className="topbar__title">{getPageTitle(pathname)}</p>
          <p className="topbar__date">{today}</p>
        </div>
      </div>

      <div className="topbar__right">
        <Link to="/progress" className="topbar__streak" title="Solving streak: days in a row with an accepted submission">
          <Flame size={16} strokeWidth={2.4} />
          <span>{streak}</span>
          <span className="topbar__streak-label">day streak</span>
        </Link>

        {auth.status === 'signed_in' ? (
          <AccountMenu user={auth.user} name={profile.name} role={profile.role} onSignOut={auth.signOut} />
        ) : (
          <>
            {auth.enabled && auth.status === 'signed_out' && (
              <Link to={`/auth?next=${encodeURIComponent(pathname)}`} className="topbar__signin" aria-label="Sign in">
                <LogIn size={15} />
                <span>Sign in</span>
              </Link>
            )}
            <Link to="/settings" className="topbar__profile" title="Profile & settings">
              <span className="topbar__avatar">{getInitials(profile.name) || <UserIcon size={16} />}</span>
              <span className="topbar__profile-text">
                <span className="topbar__name">{profile.name || 'Your profile'}</span>
                <span className="topbar__role">{profile.role || 'Saved on this device'}</span>
              </span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/** Signed-in account button with a small menu (Supabase Auth). */
function AccountMenu({ user, name: profileName, role, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // The profile's display name, else the account email (never an invented name).
  const name = profileName?.trim() || user.email || 'Account';

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="topbar__account" ref={ref}>
      <button type="button" className="topbar__profile" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="topbar__avatar">{getInitials(name)}</span>
        <span className="topbar__profile-text">
          <span className="topbar__name">{name}</span>
          {role && <span className="topbar__role">{role}</span>}
        </span>
      </button>
      {open && (
        <div className="topbar__menu-pop" role="menu">
          <div className="topbar__menu-head">
            <Cloud size={14} />
            <span>
              Signed in as <strong>{user.email}</strong>
            </span>
          </div>
          <Link to="/settings" role="menuitem" className="topbar__menu-item" onClick={() => setOpen(false)}>
            <SettingsIcon size={15} /> Profile &amp; settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="topbar__menu-item"
            onClick={async () => {
              setOpen(false);
              await onSignOut();
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
