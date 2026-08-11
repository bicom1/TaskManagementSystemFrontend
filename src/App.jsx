import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import HomePage from './pages/HomePage';
import AuditLogsPage from './pages/AuditLogsPage';
import MyTasksPage from './pages/MyTasksPage';
import AllTasksPage from './pages/AllTasksPage';
import AssignedCommentsPage from './pages/AssignedCommentsPage';
import AgendaPage from './pages/AgendaPage';
import ProjectsPage from './pages/ProjectsPage';
import SpacesPage from './pages/SpacesPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import BoardsPage from './pages/BoardsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import TeamsHubLayout from './pages/teams/TeamsHubLayout';
import AllPeoplePage from './pages/teams/AllPeoplePage';
import AllTeamsPage from './pages/teams/AllTeamsPage';
import TeamDetailPage from './pages/teams/TeamDetailPage';
import OrgChartPage from './pages/teams/OrgChartPage';
import TeamsAnalyticsPage from './pages/teams/TeamsAnalyticsPage';

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
