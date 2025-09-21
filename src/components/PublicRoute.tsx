import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  // Only redirect once user is loaded to avoid redirecting before role is available
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard-redirect" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
