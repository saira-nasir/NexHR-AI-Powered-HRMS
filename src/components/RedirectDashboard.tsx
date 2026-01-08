import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getUserRole } from '@/utils/roleUtils';
import { Navigate } from 'react-router-dom';
import EmployeeDashboard from '@/pages/EmployeeDashboard';
import FinanceDashboard from '@/pages/FinanceDashboard';
import HRDashboardContent from '@/components/admin/HRDashboardContent';
import DashboardLayout from '@/layouts/DashboardLayout';

const RedirectDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions: string[] = useSelector((state: RootState) => state.auth.permissions) || [];
  const role = getUserRole(user);

  // Admins should be sent to the admin dashboard route
  if (role === 'Admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Priority: employee_dashboard > hr_dashboard > finance_dashboard
  if (permissions.includes('employee_dashboard')) {
    return <EmployeeDashboard />;
  }

  if (permissions.includes('hr_dashboard')) {
    return (
      <DashboardLayout>
        <HRDashboardContent />
      </DashboardLayout>
    );
  }

  if (permissions.includes('finance_dashboard')) {
    return <FinanceDashboard />;
  }

  // Default fallback: employee dashboard
  return <EmployeeDashboard />;
};

export default RedirectDashboard;
