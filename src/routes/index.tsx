import React from "react";
import { RouteObject, Navigate, useLocation, useNavigate } from "react-router-dom";

// Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import CompanyInfoForm from "@/pages/CompanyInfo";
// ... other imports ...
import JobPostForm from "@/pages/JobPostForm";
import Calendar from "@/pages/Calendar";
import Team from "@/pages/Team";
import Projects from "@/pages/Projects";
import Documents from "@/pages/Documents";
import Employees from "@/pages/Employees";
import JobPortal from "@/pages/JobPortal";
import JobDetail from "@/components/jobPortal/job-detail";
import JobApplicationForm from "@/pages/JobApplicationForm";
import PayrollPage from "@/pages/Payroll";
import HiringHandbook from "@/pages/HiringHandbook";
import JobScreening from "@/pages/JobScreening";
import AssessmentAndInterview from "@/pages/AssessmentInterview";
import JobCandidatesDetail from "@/pages/JobCandidatesDetail";
import Onboarding from "@/pages/Onboarding";
import OnboardCandidate from "@/pages/OnboardCandidate";
import LinkedInAuth from "@/pages/LinkedInAuth";
import PaymentSuccess from "@/pages/PaymentSuccess";
import TestModal from "@/pages/TestModal";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/NotFound";
import AttendanceLeave from "@/pages/AttendanceLeave";
import BankInfo from "@/pages/BankInfo";
import EmployeeSalaryStructure from "@/pages/EmployeeSalaryStructure";
import Payslips from "@/pages/Payslips";
import { HRAttendanceManagement } from "@/pages/HRAttendanceManagement";
import RegisterFace from "@/pages/RegisterFace";
import Interview from "@/pages/Interview";
import HiringInterview from "@/pages/HiringInterview";
import CompanyPolicy from "@/pages/CompanyPolicy";
import Settings from "@/pages/Settings";
import ResourceAllocation from "@/pages/ResourceAllocation";
import ReviewOfferLetters from "@/pages/ReviewOfferLetters";
import MyTasksDashboard from "@/pages/MyTasksDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

// Finance pages
import Expenses from "@/pages/Expenses";
import Loans from "@/pages/Loans";
import BulkPayments from "@/pages/BulkPayments";
import SalaryStructures from "@/pages/SalaryStructures";

import LoanExpense from "@/pages/LoanExpense";
import RolesAndPermissions from "@/pages/RolesAndPermissions";

// Route Guards
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import CompanyRegistrationGuard from "@/components/CompanyRegistrationGuard";
import CompanyOnlyGuard from "@/components/CompanyOnlyGuard";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import ExcludeAdminRoute from "@/components/ExcludeAdminRoute";

import Dashboard from "@/pages/Dasboard"; // Using direct dashboard as default
import RedirectDashboard from "@/components/RedirectDashboard";

import PlaceholderPage from "@/components/PlaceholderPage";


