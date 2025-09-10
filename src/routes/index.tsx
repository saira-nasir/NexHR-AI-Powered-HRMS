import { RouteObject } from "react-router-dom";
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
import CompanyInfoForm from "@/pages/CompanyInfo";
import ResetPassword from "@/pages/ResetPassword";
import Employees from "@/pages/Employees";
import JobApplicationForm from "@/pages/JobApplicationForm";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import PayrollPage from "@/pages/Payroll";
import FinanceDashboard from "@/pages/FinanceDashboard";
import HiringHandbook from "@/pages/HiringHandbook";

// Create a placeholder component for routes that don't have dedicated pages yet
// eslint-disable-next-line react-refresh/only-export-components
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground">This page is under construction</p>
  </div>
);

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
          // Role-based dashboard redirection
          {
            path: "dashboard-redirect",
            element: <RoleBasedDashboard />,
          },
          // HR/Admin Dashboard Routes
          {
            path: "dashboard",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Dashboard />
              </RoleBasedRoute>
            ),
          },
          {
            path: "/jobs/create",
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
          // Finance Manager Routes
          {
            path: "finance",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <FinanceDashboard />
              </RoleBasedRoute>
            ),
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
                <PlaceholderPage title="Expenses" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "invoices",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <PlaceholderPage title="Invoices" />
              </RoleBasedRoute>
            ),
          },
          {
            path: "payment-information",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager"]}>
                <PlaceholderPage title="Payment Information" />
              </RoleBasedRoute>
            ),
          },
          // Employee Dashboard Route
          {
            path: "employee-dashboard",
            element: (
              <RoleBasedRoute allowedRoles={["Employee"]}>
                <EmployeeDashboard />
              </RoleBasedRoute>
            ),
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
