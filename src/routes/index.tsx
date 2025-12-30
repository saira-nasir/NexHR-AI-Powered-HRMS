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

// Finance pages
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
      // 1. These routes are ACCESSIBLE even if company is not registered
      // This allows the Guard to redirect here safely
      { path: "company", element: <CompanyInfoForm /> },
      {
        path: "company-policy",
        element: (
          <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
            <CompanyPolicy />
          </RoleBasedRoute>
        ),
      },

      // 2. These routes are GUARDED. 
      // You must have a company to enter here.
      {
        element: <CompanyRegistrationGuard />,
        children: [
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
          {
            path: "assessment-interview",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <AssessmentAndInterview />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring/interview",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <HiringInterview />
              </RoleBasedRoute>
            ),
          },
          {
            path: "hiring/review-offers",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
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
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
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
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <HRAttendanceManagement />
              </RoleBasedRoute>
            ),
          },
          {
            path: "resource-allocation",
            element: (
              <RoleBasedRoute allowedRoles={["HR", "Admin"]}>
                <ResourceAllocation />
              </RoleBasedRoute>
            ),
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
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <AttendanceLeave />
              </RoleBasedRoute>
            ),
          },
          {
            path: "register-face",
            element: (
              <RoleBasedRoute allowedRoles={["Employee", "HR", "Admin", "Finance Manager"]}>
                <RegisterFace />
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
          {
            path: "interview",
            element: (
              <RoleBasedRoute allowedRoles={["Employee"]}>
                <Interview />
              </RoleBasedRoute>
            ),
          },

          // Common routes
          { path: "settings", element: <Settings /> },

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