// Role utility functions for role-based access control

export const ROLES = {
  HR: 'HR',
  ADMIN: 'Admin',
  FINANCE_MANAGER: 'Finance Manager',
  EMPLOYEE: 'Employee'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role-based dashboard mapping - all roles now use /dashboard
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  [ROLES.HR]: '/dashboard',
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.FINANCE_MANAGER]: '/dashboard',
  [ROLES.EMPLOYEE]: '/dashboard'
};

// Get user's primary role from user data
export const getUserRole = (user: any): UserRole => {
  if (!user) return ROLES.EMPLOYEE;
  
  // Check if user has roles array
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    // Handle both string array and object array formats
    const firstRole = user.roles[0];
    if (typeof firstRole === 'string') {
      return firstRole as UserRole;
    } else if (firstRole && firstRole.name) {
      return firstRole.name as UserRole;
    }
  }
  
  // Check if user has single role property
  if (user.role) {
    return user.role as UserRole;
  }
  
  // Default fallback
  return ROLES.EMPLOYEE;
};

// Get dashboard path for user role - now always returns /dashboard
export const getDashboardPath = (user: any): string => {
  return '/dashboard';
};

// Check if user has required role
export const hasRole = (user: any, requiredRoles: string[]): boolean => {
  const userRole = getUserRole(user);
  return requiredRoles.includes(userRole);
};

// Check if user is HR or Admin (they have similar permissions)
export const isHRorAdmin = (user: any): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.HR || userRole === ROLES.ADMIN;
};

// Check if user is Finance Manager
export const isFinanceManager = (user: any): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.FINANCE_MANAGER;
};

// Check if user is Employee
export const isEmployee = (user: any): boolean => {
  const userRole = getUserRole(user);
  return userRole === ROLES.EMPLOYEE;
};
