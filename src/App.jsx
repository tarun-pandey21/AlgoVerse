import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import LearnDSA from './pages/LearnDSA';
import PracticeProblems from './pages/PracticeProblems';
import MyProgress from './pages/MyProgress';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Lesson pages carry all 16 topics' content, so they load on demand
const TopicLesson = lazy(() => import('./pages/TopicLesson'));
// The coding workspace includes the code editor, so it also loads on demand
const ProblemWorkspace = lazy(() => import('./pages/ProblemWorkspace'));
// AI pages (Claude via our backend) load on demand
const AITutor = lazy(() => import('./pages/AITutor'));
const CodeAnalyzer = lazy(() => import('./pages/CodeAnalyzer'));
const AIQuestions = lazy(() => import('./pages/AIQuestions'));
const AIRoadmap = lazy(() => import('./pages/AIRoadmap'));
// Sign-in pages (Supabase Auth) – full-screen, outside the dashboard layout
const AuthPage = lazy(() => import('./pages/Auth'));
const ResetPassword = lazy(() => import('./pages/Auth').then((m) => ({ default: m.ResetPassword })));

const lazyPage = (Page, label) => (
  <Suspense fallback={<Loading label={label} />}>
    <Page />
  </Suspense>
);

function Loading({ label }) {
  return (
    <div className="card empty-state" role="status">
      <p className="empty-state__title">{label}</p>
    </div>
  );
}

/**
 * Route table. Every page renders inside DashboardLayout
 * (sidebar + top bar) through its <Outlet />.
 */
export default function App() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname} fullScreen>
    <Routes>
      <Route path="auth" element={lazyPage(AuthPage, 'Loading…')} />
      <Route path="auth/reset" element={lazyPage(ResetPassword, 'Loading…')} />
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="learn" element={<LearnDSA />} />
        <Route
          path="learn/:topicId"
          element={
            <Suspense fallback={<Loading label="Loading lesson…" />}>
              <TopicLesson />
            </Suspense>
          }
        />
        <Route path="practice" element={<PracticeProblems />} />
        <Route
          path="practice/:problemId"
          element={
            <Suspense fallback={<Loading label="Loading workspace…" />}>
              <ProblemWorkspace />
            </Suspense>
          }
        />
        <Route path="ai-tutor" element={lazyPage(AITutor, 'Loading AI Tutor…')} />
        <Route path="code-analyzer" element={lazyPage(CodeAnalyzer, 'Loading Code Analyzer…')} />
        <Route path="ai-questions" element={lazyPage(AIQuestions, 'Loading Question Generator…')} />
        <Route path="ai-roadmap" element={lazyPage(AIRoadmap, 'Loading AI Roadmap…')} />
        <Route path="progress" element={<MyProgress />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </ErrorBoundary>
  );
}
