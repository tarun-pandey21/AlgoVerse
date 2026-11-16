import { NavLink } from 'react-router-dom';
import { X, Target } from 'lucide-react';
import Logo from './Logo';
import ProgressBar from './ProgressBar';
import { navSections } from '../data/navigation';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { useUser } from '../context/UserContext';
import './Sidebar.css';

/**
 * Main app navigation.
 * Fixed on desktop; becomes a slide-in drawer below 1024px
 * (`isOpen` / `onClose` are controlled by DashboardLayout).
 */
export default function Sidebar({ isOpen, onClose }) {
  const { profile } = useUser();
  const goal = Number(profile.dailyGoal) || 1;
  const { stats, status } = usePracticeProgress();
  const ready = status === 'ready';
  const solvedToday = Math.min(stats.solvedToday, goal);
  const goalPercent = Math.round((solvedToday / goal) * 100);

  return (
    <aside id="app-sidebar" className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__brand">
        <Logo />
        <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {navSections.map((section) => (
          <div className="sidebar__section" key={section.title}>
            <p className="sidebar__section-title">{section.title}</p>
            <ul>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span className="sidebar__label">{item.label}</span>
                      {item.badge && <span className="sidebar__pill">{item.badge}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Daily goal widget – driven by the goal set in Settings */}
      <div className="sidebar__goal">
        <div className="sidebar__goal-head">
          <span className="icon-tile icon-tile--sm tone-indigo">
            <Target size={16} />
          </span>
          <div>
            <p className="sidebar__goal-title">Daily goal</p>
            <p className="sidebar__goal-meta">
              {ready ? `${solvedToday} of ${goal} problems solved today` : 'Loading…'}
            </p>
          </div>
        </div>
        <ProgressBar value={ready ? goalPercent : 0} size="sm" label="Daily goal progress" />
      </div>
    </aside>
  );
}
