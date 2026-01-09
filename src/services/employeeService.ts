// src/services/employeeService.ts
import api from "@/lib/api";

// --- Types for NEW Company Stats API ---
export interface CompanyRole {
    id: number;
    name: string;
}

export interface CompanyStatsEmployee {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string; // 'active', etc.
    branch_name: string;
    department_name: string;
    role: CompanyRole | null;
    joining_date: string;
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
        employees: CompanyStatsEmployee[];
    };
}

export interface RoleAssignmentResponse {
    detail: string;
    user_id: number;
    role_id?: number;
    old_role?: CompanyRole | null;
    new_role?: CompanyRole;
}

// --- Types for OLD Employee API ---
export interface Employee {
    id: number;
    fname?: string;
    lname?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    mobile?: string;
    company?: string;
    department?: string;
    branch?: string;
    name?: string;
    username?: string;
    is_active?: boolean;
    is_verified?: boolean;
}

const normalizeEmployee = (raw: any): Employee => {
    if (!raw) return raw as Employee;

    const id = raw.id ?? raw.pk ?? raw.user_id ?? raw.uid ?? raw.employee_id;
    const email = raw.email || raw.user_email || raw.username || "";
    const phone = raw.phone || raw.phone_number || raw.mobile || "";

    const fname = raw.fname || raw.first_name || raw.firstName || "";
    const lname = raw.lname || raw.last_name || raw.lastName || "";
    const name = raw.name || `${fname} ${lname}`.trim() || raw.username || "";

    const company =
        raw.company && typeof raw.company === "object"
            ? raw.company.name
            : raw.company || raw.company_name;

    const department = raw.department || raw.dept || raw.department_name;
    const branch = raw.branch || raw.branch_name;

    return {
        id: Number(id),
        fname: fname || 'Unknown',
        lname: lname || 'User',
        first_name: raw.first_name,
        last_name: raw.last_name,
        firstName: raw.firstName,
        lastName: raw.lastName,
        email,
        phone,
        phone_number: raw.phone_number,
        mobile: raw.mobile,
        company: typeof company === 'string' ? company : company?.name || undefined,
        department: department,
        branch: branch,
        name: name,
        username: raw.username,
        is_active: raw.is_active,
        is_verified: raw.is_verified,
    } as Employee;
};

