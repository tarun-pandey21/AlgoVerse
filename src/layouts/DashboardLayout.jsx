import { Fragment, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DataStatusBanner from '../components/DataStatusBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

/**
 * App shell: sidebar + sticky top bar + routed page content.
 * Handles the mobile drawer state and scroll reset on navigation.
 */
export default function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Close the mobile drawer and jump to the top whenever the page changes
  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // Allow closing the drawer with the Escape key
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className="layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {isSidebarOpen && (
        <div className="layout__overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="layout__main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} isMenuOpen={isSidebarOpen} />
        <main className="layout__content">
          <DataStatusBanner />
          {/* Re-mount pages when the signed-in user changes, so nothing from
              the previous user (e.g. an open AI chat) stays on screen. */}
          <Fragment key={user?.id ?? 'device'}>
            {/* A page that fails (e.g. its code couldn't be downloaded after an
                update) shows a recovery card; the sidebar keeps working. */}
            <ErrorBoundary resetKey={pathname}>
              <Outlet />
            </ErrorBoundary>
          </Fragment>
        </main>
      </div>
    </div>
  );
}
