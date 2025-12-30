// src/services/rolePermissionService.mock.ts
// Mock service for testing Roles & Permissions UI without backend
// Uses localStorage to persist data

import type { Permission, Role, CreateRolePayload, UpdateRolePayload, UpdateRolePermissionsPayload } from './rolePermissionService';

// Re-export types for convenience
export type { Permission, Role, CreateRolePayload, UpdateRolePayload, UpdateRolePermissionsPayload };

const STORAGE_KEY_ROLES = 'mock_roles';
const STORAGE_KEY_PERMISSIONS = 'mock_permissions';

// Predefined mock permissions (similar to what backend would provide)
const DEFAULT_PERMISSIONS: Permission[] = [
  // Meeting permissions
  { id: 1, name: 'Schedule Meeting', code: 'schedule_meeting', category: 'Meeting', description: 'Create and schedule meetings' },
  { id: 2, name: 'View All Meetings', code: 'view_all_meetings', category: 'Meeting', description: 'View all meetings in the system' },
  { id: 3, name: 'Cancel Meeting', code: 'cancel_meeting', category: 'Meeting', description: 'Cancel scheduled meetings' },
  { id: 4, name: 'Edit Meeting', code: 'edit_meeting', category: 'Meeting', description: 'Edit meeting details' },
  
  // HR permissions
  { id: 5, name: 'View Employees', code: 'view_employees', category: 'HR', description: 'View employee list' },
  { id: 6, name: 'Add Employee', code: 'add_employee', category: 'HR', description: 'Add new employees' },
  { id: 7, name: 'Edit Employee', code: 'edit_employee', category: 'HR', description: 'Edit employee information' },
  { id: 8, name: 'Delete Employee', code: 'delete_employee', category: 'HR', description: 'Remove employees' },
  { id: 9, name: 'Manage Attendance', code: 'manage_attendance', category: 'HR', description: 'Manage employee attendance' },
  { id: 10, name: 'View Attendance', code: 'view_attendance', category: 'HR', description: 'View attendance records' },
  
  // Finance permissions
  { id: 11, name: 'View Payroll', code: 'view_payroll', category: 'Finance', description: 'View payroll information' },
  { id: 12, name: 'Create Payroll', code: 'create_payroll', category: 'Finance', description: 'Create payroll entries' },
  { id: 13, name: 'Manage Expenses', code: 'manage_expenses', category: 'Finance', description: 'Manage expense records' },
  { id: 14, name: 'Approve Expenses', code: 'approve_expenses', category: 'Finance', description: 'Approve expense requests' },
  { id: 15, name: 'View Reports', code: 'view_reports', category: 'Finance', description: 'View financial reports' },
  { id: 16, name: 'Manage Loans', code: 'manage_loans', category: 'Finance', description: 'Manage employee loans' },
  
  // Admin permissions
  { id: 17, name: 'Manage Roles', code: 'manage_roles', category: 'Admin', description: 'Create and manage roles' },
  { id: 18, name: 'Assign Roles', code: 'assign_roles', category: 'Admin', description: 'Assign roles to users' },
  { id: 19, name: 'System Settings', code: 'system_settings', category: 'Admin', description: 'Access system settings' },
  { id: 20, name: 'User Management', code: 'user_management', category: 'Admin', description: 'Manage user accounts' },
];

// Initialize mock data in localStorage
const initializeMockData = () => {
  // Initialize permissions if not exist
  if (!localStorage.getItem(STORAGE_KEY_PERMISSIONS)) {
    localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(DEFAULT_PERMISSIONS));
  }
  
  // Initialize roles if not exist (optional - start empty)
  if (!localStorage.getItem(STORAGE_KEY_ROLES)) {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify([]));
  }
};

// Get roles from localStorage
const getStoredRoles = (): Role[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROLES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save roles to localStorage
const saveRoles = (roles: Role[]) => {
  localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
};

// Get permissions from localStorage
const getStoredPermissions = (): Permission[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    return stored ? JSON.parse(stored) : DEFAULT_PERMISSIONS;
  } catch {
    return DEFAULT_PERMISSIONS;
  }
};

// Initialize on import
initializeMockData();

/**
 * Mock Role Permission Service
 * Simulates backend API calls using localStorage
 */
const rolePermissionService = {
  /* ---------------- Permissions ---------------- */
  
  listPermissions: async (): Promise<Permission[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredPermissions();
  },

  getPermission: async (id: number): Promise<Permission> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const permissions = getStoredPermissions();
    const permission = permissions.find(p => p.id === id);
    if (!permission) {
      throw new Error(`Permission with id ${id} not found`);
    }
    return permission;
  },

  /* ---------------- Roles ---------------- */

  listRoles: async (): Promise<Role[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const roles = getStoredRoles();
    const permissions = getStoredPermissions();
    
    // Enrich roles with full permission objects
    return roles.map(role => ({
      ...role,
      permissions: role.permission_ids 
        ? role.permission_ids.map(id => permissions.find(p => p.id === id)!).filter(Boolean)
        : []
    }));
  },

  getRole: async (id: number): Promise<Role> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const roles = getStoredRoles();
    const permissions = getStoredPermissions();
    const role = roles.find(r => r.id === id);
    
    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }
    
    return {
      ...role,
      permissions: role.permission_ids 
        ? role.permission_ids.map(id => permissions.find(p => p.id === id)!).filter(Boolean)
        : []
    };
  },

  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const roles = getStoredRoles();
    const newId = roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1;
    
    const newRole: Role = {
      id: newId,
      name: payload.name,
      description: payload.description,
      permission_ids: [],
      permissions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    roles.push(newRole);
    saveRoles(roles);
    return newRole;
  },

  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const roles = getStoredRoles();
    const index = roles.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error(`Role with id ${id} not found`);
    }
    
    roles[index] = {
      ...roles[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    
    saveRoles(roles);
    return roles[index];
  },

  deleteRole: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const roles = getStoredRoles();
    const filtered = roles.filter(r => r.id !== id);
    saveRoles(filtered);
  },

  updateRolePermissions: async (
    roleId: number,
    payload: UpdateRolePermissionsPayload
  ): Promise<Role> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const roles = getStoredRoles();
    const permissions = getStoredPermissions();
    const index = roles.findIndex(r => r.id === roleId);
    
    if (index === -1) {
      throw new Error(`Role with id ${roleId} not found`);
    }
    
    roles[index] = {
      ...roles[index],
      permission_ids: payload.permission_ids,
      permissions: payload.permission_ids.map(id => permissions.find(p => p.id === id)!).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    
    saveRoles(roles);
    return roles[index];
  },

  getRolePermissions: async (roleId: number): Promise<Permission[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const roles = getStoredRoles();
    const permissions = getStoredPermissions();
    const role = roles.find(r => r.id === roleId);
    
    if (!role) {
      throw new Error(`Role with id ${roleId} not found`);
    }
    
    if (!role.permission_ids || role.permission_ids.length === 0) {
      return [];
    }
    
    return role.permission_ids
      .map(id => permissions.find(p => p.id === id))
      .filter(Boolean) as Permission[];
  },
};

export default rolePermissionService;