// --- Service ---
export const employeeService = {
    // ========================================
    // OLD API METHODS (Original Names)
    // ========================================

    /**
     * Get all employees using the original multi-endpoint strategy.
     * Used by RegisterFace and other legacy components.
     */
    async getEmployees(): Promise<Employee[]> {
        try {
            console.log('🔄 Fetching company employees...');

            const allEmployees = new Map<number, Employee>();

            // 1. Try /api/company-users/
            try {
                console.log('📡 Fetching from /company-users/...');
                const companyUsersResponse = await api.get('/company-users/');
                console.log('✅ Success with /company-users/:', companyUsersResponse.status);

                const companyUsers = Array.isArray(companyUsersResponse.data)
                    ? companyUsersResponse.data
                    : companyUsersResponse.data?.results || [];
                console.log(`📊 Found ${companyUsers.length} users from /company-users/`);

                companyUsers.forEach((user: any) => {
                    const normalized = normalizeEmployee(user);
                    if (!isNaN(normalized.id)) {
                        allEmployees.set(normalized.id, normalized);
                    }
                });
            } catch (error) {
                console.warn('❌ Failed to fetch from /company-users/:', error);
            }

            // 2. Fallback to /auth/users/ if needed
            if (allEmployees.size === 0) {
                try {
                    console.log('📡 Fetching from /auth/users/ (fallback)...');
                    const authUsersResponse = await api.get('/auth/users/');
                    console.log('✅ Success with /auth/users/:', authUsersResponse.status);

                    const authUsers = Array.isArray(authUsersResponse.data)
                        ? authUsersResponse.data
                        : authUsersResponse.data?.results || [];
                    console.log(`📊 Found ${authUsers.length} users from /auth/users/`);

                    authUsers.forEach((user: any) => {
                        const normalized = normalizeEmployee(user);
                        if (!isNaN(normalized.id) && !allEmployees.has(normalized.id)) {
                            allEmployees.set(normalized.id, normalized);
                        }
                    });
                } catch (error) {
                    console.warn('❌ Failed to fetch from /auth/users/:', error);
                }
            }

            const finalEmployees = Array.from(allEmployees.values()).sort((a, b) => a.id - b.id);
            console.log(`🎯 Final result: ${finalEmployees.length} unique employees`);

            return finalEmployees;
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    },

    /**
     * Get a single employee by ID using the original multi-endpoint strategy.
     */
    async getEmployee(id: number): Promise<Employee | null> {
        const endpoints = [
            `/company-users/${id}/`,
            `/auth/users/${id}/`,
            `/payroll/attendance/?employee=${id}`,
            `/payroll/bank-info/?employee=${id}`,
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Trying to fetch employee ${id} from ${endpoint}`);
                const response = await api.get(endpoint);

                const data = response.data;

                if (data && (data.id === id || data.pk === id)) {
                    return normalizeEmployee(data);
                } else if (data && Array.isArray(data.results) && data.results.length > 0) {
                    const found = data.results.find((d: any) => d.id === id || d.pk === id);
                    if (found) return normalizeEmployee(found);
                } else if (Array.isArray(data) && data.length > 0) {
                    const found = data.find((d: any) => d.id === id || d.pk === id);
                    if (found) return normalizeEmployee(found);
                }
            } catch (error: any) {
                const status = error?.response?.status;
                if (endpoint.includes('/company-users/') && status === 404) {
                    continue;
                }
            }
        }

        console.error(`❌ Employee ${id} not found in any endpoint`);
        return null;
    },

    /**
     * Import employees from a file.
     */
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

    // ========================================
    // NEW API METHODS (For Employees Page)
    // ========================================

    /**
     * Get company stats and paginated users list.
     * NEW API: /company-stats-users-roles/
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
     * Search employees using the new API.
     * NEW API: /company-stats-users-roles/search/
     */
    async searchCompanyUsers(query: string): Promise<CompanyStatsEmployee[]> {
        try {
            const response = await api.get(`/company-stats-users-roles/search/?q=${encodeURIComponent(query)}`);
            return response.data.employees || [];
        } catch (error) {
            console.error("Error searching company users:", error);
            throw error;
        }
    },

    /**
     * Get all available roles for the company.
     * NEW API: /roles/company-roles/
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
     * NEW API: /roles/assign/
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
     * NEW API: /roles/update-assignment/
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

    /**
     * Update employee's branch and/or department assignment.
     * NEW API: /accounts/employees/<user_id>/update-assignment/
     */
    async updateEmployeeAssignment(userId: number, payload: { branch?: number; department?: number }): Promise<any> {
        try {
            const response = await api.patch(`/accounts/employees/${userId}/update-assignment/`, payload);
            return response.data;
        } catch (error) {
            console.error("Error updating employee assignment:", error);
            throw error;
        }
    },
};

// Development helper: probe all candidate endpoints
export const probeEmployeeEndpoints = async () => {
    const endpoints = [
        '/auth/users/',
        '/company-users/',
        '/payroll/attendance/',
        '/payroll/bank-info/',
    ];
    const results: any[] = [];

    for (const endpoint of endpoints) {
        try {
            const res = await api.get(endpoint);
            const data = res.data;
            const count = Array.isArray(data) ? data.length : (data?.results?.length || 0);
            results.push({
                endpoint,
                ok: true,
                status: res.status,
                count,
                hasData: count > 0,
                sampleIds: Array.isArray(data)
                    ? data.slice(0, 3).map((item: any) => item.id)
                    : (data?.results?.slice(0, 3).map((item: any) => item.id) || [])
            });
        } catch (err: any) {
            results.push({
                endpoint,
                ok: false,
                status: err?.response?.status,
                error: err?.response?.data || err.message
            });
        }
    }

    return results;
};

export default employeeService;