// src/services/rolePermissionService.ts
import api from '@/lib/api';

/**
 * Permission Interface
 * Permissions are predefined and grouped by categories
 */
id: number;
name: string;
codename: string; // Unique identifier (e.g., 'schedule_meeting', 'view_all_meetings')
category: string; // Category name (e.g., 'Meeting', 'Finance', 'HR')
description ?: string;
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

const BASE = '/roles';

/**
 * Role Permission Service
 * Handles all API calls related to roles and permissions management
 */
const rolePermissionService = {
  /* ---------------- Permissions ---------------- */

  /**
   * List all available permissions (predefined)
   * Permissions are fetched from the backend and grouped by categories
   */
  listPermissions: async (): Promise<Permission[]> => {
    const { data } = await api.get<Permission[]>(`${BASE}/permissions/`);
    return data;
  },

  /**
   * Get a specific permission by ID
   */
  getPermission: async (id: number): Promise<Permission> => {
    const { data } = await api.get<Permission>(`${BASE}/permissions/${id}/`);
    return data;
  },

  /* ---------------- Roles ---------------- */

  /**
   * List all roles
   */
  listRoles: async (): Promise<Role[]> => {
    const { data } = await api.get<Role[]>(`${BASE}/`);
    return data;
  },

  /**
   * Get a specific role by ID (with permissions)
   */
  getRole: async (id: number): Promise<Role> => {
    const { data } = await api.get<Role>(`${BASE}/${id}/`);
    return data;
  },

  /**
   * Create a new role
   */
  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    const { data } = await api.post<Role>(`${BASE}/`, payload);
    return data;
  },

  /**
   * Update a role (name, description)
   */
  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const { data } = await api.patch<Role>(`${BASE}/${id}/`, payload);
    return data;
  },

  /**
   * Delete a role
   */
  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}/`);
  },

  /**
   * Update permissions for a role
   * This assigns/removes permissions from a role
   */
  updateRolePermissions: async (
    roleId: number,
    payload: UpdateRolePermissionsPayload
  ): Promise<Role> => {
    const { data } = await api.patch<Role>(
      `${BASE}/${roleId}/permissions/`,
      payload
    );
    return data;
  },

  /**
   * Get permissions for a specific role
   */
  getRolePermissions: async (roleId: number): Promise<Permission[]> => {
    const { data } = await api.get<Permission[]>(`${BASE}/${roleId}/permissions/`);
    return data;
  },
};

export default rolePermissionService;

