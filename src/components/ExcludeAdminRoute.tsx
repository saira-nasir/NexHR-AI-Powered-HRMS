import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getUserRole, ROLES, getDashboardPath } from '@/utils/roleUtils';

interface ExcludeAdminRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const ExcludeAdminRoute: React.FC<ExcludeAdminRouteProps> = ({ children, fallbackPath = '/login' }) => {
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user !== null) setIsLoading(false);
    else if (!isAuthenticated) setIsLoading(false);
  }, [isAuthenticated, user]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C5470]"></div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  if (!user) return <Navigate to={fallbackPath} state={{ from: location }} replace />;

  const role = getUserRole(user);
  if (role === ROLES.ADMIN) {
    const redirectPath = getDashboardPath(user);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ExcludeAdminRoute;
