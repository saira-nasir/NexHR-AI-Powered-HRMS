// Role utility functions for role-based access control

// User interface for type safety
export interface User {
  roles?: Array<string | { name?: string; title?: string; role?: string }>;
  role?: string | { name?: string; title?: string; role?: string };
  user_role?: string;
  primaryRole?: string;
  primary_role?: string;
  group?: string;
  group_name?: string;
  email?: string; // Added field
}

export const ROLES = {
  HR: 'HR',
  ADMIN: 'Admin',
  FINANCE_MANAGER: 'Finance Manager',
  EMPLOYEE: 'Employee'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Normalizes a raw role string into one of the app's canonical role constants
export const normalizeRoleName = (raw?: string | null): UserRole | undefined => {
  if (!raw) return undefined;
  const v = String(raw).trim();

  // Exact matches first (case sensitive)
  if (v === 'HR') return ROLES.HR;
  if (v === 'Admin') return ROLES.ADMIN;
  if (v === 'Finance Manager') return ROLES.FINANCE_MANAGER;
  if (v === 'Employee') return ROLES.EMPLOYEE;

  // Case insensitive matches
  const lower = v.toLowerCase();
  if (lower === 'hr' || lower === 'human resources' || lower === 'hr manager' || lower === 'hr admin') return ROLES.HR;
  if (lower === 'admin' || lower === 'administrator' || lower === 'superadmin' || lower === 'super admin') return ROLES.ADMIN;
  if (lower === 'finance manager' || lower === 'finance' || lower === 'accounting' || lower === 'accounts') return ROLES.FINANCE_MANAGER;
  if (lower === 'employee' || lower === 'staff' || lower === 'user' || lower === 'member') return ROLES.EMPLOYEE;

  return undefined;
};

// Role-based dashboard mapping - all roles now use /dashboard
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  [ROLES.HR]: '/dashboard',
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.FINANCE_MANAGER]: '/dashboard',
  [ROLES.EMPLOYEE]: '/dashboard'
};

// Note: Using the exported normalizeRoleName function defined above

// Get user's primary role from user data
export const getUserRole = (user?: User | null): UserRole => {
  if (!user) return ROLES.EMPLOYEE;

  console.log('DEBUG getUserRole - User Input:', user); // DEBUG LOG
  console.log('DEBUG getUserRole - Raw Role:', user.role); // DEBUG LOG
  console.log('DEBUG getUserRole - Roles Array:', user.roles); // DEBUG LOG

  // Common shapes to check in order of likelihood
  // 1) roles: string[] | { name?: string; title?: string; role?: string }[]
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];
    if (typeof firstRole === 'string') {
      return normalizeRoleName(firstRole) || (firstRole as UserRole);
    }
    if (firstRole && typeof firstRole === 'object') {
      const normalized = normalizeRoleName(firstRole.name || firstRole.title || firstRole.role);
      if (normalized) return normalized;
      // Fallback to any string-ish value inside
      const arbitrary = (firstRole.name || firstRole.title || firstRole.role) as string | undefined;
      if (arbitrary) return arbitrary as UserRole;
    }
  }

  // 2) role object or string on user (trust backend default here)
  if (user.role) {
    if (typeof user.role === 'string') {
      return normalizeRoleName(user.role) || (user.role as UserRole);
    }
    if (typeof user.role === 'object') {
      const normalized = normalizeRoleName(user.role.name || user.role.title || user.role.role);
      if (normalized) return normalized;
    }
  }

  // 3) alternate single-role fields often seen from APIs
  const altSingleRole = user.user_role || user.primaryRole || user.primary_role || user.group || user.group_name;
  if (altSingleRole) {
    const normalized = normalizeRoleName(altSingleRole);
    if (normalized) return normalized;
    return altSingleRole as UserRole;
  }

  // 4) Check for Django superuser/staff flags if role is missing
  // (Adding type assertion since is_superuser might not be in User interface yet)
  const u = user as any;
  if (u.is_superuser) return ROLES.ADMIN;
  if (u.is_staff) return ROLES.ADMIN;

  // Hardcoded fallback for the known admin email (failsafe)
  if (user.email === 'admin@nexhr.com') return ROLES.ADMIN;

  // Default fallback: align with safest default (Employee)
  return ROLES.EMPLOYEE;
};

// Get dashboard path for user role - now always returns /dashboard
export const getDashboardPath = (user?: User | null): string => {
  const role = getUserRole(user);
  const path = ROLE_DASHBOARD_MAP[role] || ROLE_DASHBOARD_MAP[ROLES.EMPLOYEE];
  return path;
};

// Check if user has required role
export const hasRole = (user: User | null | undefined, requiredRoles?: string[]): boolean => {
  // If no roles are required, grant access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRole = getUserRole(user);
  const hasAccess = requiredRoles.includes(userRole);
  return hasAccess;
};

// Check if user is HR or Admin (they have similar permissions)
export const isHRorAdmin = (user: User | null | undefined): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.HR || userRole === ROLES.ADMIN;
};

// Check if user is Finance Manager
export const isFinanceManager = (user: User | null | undefined): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.FINANCE_MANAGER;
};

// Check if user is Employee
export const isEmployee = (user: User | null | undefined): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.EMPLOYEE;
};
