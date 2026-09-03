import { Navigate } from 'react-router-dom';

/** Approvals queue removed — every user can create and work on tasks immediately. */
export default function ApprovalsPage() {
  return <Navigate to="/all-tasks" replace />;
}
