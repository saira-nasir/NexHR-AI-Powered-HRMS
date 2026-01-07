// src/services/employeeService.ts
import api from "@/lib/api";

// --- Types ---

export interface CompanyRole {
    id: number;
    name: string;
}

export interface Employee {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string; // 'active', etc.
    branch_name: string;
    department_name: string;
    role: CompanyRole | null;
    joining_date: string;
    // Legacy fields for compatibility if needed elsewhere, but try to avoid
    fname?: string;
    lname?: string;
    company?: string; // name
    branch?: string; // name for compatibility
}

export interface CompanyStats {
    departments_count: number;
    branches_count: number;
    total_employees: number;
    active_employees: number;
}

export interface CompanyStatsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        statistics: CompanyStats;
        employees: Employee[];
    };
}

export interface RoleAssignmentResponse {
    detail: string;
    user_id: number;
    role_id?: number;
    old_role?: CompanyRole | null;
    new_role?: CompanyRole;
}

// --- Service ---

export const employeeService = {
    /**
     * Get company stats and paginated users list.
     */
    async getCompanyStatsAndUsers(page: number = 1, pageSize: number = 50): Promise<CompanyStatsResponse> {
        try {
            const response = await api.get(`/company-stats-users-roles/?page=${page}&page_size=${pageSize}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching company stats and users:", error);
            throw error;
        }
    },

    /**
     * Get all available roles for the company.
     */
    async getCompanyRoles(): Promise<CompanyRole[]> {
        try {
            const response = await api.get('/roles/company-roles/');
            return response.data;
        } catch (error) {
            console.error("Error fetching company roles:", error);
            throw error;
        }
    },

    /**
     * Assign a role to a user (adds role).
     */
    async assignUserRole(userId: number, roleId: number): Promise<RoleAssignmentResponse> {
        try {
            const response = await api.post('/roles/assign/', {
                user_id: userId,
                role_id: roleId,
            });
            return response.data;
        } catch (error) {
            console.error("Error assigning user role:", error);
            throw error;
        }
    },

    /**
     * Update a user's role (replaces existing role).
     */
    async updateUserRole(userId: number, roleId: number): Promise<RoleAssignmentResponse> {
        try {
            const response = await api.put('/roles/update-assignment/', {
                user_id: userId,
                role_id: roleId,
            });
            return response.data;
        } catch (error) {
            console.error("Error updating user role:", error);
            throw error;
        }
    },

    // Kept for backward compatibility if other components import it, 
    // but simplified or aliasing new methods could be better. 
    // For now, I'll keep the import logic but it's not the primary anymore for Employees page.
    async importEmployees(file: File): Promise<{ success: boolean; message?: string; data?: any }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/import-employees/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return {
                success: true,
                message: response.data?.detail || 'Employees imported successfully',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error importing employees:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Failed to import employees',
                data: error.response?.data
            };
        }
    },
};

export default employeeService;