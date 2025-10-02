import api from '@/lib/api';

export interface Employee {
    id: number;
    fname?: string;
    lname?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    phone_number?: string;
    mobile?: string;
    company?: string;
    department?: string;
    branch?: string;
    // Additional fields that might come from different endpoints
    name?: string;
    username?: string;
    is_active?: boolean;
    is_verified?: boolean;
}

// Normalize various backend user shapes into the Employee interface
const normalizeEmployee = (raw: any): Employee => {
    if (!raw) return raw as Employee;

    const id = raw.id ?? raw.pk ?? raw.user_id ?? raw.uid;
    const email = raw.email || raw.user_email || raw.username || '';
    const phone = raw.phone || raw.phone_number || raw.mobile || '';

    // Name resolution: prefer 'name', then fname/lname combos, then username
    const fname = raw.fname || raw.first_name || raw.firstName || '';
    const lname = raw.lname || raw.last_name || raw.lastName || '';
    const name = raw.name || `${fname} ${lname}`.trim() || raw.username;

    const company = raw.company || (raw.company && typeof raw.company === 'object' ? raw.company.name : raw.company) || raw.company_name;
    const department = raw.department || raw.dept || raw.department_name;
    const branch = raw.branch || raw.branch_name;

    return {
        id: Number(id),
        fname: fname || undefined,
        lname: lname || undefined,
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

export const employeeService = {
    async getEmployees(): Promise<Employee[]> {
        try {
            // Try multiple endpoints to get employee data. Include common variants
            // such as accounts_user, accounts/users, company-users, users, employees
            const endpoints = [
                '/company-users/',
                '/users/',
                '/employees/',
                '/accounts_user/',
                '/accounts/users/',
                '/accounts/users',
                '/accounts/user/',
                '/accounts/',
                // api auth namespace variations
                '/auth/users/',
                '/auth/users',
                '/auth/',
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await api.get(endpoint);
                    console.log(`Success with ${endpoint}:`, response.status, response.data);

                    // Handle paginated DRF responses (having `results`) or direct arrays
                    let data = response.data;
                    if (data && typeof data === 'object' && Array.isArray(data.results)) {
                        data = data.results;
                    }

                    // Normalize to Employee[] shape
                    const normalized: Employee[] = (Array.isArray(data) ? data : []).map(normalizeEmployee);
                    console.log(`Normalized ${normalized.length} employees from ${endpoint}`);
                    return normalized;
                } catch (endpointError: any) {
                    // Surface HTTP status and response body when available for debugging
                    const status = endpointError?.response?.status;
                    const respData = endpointError?.response?.data;
                    console.warn(`Failed to fetch from ${endpoint}: status=${status}`, respData || endpointError.message || endpointError);
                    continue;
                }
            }

            // If all endpoints fail, throw the last error
            throw new Error('All employee endpoints failed');
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    },

    async getEmployee(id: number): Promise<Employee | null> {
        const endpoints = [
            `/company-users/${id}/`,
            `/users/${id}/`,
            `/employees/${id}/`,
            `/accounts_user/${id}/`,
            `/accounts/users/${id}/`,
            `/accounts/${id}/`,
            // auth namespace detail endpoints
            `/auth/users/${id}/`,
            `/auth/users/${id}`,
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying employee detail endpoint: ${endpoint} for ID: ${id}`);
                const response = await api.get(endpoint);
                console.log(`Success with ${endpoint} for ID ${id}:`, response.status, response.data);

                const data = response.data;
                if (data && (data.id === id || data.pk === id)) {
                    return normalizeEmployee(data);
                } else {
                    // If backend returned a container with results, try to find match
                    if (data && typeof data === 'object' && Array.isArray(data.results)) {
                        const found = data.results.find((d: any) => d.id === id || d.pk === id);
                        if (found) return normalizeEmployee(found);
                    }
                    console.warn(`Employee ID mismatch: expected ${id}, got ${response.data?.id || response.data?.pk}`);
                }
            } catch (error: any) {
                const status = error?.response?.status;
                const respData = error?.response?.data;
                console.warn(`Employee ${id} not found in ${endpoint}: status=${status}`, respData || error.message || error);
                continue;
            }
        }

        console.error(`Employee ${id} not found in any detail endpoint`);
        return null;
    },

    async importEmployees(file: File): Promise<{ success: boolean; message?: string }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/import-employees/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log("Import response:", response);
            return {
                success: true,
                message: response.data?.detail || 'Employees imported successfully'
            };
        } catch (error: any) {
            console.error('Error importing employees:', error);
            return {
                success: false,
                message: error.response?.data?.detail || 'Failed to import employees'
            };
        }
    }
}; 

// Development helper: probe all candidate endpoints and return per-endpoint diagnostics
export const probeEmployeeEndpoints = async () => {
    const endpoints = [
        '/company-users/',
        '/users/',
        '/employees/',
        '/accounts_user/',
        '/accounts/users/',
        '/accounts/users',
        '/accounts/user/',
        '/accounts/',
        '/auth/users/',
        '/auth/users',
        '/auth/',
    ];

    const results: Array<any> = [];
    for (const endpoint of endpoints) {
        try {
            const res = await api.get(endpoint);
            results.push({ endpoint, ok: true, status: res.status, data: res.data });
        } catch (err: any) {
            results.push({ endpoint, ok: false, status: err?.response?.status, error: err?.response?.data || err.message });
        }
    }
    return results;
};

// Attach to window in development for quick manual probing from browser console
try {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
        // @ts-ignore
        window.__employeeProbe = probeEmployeeEndpoints;
    }
} catch (e) {
    // ignore in non-browser environments
}