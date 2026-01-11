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
  if (requiredPermission) {
    // Fall back to localStorage permissions if Redux permissions are empty
    const localPermissionsRaw = typeof window !== 'undefined' ? window.localStorage.getItem('permissions') : null;
    let localPermissions: string[] = [];
    if (localPermissionsRaw) {
      try {
        const parsed = JSON.parse(localPermissionsRaw);
        if (Array.isArray(parsed)) localPermissions = parsed;
        else if (typeof parsed === 'string') localPermissions = parsed.split(',').map(s => s.trim());
      } catch {
        localPermissions = localPermissionsRaw.split(',').map(s => s.trim());
      }
    }

    let hasPermission = permissions.includes(requiredPermission) || localPermissions.includes(requiredPermission);
    
    // Special case: accept my_salary_structure, my_salary_strcuture (typo), or salary_structures interchangeably
    if (requiredPermission === 'salary_structures') {
      hasPermission = hasPermission || permissions.includes('my_salary_structure') || permissions.includes('my_salary_strcuture') || localPermissions.includes('my_salary_structure') || localPermissions.includes('my_salary_strcuture');
    }
    
    if (!hasPermission) {
      const redirectPath = getDashboardPath(user);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
