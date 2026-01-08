// src/services/rolePermissionService.ts
import api from '@/lib/api';

/**
 * Permission Interface
 * Permissions are predefined and grouped by categories
 */
export interface Permission {
  id: number;
  name: string;
  codename: string; // Unique identifier (e.g., 'schedule_meeting', 'view_all_meetings')
  category: string; // Category name (e.g., 'Meeting', 'Finance', 'HR')
  description?: string;
}

/**
 * Role Interface
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[]; // Array of permissions assigned to this role
  permission_ids?: number[]; // Array of permission IDs (alternative format)
  created_at?: string;
  updated_at?: string;
}

/**
 * Create Role Payload
 */
export interface CreateRolePayload {
  name: string;
  description?: string;
}

/**
 * Update Role Payload
 */
export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

/**
 * Update Role Permissions Payload
 */
export interface UpdateRolePermissionsPayload {
  permission_ids: number[];
}

const BASE_ROLES = '/auth/roles';

/**
 * Role Permission Service
 * Handles all API calls related to roles and permissions management
 */
const rolePermissionService = {
  /* ---------------- Permissions ---------------- */

  /**
   * List all available permissions (predefined)
   * Note: If backend doesn't have a specific list endpoint, this might need adjustment.
   * Assuming standard listing or we use hardcoded types if necessary. 
   * For now, attempting to fetch from a presumed endpoint or keeping existing if valid.
   * User didn't specify LIST permissions API. 
   * However, to show the checkbox grid, we need the list of ALL possible tabs.
   * I will try GET /auth/roles/permissions/ based on pattern, or fallback to mock if needed?
   * No, "tables ... wrong ... backend apis are ...".
   * I'll assume GET /auth/roles/permissions/ exists alongside the others, or I'll leave it as /roles/permissions and user can correct.
   * Actually, better to use `/auth/permissions/` if `auth` is the prefix. 
   * Let's stick to updating the explicitly mentioned ones first.
   */
  listPermissions: async (): Promise<Permission[]> => {
    // Attempting to match the 'auth' prefix pattern.
    const { data } = await api.get<Permission[]>('/auth/roles/permissions/');
    return data;
  },

  /**
   * Get a specific permission by ID
   */
  getPermission: async (id: number): Promise<Permission> => {
    const { data } = await api.get<Permission>(`/auth/roles/permissions/${id}/`);
    return data;
  },

  /* ---------------- Roles ---------------- */

  /**
   * List all roles
   */
  listRoles: async (): Promise<Role[]> => {
    const { data } = await api.get<Role[]>(`${BASE_ROLES}/`);
    return data;
  },

  /**
   * Get a specific role by ID (with permissions)
   */
  getRole: async (id: number): Promise<Role> => {
    const { data } = await api.get<Role>(`${BASE_ROLES}/${id}/`);
    return data;
  },

  /**
   * Create a new role
   * Endpoint: POST http://localhost:8000/api/auth/roles/
   */
  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    const { data } = await api.post<Role>(`${BASE_ROLES}/`, payload);
    return data;
  },

  /**
   * Update a role (name, description)
   */
  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const { data } = await api.patch<Role>(`${BASE_ROLES}/${id}/`, payload);
    return data;
  },

  /**
   * Delete a role
   */
  deleteRole: async (id: number): Promise<void> => {
    const { data } = await api.delete(`${BASE_ROLES}/${id}/`);
    return data;
  },

  /**
   * Update permissions for a role
   * Endpoint: POST http://localhost:8000/api/auth/roles/{id}/sync_permissions/
   * Body: {"permissions": ["manage_payroll", "view_dashboard"]}
   */
  updateRolePermissions: async (
    roleId: number,
    payload: { permissions: string[] }
  ): Promise<Role> => {
    const { data } = await api.post<Role>(
      `${BASE_ROLES}/${roleId}/sync_permissions/`,
      payload
    );
    return data;
  },

  /**
   * Get permissions for a specific role
   */
  getRolePermissions: async (roleId: number): Promise<Permission[]> => {
    const { data } = await api.get<Permission[]>(`${BASE_ROLES}/${roleId}/permissions/`);
    return data;
  },
};

export default rolePermissionService;

