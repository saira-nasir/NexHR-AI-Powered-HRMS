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
  Shield
} from 'lucide-react';
import { SidebarMenuItem } from '../../types/sidebar/types';

export const sidebarItems: SidebarMenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: Home,
  },
  {
    title: 'Attendance & Leave',
    path: '/attendance-leave',
    icon: Calendar,
    allowedRoles: ['Employee', 'HR', 'Admin', 'Finance Manager'],
  },
  {
    title: 'Register Face',
    path: '/register-face',
    icon: UserCircle,
    allowedRoles: ['HR', 'Admin'],
    // Previously visible to all roles, now restricted to HR and Admin only
  },
  {
    title: 'Loan & Expense',
    path: '/loan-expense',
    icon: CreditCard,
    allowedRoles: ['Employee'],
  },
  {
    title: 'Bank Info',
    path: '/bank-info',
    icon: Building2,
    allowedRoles: ['Employee', 'HR', 'Admin', 'Finance Manager'],
  },
  {
    title: 'Salary Structure',
    path: '/employee-salary-structure',
    icon: Receipt,
    allowedRoles: ['Employee'],
  },
  {
    title: 'Payslips',
    path: '/payslips',
    icon: FileText,
    allowedRoles: ['Employee'],
  },
  {
    title: 'Scheduled interviews',
    path: '/interview',
    icon: MessageSquare,
    allowedRoles: ['Employee'],
  },
  {
    title: 'Teams',
    path: '/teams',
    icon: Users,
    // HR-only in main sidebar; Admin sees these under "HR Management"
    allowedRoles: ['HR'],
    submenu: [
      { title: 'Employees', path: '/employees', allowedRoles: ['HR', 'Admin'] },
      { title: 'Attendance Management', path: '/attendance-management', allowedRoles: ['HR', 'Admin'] },
      { title: 'Resource Allocation', path: '/resource-allocation', allowedRoles: ['HR', 'Admin'] },
    ],
  },
  {
    title: 'Company Policy',
    path: '/company-policy',
    icon: FileText,
    // HR-only in main sidebar; Admin sees this under "HR Management"
    allowedRoles: ['HR'],
  },
  {
    title: 'Hiring',
    path: '/hiring',
    icon: Briefcase,
    // HR-only in main sidebar; Admin sees these under "HR Management"
    allowedRoles: ['HR'],
    submenu: [
      { title: 'Post job', path: '/jobs/create', allowedRoles: ['HR', 'Admin'], step: 1 },
      { title: 'Screening Console', path: '/hiring/job-screening', allowedRoles: ['HR', 'Admin'], step: 2 },
      { title: 'Scheduled interviews', path: '/assessment-interview', allowedRoles: ['HR', 'Admin'], step: 3 },
      { title: 'Conduct & Score', path: '/hiring/interview', allowedRoles: ['HR', 'Admin'], step: 4 },
      { title: 'Onboarding', path: '/onboarding', allowedRoles: ['HR', 'Admin'], step: 5 },
      { title: 'Review Offer Letters', path: '/hiring/review-offers', allowedRoles: ['HR', 'Admin'], step: 6 },
    ],
  },
  // Admin-only consolidated HR section (HR Management)
  {
    title: 'HR Management',
    path: '/hr-management',
    icon: Briefcase,
    allowedRoles: ['Admin'],
    submenu: [
      // Teams-related
      { title: 'Employees', path: '/employees', allowedRoles: ['Admin'] },
      { title: 'Attendance Management', path: '/attendance-management', allowedRoles: ['Admin'] },
      // Hiring-related
      { title: 'Post job', path: '/jobs/create', allowedRoles: ['Admin'], step: 1 },
      { title: 'Screening Console', path: '/hiring/job-screening', allowedRoles: ['Admin'], step: 2 },
      { title: 'Scheduled interviews', path: '/assessment-interview', allowedRoles: ['Admin'], step: 3 },
      { title: 'Conduct & Score', path: '/hiring/interview', allowedRoles: ['Admin'], step: 4 },
      { title: 'Onboarding', path: '/onboarding', allowedRoles: ['Admin'], step: 5 },
      // Other HR tools
      { title: 'Company Policy', path: '/company-policy', allowedRoles: ['Admin'] },
    ],
  },
  {
    title: 'Finance',
    path: '/finance',
    icon: DollarSign,
    // Visible to Finance Manager only; Admin sees these under "Accounts"
    allowedRoles: ['Finance Manager'],
    submenu: [
      { title: 'Payroll', path: '/payroll', allowedRoles: ['Finance Manager'] },
      { title: 'Expenses', path: '/expenses', allowedRoles: ['Finance Manager'] },
      { title: 'Salary Structures', path: '/salary-structures', allowedRoles: ['Finance Manager'] },
      { title: 'Tax Management', path: '/tax-management', allowedRoles: ['Finance Manager'] },
      { title: 'Loans', path: '/loans', allowedRoles: ['Finance Manager'] },
      { title: 'Bulk Payments', path: '/bulk-payments', allowedRoles: ['Finance Manager'] },
    ],
  },
  // Admin-only consolidated Finance section (Accounts)
  {
    title: 'Accounts',
    path: '/accounts',
    icon: DollarSign,
    allowedRoles: ['Admin'],
    submenu: [
      { title: 'Payroll', path: '/payroll', allowedRoles: ['Admin'] },
      { title: 'Expenses', path: '/expenses', allowedRoles: ['Admin'] },
      { title: 'Salary Structures', path: '/salary-structures', allowedRoles: ['Admin'] },
      { title: 'Tax Management', path: '/tax-management', allowedRoles: ['Admin'] },
      { title: 'Loans', path: '/loans', allowedRoles: ['Admin'] },
      { title: 'Bulk Payments', path: '/bulk-payments', allowedRoles: ['Admin'] },
    ],
  },
  {
    title: 'Roles & Permissions',
    path: '/admin/roles-permissions',
    icon: Shield,
    allowedRoles: ['Admin'],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];
