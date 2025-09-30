import React from 'react';

import { RouteObject, Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dasboard";
import JobPostForm from "@/pages/JobPostForm";
import Calendar from "@/pages/Calendar";
import Team from "@/pages/Team";
import Projects from "@/pages/Projects";
import Documents from "@/pages/Documents";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import CompanyRegistrationGuard from "@/components/CompanyRegistrationGuard";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import RoleBasedDashboard from "@/components/RoleBasedDashboard";
import JobPortal from "@/pages/JobPortal";
import JobDetail from "@/components/jobPortal/job-detail";
import TestModal from "@/pages/TestModal";
import LinkedInAuth from '@/pages/LinkedInAuth';
import PaymentSuccess from '@/pages/PaymentSuccess';
import CompanyInfoForm from "@/pages/CompanyInfo";
import ResetPassword from "@/pages/ResetPassword";
import Employees from "@/pages/Employees";
import JobApplicationForm from "@/pages/JobApplicationForm";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import PayrollPage from "@/pages/Payroll";
import FinanceDashboard from "@/pages/FinanceDashboard";
import HiringHandbook from "@/pages/HiringHandbook";
import Expenses from '@/pages/Expenses';
import Loans from '@/pages/Loans';
import BulkPayments from '@/pages/BulkPayments';
import SalaryStructures from '@/pages/SalaryStructures';
import TaxManagement from '@/pages/TaxManagement';

// Create a placeholder component for routes that don't have dedicated pages yet
// eslint-disable-next-line react-refresh/only-export-components
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground">This page is under construction</p>
  </div>

);

// Component to handle Stripe return URLs like /success?session_id=...&payroll_id=...
// It preserves the query params and redirects the user into the Payroll page so
// the `usePaymentConfirmation` hook (which reads search params) can run in the
// context of the Payroll page and poll the backend for payment status.
// eslint-disable-next-line react-refresh/only-export-components
const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Preserve query params when redirecting to /payroll
    const search = location.search || '';
    navigate(`/payroll${search}`, { replace: true });
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-lg font-medium">Finishing payment...</h2>
        <p className="text-sm text-muted-foreground">Redirecting to payrolls to confirm payment status.</p>
      </div>
    </div>
  );
};




export const routes: RouteObject[] = [
  {
    path: "",
    element: <Index />,
  },
  {
    path: "/job-portal",
    element: <JobPortal />,
  },
  {
    path: "/job-detail",
    element: <JobDetail />,
  },
  {
    path: "/application",
    element: <JobApplicationForm />,
  },
  {
    path: "/modals",
    element: <TestModal />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password/:uidb64/:token",
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/company",
        element: <CompanyInfoForm />,
      },
      {
        element: <CompanyRegistrationGuard />,
        children: [
          // Role-based dashboard - single route for all roles
          {
            path: "dashboard",
            element: <RoleBasedDashboard />,
          },
          {
            path: "jobs/create",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <JobPostForm />
              </RoleBasedRoute>
            ),
          },
          {
            path: "calendar",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Calendar />
              </RoleBasedRoute>
            ),
          },
          {
            path: "team",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Team />
              </RoleBasedRoute>
            ),
          },
          {
            path: "projects",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Projects />
              </RoleBasedRoute>
            ),
          },
          {
            path: "documents",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Documents />
              </RoleBasedRoute>
            ),
          },
          {
            path: "teams",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Teams" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "employees",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Employees />
              </RoleBasedRoute>
            ),
          },
          {
            path: "attendance",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Attendance" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "checklist",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Checklist" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "time-off",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Time Off" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Hiring" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "onboarding",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <PlaceholderPage title="Onboarding" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring-handbook",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <HiringHandbook />
              </RoleBasedRoute>
            ),
          },
          // Finance Manager Routes (keeping finance-specific routes)
          {
            path: "finance",
            element: <Navigate to="/dashboard" replace />,
          },
          // Stripe return handler: render a friendly success page which will
          // attempt to confirm payment and rely on webhook polling to update
          // the payroll status across the app.
          {
            path: "success",
            element: <PaymentSuccess />,
          },
          {
            path: "payroll",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <PayrollPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "expenses",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <Expenses />
              </RoleBasedRoute>
            ),
          },
          // Redirect legacy /invoices to /loans to avoid breaking bookmarks
          {
            path: "invoices",
            element: <Navigate to="/loans" replace />,
          },
          {
            path: "loans",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <Loans />
              </RoleBasedRoute>
            ),
          },
          {
            path: "bulk-payments",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <BulkPayments />
              </RoleBasedRoute>
            ),
          },
          {
            path: "salary-structures",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <SalaryStructures />
              </RoleBasedRoute>
            ),
          },
          {
            path: "tax-management",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <TaxManagement />
              </RoleBasedRoute>
            ),
          },
          // Employee Dashboard Route - redirects to /dashboard
          {
            path: "employee-dashboard",
            element: <Navigate to="/dashboard" replace />,
          },
          // Common routes accessible by all roles
          {
            path: "settings",
            element: <PlaceholderPage title="Settings" />,
          },
          {
            path: "integrations",
            element: <PlaceholderPage title="Integrations" />,
          },
          {
            path: "support",
            element: <PlaceholderPage title="Help & Support" />,
          },
          {
            path: 'linkedin-auth/callback',
            element: <LinkedInAuth />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
