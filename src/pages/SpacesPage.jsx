import { Navigate } from 'react-router-dom';

/** Legacy /spaces URL — redirect to projects catalog */
export default function SpacesPage() {
  return <Navigate to="/projects" replace />;
}
