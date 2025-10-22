import React from "react";
import { RouteObject, Navigate, useLocation, useNavigate } from "react-router-dom";

// Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import CompanyInfoForm from "@/pages/CompanyInfo";
import Dashboard from "@/pages/Dasboard";
import JobPostForm from "@/pages/JobPostForm";
import Calendar from "@/pages/Calendar";
import Team from "@/pages/Team";
import Projects from "@/pages/Projects";
import Documents from "@/pages/Documents";
import Employees from "@/pages/Employees";
import JobPortal from "@/pages/JobPortal";
import JobDetail from "@/components/jobPortal/job-detail";
import JobApplicationForm from "@/pages/JobApplicationForm";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import PayrollPage from "@/pages/Payroll";
import FinanceDashboard from "@/pages/FinanceDashboard";
import HiringHandbook from "@/pages/HiringHandbook";
import JobScreening from "@/pages/JobScreening";
import LinkedInAuth from "@/pages/LinkedInAuth";
import PaymentSuccess from "@/pages/PaymentSuccess";
import TestModal from "@/pages/TestModal";
import NotFound from "@/pages/NotFound";
import AttendanceLeave from "@/pages/AttendanceLeave";
import BankInfo from "@/pages/BankInfo";
import EmployeeSalaryStructure from "@/pages/EmployeeSalaryStructure";
import Payslips from "@/pages/Payslips";

// Finance pages used in routes (ensure these files exist)
import Expenses from "@/pages/Expenses";
import Loans from "@/pages/Loans";
import BulkPayments from "@/pages/BulkPayments";
import SalaryStructures from "@/pages/SalaryStructures";
import TaxManagement from "@/pages/TaxManagement";
import LoanExpense from "@/pages/LoanExpense";

// Route Guards
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import CompanyRegistrationGuard from "@/components/CompanyRegistrationGuard";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import RoleBasedDashboard from "@/components/RoleBasedDashboard";

// Simple placeholder for pages still under construction
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground">This page is under construction</p>
  </div>
);

// Stripe Payment Redirect Handler
const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const search = location.search || "";
    navigate(`/payroll${search}`, { replace: true });
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-lg font-medium">Finishing payment...</h2>
        <p className="text-sm text-muted-foreground">
          Redirecting to payroll to confirm payment status.
        </p>
      </div>
    </div>
  );
};




// ✅ All Routes
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
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password/:uidb64/:token", element: <ResetPassword /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { path: "company", element: <CompanyInfoForm /> },
      {
        element: <CompanyRegistrationGuard />,
        children: [
          // Role-based dashboard
          { path: "dashboard", element: <RoleBasedDashboard /> },
          // HR & Admin Routes
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
            path: "employees",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <Employees />
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
          {
            path: "hiring/job-screening",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <JobScreening />
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

          // Finance Manager Routes
          { path: "finance", element: <Navigate to="/dashboard" replace /> },
          { path: "success", element: <PaymentSuccess /> },
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
          { path: "invoices", element: <Navigate to="/loans" replace /> },
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

          // Employee Routes
          { path: "employee-dashboard", element: <Navigate to="/dashboard" replace /> },
          {
            path: "attendance-leave",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin"]}>
                <AttendanceLeave />
              </RoleBasedRoute>
            ),
          },
          {
            path: "loan-expense",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "Finance Manager"]}>
                <LoanExpense />
              </RoleBasedRoute>
            ),
          },
          {
            path: "bank-info",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <BankInfo />
              </RoleBasedRoute>
            ),
          },
          {
            path: "employee-salary-structure",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <EmployeeSalaryStructure />
              </RoleBasedRoute>
            ),
          },
          {
            path: "payslips",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <Payslips />
              </RoleBasedRoute>
            ),
          },

          // Common routes
          { path: "settings", element: <PlaceholderPage title="Settings" /> },
          { path: "integrations", element: <PlaceholderPage title="Integrations" /> },
          { path: "support", element: <PlaceholderPage title="Help & Support" /> },
          { path: "linkedin-auth/callback", element: <LinkedInAuth /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
