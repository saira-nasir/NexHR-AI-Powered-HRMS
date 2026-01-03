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
    codename: 'dashboard',
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
    codename: 'attendance_leave',
  },
  {
    title: 'Register Face',
    path: '/register-face',
    icon: UserCircle,
    allowedRoles: ['HR', 'Admin'],
    codename: 'register_face',
  },
  {
    title: 'Loan & Expense',
    path: '/loan-expense',
    icon: CreditCard,
    allowedRoles: ['Employee'],
    codename: 'loan_expense',
  },
  {
    title: 'Bank Info',
    path: '/bank-info',
    icon: Building2,
    allowedRoles: ['Employee'],
    codename: 'bank_info',
  },
  {
    title: 'Salary Structure',
    path: '/employee-salary-structure',
    icon: Receipt,
    allowedRoles: ['Employee'],
    codename: 'salary_structure',
  },
  {
    title: 'Payslips',
    path: '/payslips',
    icon: FileText,
    allowedRoles: ['Employee'],
    codename: 'payslips',
  },
  {
    title: 'Scheduled interviews',
    path: '/interview',
    icon: MessageSquare,
    allowedRoles: ['Employee'],
    codename: 'scheduled_interviews_employee', // Suffix to distinguish from HR interview view? Or just scheduled_interviews? Title is same. Let's use 'scheduled_interviews_employee' to be safe or matches title strictly 'scheduled_interviews'. I'll use 'scheduled_interviews'.
  },
  {
    title: 'Teams',
    path: '/teams',
    icon: Users,
    allowedRoles: ['HR', 'Admin'],
    codename: 'teams',
    submenu: [
      { title: 'Employees', path: '/employees', allowedRoles: ['HR', 'Admin'], codename: 'employees' },
      { title: 'Attendance Management', path: '/attendance-management', allowedRoles: ['HR', 'Admin'], codename: 'attendance_management' },
      { title: 'Resource Allocation', path: '/resource-allocation', allowedRoles: ['HR', 'Admin'], codename: 'resource_allocation' },
    ],
  },
  {
    title: 'Company Policy',
    path: '/company-policy',
    icon: FileText,
    allowedRoles: ['HR', 'Admin'],
    codename: 'company_policy',
  },
  {
    title: 'Hiring',
    path: '/hiring',
    icon: Briefcase,
    allowedRoles: ['HR', 'Admin'],
    codename: 'hiring',
    submenu: [
      { title: 'Post job', path: '/jobs/create', allowedRoles: ['HR', 'Admin'], step: 1, codename: 'post_job' },
      { title: 'Screening Console', path: '/hiring/job-screening', allowedRoles: ['HR', 'Admin'], step: 2, codename: 'screening_console' },
      { title: 'Scheduled interviews', path: '/assessment-interview', allowedRoles: ['HR', 'Admin'], step: 3, codename: 'scheduled_interviews_hr' }, // Distinguish from employee view? Or just 'scheduled_interviews_manage'? Clean: 'scheduled_interviews_hr'
      { title: 'Conduct & Score', path: '/hiring/interview', allowedRoles: ['HR', 'Admin'], step: 4, codename: 'conduct_score' },
      { title: 'Onboarding', path: '/onboarding', allowedRoles: ['HR', 'Admin'], step: 5, codename: 'onboarding' },
      { title: 'Review Offer Letters', path: '/hiring/review-offers', allowedRoles: ['HR', 'Admin'], step: 6, codename: 'review_offers' },
    ],
  },

  {
    title: 'Finance',
    path: '/finance',
    icon: DollarSign,
    allowedRoles: ['Finance Manager', 'Admin'],
    codename: 'finance',
    submenu: [
      { title: 'Payroll', path: '/payroll', allowedRoles: ['Finance Manager', 'Admin'], codename: 'payroll' },
      { title: 'Expenses', path: '/expenses', allowedRoles: ['Finance Manager', 'Admin'], codename: 'expenses' },
      { title: 'Salary Structures', path: '/salary-structures', allowedRoles: ['Finance Manager', 'Admin'], codename: 'salary_structures' },
      { title: 'Tax Management', path: '/tax-management', allowedRoles: ['Finance Manager', 'Admin'], codename: 'tax_management' },
      { title: 'Loans', path: '/loans', allowedRoles: ['Finance Manager', 'Admin'], codename: 'loans' },
      { title: 'Bulk Payments', path: '/bulk-payments', allowedRoles: ['Finance Manager', 'Admin'], codename: 'bulk_payments' },
    ],
  },

  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    codename: 'settings',
  },
];