// Routes
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
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/job-detail/:jobId",
    element: <JobDetail />,
  },
  {
    path: "/application/:jobId",
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
      // 1. These routes are ACCESSIBLE only when explicitly allowed
      // The Company page should only be shown if the server indicates `company_register`.
      {
        path: "company", element: (
          <CompanyOnlyGuard>
            <CompanyInfoForm />
          </CompanyOnlyGuard>
        )
      },
      {
        path: "company-policy",
        element: (
          <RoleBasedRoute requiredPermission="company_policy">
            <CompanyPolicy />
          </RoleBasedRoute>
        ),
      },

      // 2. These routes are GUARDED. 
      // You must have a company to enter here.
      {
        element: <CompanyRegistrationGuard />,
        children: [
          { path: "dashboard", element: <RedirectDashboard /> },
          {
            path: "admin-dashboard",
            element: (
              <RoleBasedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </RoleBasedRoute>
            )
          },

          // HR & Admin Routes
          {
            path: "jobs/create",
            element: (
              <RoleBasedRoute requiredPermission="post_job">
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
              <RoleBasedRoute requiredPermission="teams">
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
              <RoleBasedRoute requiredPermission="employees">
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
              <RoleBasedRoute requiredPermission="screening_console">
                <JobScreening />
              </RoleBasedRoute>
            ),
          },
          {
            path: "assessment-interview",
            element: (
              <RoleBasedRoute requiredPermission="interview_scheduling">
                <AssessmentAndInterview />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring/interview",
            element: (
              <RoleBasedRoute requiredPermission="conduct_score">
                <HiringInterview />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring/review-offers",
            element: (
              <RoleBasedRoute requiredPermission="review_offer_letter">
                <ReviewOfferLetters />
              </RoleBasedRoute>
            ),
          },
          {
            path: "job-candidates/:jobId",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <JobCandidatesDetail />
              </RoleBasedRoute>
            ),
          },
          {
            path: "onboarding",
            element: (
              <RoleBasedRoute requiredPermission="onboarding">
                <Onboarding />
              </RoleBasedRoute>
            ),
          },
          {
            path: "onboard/:applicationId",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <OnboardCandidate />
              </RoleBasedRoute>
            ),
          },
          {
            path: "attendance-management",
            element: (
              <RoleBasedRoute requiredPermission="attendance_management">
                <HRAttendanceManagement />
              </RoleBasedRoute>
            ),
          },
          {
            path: "resource-allocation",
            element: (
              <RoleBasedRoute requiredPermission="resource_allocation">
                <ResourceAllocation />
              </RoleBasedRoute>
            ),
          },

          // Admin Routes
          {
            path: "admin/roles-permissions",
            element: (
              <RoleBasedRoute requiredPermission="roles_permissions">
                <RolesAndPermissions />
              </RoleBasedRoute>
            ),
          },

          // Finance Manager & Admin Routes
          { path: "finance", element: <Navigate to="/dashboard" replace /> },
          { path: "success", element: <PaymentSuccess /> },
          {
            path: "payroll",
            element: <PayrollPage />,
          },
          {
            path: "expenses",
            element: <Expenses />,
          },
          { path: "invoices", element: <Navigate to="/loans" replace /> },
          {
            path: "loans",
            element: <Loans />,
          },
          {
            path: "bulk-payments",
            element: <BulkPayments />,
          },
          {
            path: "salary-structures",
            element: <SalaryStructures />,
          },
          {
            path: "tax-management",
            element: (
              <RoleBasedRoute allowedRoles={["Finance Manager", "Admin"]}>
                <Navigate to="/dashboard" replace />
              </RoleBasedRoute>
            ),
          },


          // Employee Routes
          {
            path: "my-tasks",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <MyTasksDashboard />
              </RoleBasedRoute>
            ),
          },
          { path: "employee-dashboard", element: <Navigate to="/dashboard" replace /> },
          {
            path: "attendance-leave",
            element: (
              <RoleBasedRoute requiredPermission="attendance_leave">
                <AttendanceLeave />
              </RoleBasedRoute>
            ),
          },
          {
            path: "register-face",
            element: (
              <RoleBasedRoute requiredPermission="register_face">
                <RegisterFace />
              </RoleBasedRoute>
            ),
          },
          {
            path: "loan-expense",
            element: (
              <RoleBasedRoute requiredPermission="loan_expense">
                <LoanExpense />
              </RoleBasedRoute>
            ),
          },
          {
            path: "bank-info",
            element: (
              <ExcludeAdminRoute>
                <BankInfo />
              </ExcludeAdminRoute>
            ),
          },
          {
            path: "employee-salary-structure",
            element: (
              <RoleBasedRoute allowedRoles={["Employee"]} requiredPermission="salary_structures">
                <EmployeeSalaryStructure />
              </RoleBasedRoute>
            ),
          },
          {
            path: "payslips",
            element: (
              <RoleBasedRoute requiredPermission="payslips">
                <Payslips />
              </RoleBasedRoute>
            ),
          },
          {
            path: "interview",
            element: (
              <RoleBasedRoute requiredPermission="my_scheduled_interviews">
                <Interview />
              </RoleBasedRoute>
            ),
          },

          // Common routes
          {
            path: "settings",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]} requiredPermission="settings">
                <Settings />
              </RoleBasedRoute>
            )
          },

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