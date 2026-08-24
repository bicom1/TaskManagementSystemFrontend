import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const MyTasksPage = lazy(() => import('./pages/MyTasksPage'));
const AllTasksPage = lazy(() => import('./pages/AllTasksPage'));
const AssignedCommentsPage = lazy(() => import('./pages/AssignedCommentsPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const SpacesPage = lazy(() => import('./pages/SpacesPage'));
const ProjectBoardPage = lazy(() => import('./pages/ProjectBoardPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BoardsPage = lazy(() => import('./pages/BoardsPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const TeamsHubLayout = lazy(() => import('./pages/teams/TeamsHubLayout'));
const AllPeoplePage = lazy(() => import('./pages/teams/AllPeoplePage'));
const AllTeamsPage = lazy(() => import('./pages/teams/AllTeamsPage'));
const TeamDetailPage = lazy(() => import('./pages/teams/TeamDetailPage'));
const OrgChartPage = lazy(() => import('./pages/teams/OrgChartPage'));
const TeamsAnalyticsPage = lazy(() => import('./pages/teams/TeamsAnalyticsPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="home/my-tasks" element={<MyTasksPage />} />
        <Route path="all-tasks" element={<AllTasksPage />} />
        <Route path="home/assigned-comments" element={<AssignedCommentsPage />} />
        <Route path="home/agenda" element={<AgendaPage />} />
        <Route path="home/meetings" element={<AgendaPage />} />
        <Route path="inbox" element={<NotificationsPage />} />
        <Route path="notifications" element={<Navigate to="/inbox" replace />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectBoardPage />} />
        <Route path="spaces" element={<SpacesPage />} />
        <Route path="spaces/:id" element={<ProjectBoardPage />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="teams" element={<TeamsHubLayout />}>
          <Route index element={<Navigate to="people" replace />} />
          <Route path="people" element={<AllPeoplePage />} />
          <Route path="all" element={<AllTeamsPage />} />
          <Route path="org" element={<OrgChartPage />} />
          <Route path="analytics" element={<TeamsAnalyticsPage />} />
          <Route path=":teamId" element={<TeamDetailPage />} />
        </Route>
        <Route path="people" element={<Navigate to="/teams/people" replace />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
