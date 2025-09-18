import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEffect, useState } from 'react';
import { getUserRole, ROLES } from '@/utils/roleUtils';
import Dashboard from '@/pages/Dasboard';
import FinanceDashboard from '@/pages/FinanceDashboard';
import EmployeeDashboard from '@/pages/EmployeeDashboard';

const RoleBasedDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user data is not available, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get user's role and render appropriate dashboard component
  const userRole = getUserRole(user);
  
  // Render different dashboard components based on role
  switch (userRole) {
    case ROLES.HR:
    case ROLES.ADMIN:
      return <Dashboard />;
    case ROLES.FINANCE_MANAGER:
      return <FinanceDashboard />;
    case ROLES.EMPLOYEE:
      return <EmployeeDashboard />;
    default:
      // Fallback to employee dashboard for unknown roles
      return <EmployeeDashboard />;
  }
};

export default RoleBasedDashboard;
