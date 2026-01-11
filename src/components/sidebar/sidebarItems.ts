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
  },
  {
    title: 'My Tasks',
    path: '/my-tasks',
    icon: CheckCircle2,
    codename: 'my_tasks',
  },
  {
    title: 'Attendance & Leave',
    path: '/attendance-leave',
    icon: Calendar,
    codename: 'attendance_leave',
  },
  {
    title: 'Register Face',
    path: '/register-face',
    icon: UserCircle,
    codename: 'register_face',
  },
  {
    title: 'Loan & Expense',
    path: '/loan-expense',
    icon: CreditCard,
    codename: 'loan_expense',
  },
  {
    title: 'Bank Info',
    path: '/bank-info',
    icon: Building2,
  },
  {
    title: 'Salary Structure',
    path: '/employee-salary-structure',
    icon: Receipt,
    codename: 'salary_structures', // Matches user plural
  },
  {
    title: 'Payslips',
    path: '/payslips',
    icon: FileText,
    codename: 'payslips',
  },
  {
    title: 'My Scheduled Interviews',
    path: '/interview',
    icon: MessageSquare,
    codename: 'my_scheduled_interviews',
  },
  {
    title: 'Teams Manegement',
    path: '/teams',
    icon: Users,
    submenu: [
      { title: 'Employees', path: '/employees', codename: 'employees' },
      { title: 'Branches & Departments', path: '/branches-departments', codename: 'branches_departments' },
      { title: 'Attendance Management', path: '/attendance-management', codename: 'attendance_management' },
      { title: 'Resource Allocation', path: '/resource-allocation', codename: 'resource_allocation' },
    ],
  },
  {
    title: 'Company Policy',
    path: '/company-policy',
    icon: FileText,
    codename: 'company_policy',
  },
  {
    title: 'Hiring',
    path: '/hiring',
    icon: Briefcase,
    codename: 'hiring',
    submenu: [
      { title: 'Post job', path: '/jobs/create', step: 1, codename: 'post_job' },
      { title: 'Screening Console', path: '/hiring/job-screening', step: 2, codename: 'screening_console' },
      { title: 'Interview Scheduling', path: '/assessment-interview', step: 3, codename: 'interview_scheduling' },
      { title: 'Conduct & Score', path: '/hiring/interview', step: 4, codename: 'conduct_score' },
      { title: 'Onboarding', path: '/onboarding', step: 5, codename: 'onboarding' },
      { title: 'Review Offer Letters', path: '/hiring/review-offers', step: 6, codename: 'review_offer_letter' },
    ],
  },
  {
    title: 'Finance',
    path: '/finance',
    icon: DollarSign,
    codename: 'finance',
    submenu: [
      { title: 'Payroll', path: '/payroll', codename: 'payroll' },
      { title: 'Expenses', path: '/expenses', codename: 'expenses' },
      { title: 'Salary Structures', path: '/salary-structures', codename: 'salary_structures' },
      { title: 'Tax Management', path: '/tax-management', codename: 'tax_management' },
      { title: 'Loans', path: '/loans', codename: 'loans' },
      { title: 'Bulk Payments', path: '/bulk-payments', codename: 'bulk_payments' },
    ],
  },
  {
    title: 'Roles & Permissions',
    path: '/admin/roles-permissions',
    icon: Shield,
    codename: 'roles_permissions',
  },

  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    codename: 'settings',
  },
];
