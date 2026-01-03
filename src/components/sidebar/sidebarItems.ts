import {
  Home,
  Users,
  Briefcase,
  DollarSign,
  Settings,
  PanelRight,
  LifeBuoy,
  PlusCircle,
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  Clock,
  UserCircle,
  MessageSquare,
  Layers,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { SidebarMenuItem } from '../../types/sidebar/types';

export const sidebarItems: SidebarMenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    codename: 'view_dashboard',
  },
  {
    title: 'My Tasks',
    path: '/my-tasks',
    icon: CheckCircle2,
    allowedRoles: ['Employee', 'HR', 'Admin', 'Finance Manager'],
  },
  {
    title: 'Attendance & Leave',
    path: '/attendance-leave',
    icon: Calendar,
    allowedRoles: ['Employee', 'HR', 'Admin', 'Finance Manager'],
    codename: 'view_attendance',
  },
  {
    title: 'Register Face',
    path: '/register-face',
    icon: UserCircle,
    allowedRoles: ['HR', 'Admin'],
    codename: 'view_face_registration',
  },
  // Employee-specific quick access items (only visible to Employee role, not Admin/HR/Finance)
  {
    title: 'Loan & Expense',
    path: '/loan-expense',
    icon: CreditCard,
    allowedRoles: ['Employee'], // Removed Admin - they access via Finance submenu
    codename: 'view_loan_expense_employee',
  },
  {
    title: 'Bank Info',
    path: '/bank-info',
    icon: Building2,
    allowedRoles: ['Employee'], // Removed Admin/HR/Finance - they access via Teams or Finance submenu
    codename: 'view_bank_info',
  },
  {
    title: 'Salary Structure',
    path: '/employee-salary-structure',
    icon: Receipt,
    allowedRoles: ['Employee'], // Removed Admin - they access via Finance submenu
    codename: 'view_salary_structure_employee',
  },
  {
    title: 'Payslips',
    path: '/payslips',
    icon: FileText,
    allowedRoles: ['Employee'], // Removed Admin - they access via Finance submenu
    codename: 'view_payslips',
  },
  {
    title: 'Scheduled interviews',
    path: '/interview',
    icon: MessageSquare,
    allowedRoles: ['Employee'], // Removed Admin - they access via Hiring submenu
    codename: 'view_scheduled_interviews_employee',
  },
  {
    title: 'Teams',
    path: '/teams',
    icon: Users,
    allowedRoles: ['HR', 'Admin'],
    codename: 'view_teams_hr',
    submenu: [
      { title: 'Employees', path: '/employees', allowedRoles: ['HR', 'Admin'], codename: 'view_employees' },
      { title: 'Attendance Management', path: '/attendance-management', allowedRoles: ['HR', 'Admin'], codename: 'manage_attendance' },
      { title: 'Resource Allocation', path: '/resource-allocation', allowedRoles: ['HR', 'Admin'], codename: 'manage_resources' },
    ],
  },
  {
    title: 'Company Policy',
    path: '/company-policy',
    icon: FileText,
    allowedRoles: ['HR', 'Admin'],
    codename: 'view_company_policy',
  },
  {
    title: 'Hiring',
    path: '/hiring',
    icon: Briefcase,
    allowedRoles: ['HR', 'Admin'],
    codename: 'view_hiring_hr',
    submenu: [
      { title: 'Post job', path: '/jobs/create', allowedRoles: ['HR', 'Admin'], step: 1, codename: 'create_job' },
      { title: 'Screening Console', path: '/hiring/job-screening', allowedRoles: ['HR', 'Admin'], step: 2, codename: 'view_screening' },
      { title: 'Scheduled interviews', path: '/assessment-interview', allowedRoles: ['HR', 'Admin'], step: 3, codename: 'view_scheduled_interviews_manage' },
      { title: 'Conduct & Score', path: '/hiring/interview', allowedRoles: ['HR', 'Admin'], step: 4, codename: 'view_interview_scoring' },
      { title: 'Onboarding', path: '/onboarding', allowedRoles: ['HR', 'Admin'], step: 5, codename: 'view_onboarding' },
      { title: 'Review Offer Letters', path: '/hiring/review-offers', allowedRoles: ['HR', 'Admin'], step: 6, codename: 'review_offers' },
    ],
  },

  {
    title: 'Finance',
    path: '/finance',
    icon: DollarSign,
    allowedRoles: ['Finance Manager', 'Admin'],
    codename: 'view_finance_dashboard',
    submenu: [
      { title: 'Payroll', path: '/payroll', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_payroll' },
      { title: 'Expenses', path: '/expenses', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_expenses' },
      { title: 'Salary Structures', path: '/salary-structures', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_salary_structures' },
      { title: 'Tax Management', path: '/tax-management', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_taxes' },
      { title: 'Loans', path: '/loans', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_loans' },
      { title: 'Bulk Payments', path: '/bulk-payments', allowedRoles: ['Finance Manager', 'Admin'], codename: 'manage_bulk_payments' },
    ],
  },

  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    codename: 'view_settings',
  },
];
