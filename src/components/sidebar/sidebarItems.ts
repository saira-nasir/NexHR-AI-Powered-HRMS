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
  FileText
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
    allowedRoles: ['Employee'],
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
    allowedRoles: ['Employee'],
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
    title: 'Teams',
    path: '/teams',
    icon: Users,
    // Visible to HR and Admin
    allowedRoles: ['HR', 'Admin'],
    submenu: [
      { title: 'Employees', path: '/employees', allowedRoles: ['HR', 'Admin'] },
      { title: 'Attendance', path: '/attendance', allowedRoles: ['HR', 'Admin'] },
      { title: 'Checklist', path: '/checklist', allowedRoles: ['HR', 'Admin'] },
      { title: 'Time off', path: '/time-off', allowedRoles: ['HR', 'Admin'] },
    ],
  },
  {
    title: 'Hiring',
    path: '/hiring',
    icon: Briefcase,
    // Visible to HR and Admin
    allowedRoles: ['HR', 'Admin'],
    submenu: [
      { title: 'Onboarding', path: '/onboarding', allowedRoles: ['HR', 'Admin'] },
      { title: 'Hiring handbook', path: '/hiring-handbook', allowedRoles: ['HR', 'Admin'] },
      { title: 'Post job', path: '/jobs/create', allowedRoles: ['HR', 'Admin'] },
    ],
  },
  {
    title: 'Finance',
    path: '/finance',
    icon: DollarSign,
    // Visible to Finance Manager and Admin
    allowedRoles: ['Finance Manager', 'Admin'],
    submenu: [
      { title: 'Payroll', path: '/payroll', allowedRoles: ['Finance Manager', 'Admin'] },
      { title: 'Expenses', path: '/expenses', allowedRoles: ['Finance Manager', 'Admin'] },
      { title: 'Salary Structures', path: '/salary-structures', allowedRoles: ['Finance Manager', 'Admin'] },
      { title: 'Tax Management', path: '/tax-management', allowedRoles: ['Finance Manager', 'Admin'] },
      { title: 'Loans', path: '/loans', allowedRoles: ['Finance Manager', 'Admin'] },
      { title: 'Bulk Payments', path: '/bulk-payments', allowedRoles: ['Finance Manager', 'Admin'] },
    ],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
  },
  {
    title: 'Integrations',
    path: '/integrations',
    icon: PanelRight,
    allowedRoles: ['Admin', 'Finance Manager'],
  },
  {
    title: 'Help and support',
    path: '/support',
    icon: LifeBuoy,
  },
];
