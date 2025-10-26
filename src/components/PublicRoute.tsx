import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  if (isAuthenticated && user) {
    // Redirect authenticated users to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
