import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEffect, useState } from 'react';
import { hasRole, getDashboardPath, getUserRole } from '@/utils/roleUtils';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = useSelector((state: RootState) => state.auth.permissions) || [];
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait until user data is loaded
    if (isAuthenticated && user !== null) {
      setIsLoading(false);
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C5470]"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If user data is not available, redirect to login
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if user has required role - only if NO permission check was done
  // If requiredPermission exists, we already checked it above and granted/denied access
  // Only check roles if there's no permission requirement
  if (!requiredPermission && allowedRoles && allowedRoles.length > 0) {
    const hasAccess = hasRole(user, allowedRoles);
    if (!hasAccess) {
      const redirectPath = getDashboardPath(user);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Check required permission if specified
  // BYPASS permission check for Admins - they have full access
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    const redirectPath = getDashboardPath(user);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
