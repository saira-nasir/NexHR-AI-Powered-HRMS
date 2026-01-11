// src/services/branchDepartmentService.ts
import api from "@/lib/api";

// --- Types ---

export interface Branch {
    id: number;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    company?: number;
    company_name?: string;
}

export interface Department {
    id: number;
    name: string;
    branch: number;
    branch_name?: string;
}

export interface CreateBranchPayload {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
}

export interface UpdateBranchPayload {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
}

export interface CreateDepartmentPayload {
    name: string;
    branch?: number; // Optional - uses user's branch if omitted
}

export interface UpdateDepartmentPayload {
    name?: string;
    branch?: number;
}

// --- Service ---

export const branchDepartmentService = {
    // ========================================
    // Branch Methods
    // ========================================

    /**
     * Get all branches for the current company.
     */
    async getBranches(): Promise<Branch[]> {
        try {
            const response = await api.get('/accounts/branches/');
            return response.data;
        } catch (error) {
            console.error("Error fetching branches:", error);
            throw error;
        }
    },

    /**
     * Get a single branch by ID.
     */
    async getBranch(id: number): Promise<Branch> {
        try {
            const response = await api.get(`/accounts/branches/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching branch ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new branch.
     */
    async createBranch(payload: CreateBranchPayload): Promise<Branch> {
        try {
            const response = await api.post('/accounts/branches/', payload);
            return response.data;
        } catch (error) {
            console.error("Error creating branch:", error);
            throw error;
        }
    },

    /**
     * Update an existing branch.
     */
    async updateBranch(id: number, payload: UpdateBranchPayload): Promise<Branch> {
        try {
            const response = await api.patch(`/accounts/branches/${id}/`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating branch ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a branch.
     */
    async deleteBranch(id: number): Promise<void> {
        try {
            await api.delete(`/accounts/branches/${id}/`);
        } catch (error) {
            console.error(`Error deleting branch ${id}:`, error);
            throw error;
        }
    },

    // ========================================
    // Department Methods
    // ========================================

    /**
     * Get all departments for the current company.
     */
    async getDepartments(): Promise<Department[]> {
        try {
            const response = await api.get('/accounts/departments/');
            return response.data;
        } catch (error) {
            console.error("Error fetching departments:", error);
            throw error;
        }
    },

    /**
     * Get a single department by ID.
     */
    async getDepartment(id: number): Promise<Department> {
        try {
            const response = await api.get(`/accounts/departments/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching department ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new department.
     */
    async createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
        try {
            const response = await api.post('/accounts/departments/', payload);
            return response.data;
        } catch (error) {
            console.error("Error creating department:", error);
            throw error;
        }
    },

    /**
     * Update an existing department.
     */
    async updateDepartment(id: number, payload: UpdateDepartmentPayload): Promise<Department> {
        try {
            const response = await api.patch(`/accounts/departments/${id}/`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating department ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a department.
     */
    async deleteDepartment(id: number): Promise<void> {
        try {
            await api.delete(`/accounts/departments/${id}/`);
        } catch (error) {
            console.error(`Error deleting department ${id}:`, error);
            throw error;
        }
    },
};

export default branchDepartmentService;
