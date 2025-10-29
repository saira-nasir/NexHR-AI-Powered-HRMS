// src/services/employeeService.ts
import api from "@/lib/api";

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

export const employeeService = {
    async getEmployees(): Promise<Employee[]> {
        try {
            console.log('🔄 Fetching employees using multiple API endpoints...');
            
            // Strategy: Try multiple endpoints and combine results
            const allEmployees = new Map<number, Employee>(); // Use Map to avoid duplicates by ID
            
            // 1. First try /api/auth/users/ to get ALL users (no company filtering)
            try {
                console.log('📡 Fetching from /auth/users/ (all users)...');
                const allUsersResponse = await api.get('/auth/users/');
                console.log('✅ Success with /auth/users/:', allUsersResponse.status);
                
                const allUsers = Array.isArray(allUsersResponse.data) ? allUsersResponse.data : allUsersResponse.data?.results || [];
                console.log(`📊 Found ${allUsers.length} users from /auth/users/`);
                
                // Add all users to our collection
                allUsers.forEach((user: any) => {
                    const normalized = normalizeEmployee(user);
                    allEmployees.set(normalized.id, normalized);
                });
                
                console.log('👥 Users from /auth/users/ added to collection');
            } catch (error) {
                console.warn('❌ Failed to fetch from /auth/users/:', error);
            }
            
            // 2. Try /api/company-users/ to get company-specific users
            try {
                console.log('📡 Fetching from /company-users/ (company users)...');
                const companyUsersResponse = await api.get('/company-users/');
                console.log('✅ Success with /company-users/:', companyUsersResponse.status);
                
                const companyUsers = Array.isArray(companyUsersResponse.data) ? companyUsersResponse.data : companyUsersResponse.data?.results || [];
                console.log(`📊 Found ${companyUsers.length} users from /company-users/`);
                
                // Add company users to our collection (will overwrite duplicates)
                companyUsers.forEach((user: any) => {
                    const normalized = normalizeEmployee(user);
                    allEmployees.set(normalized.id, normalized);
                });
                
                console.log('👥 Company users added to collection');
            } catch (error) {
                console.warn('❌ Failed to fetch from /company-users/:', error);
            }
            
            // 3. Try payroll-related endpoints for additional employee data
            try {
                console.log('📡 Fetching from /payroll/attendance/ (attendance data)...');
                const attendanceResponse = await api.get('/payroll/attendance/');
                console.log('✅ Success with /payroll/attendance/:', attendanceResponse.status);
                
                const attendanceData = Array.isArray(attendanceResponse.data) ? attendanceResponse.data : attendanceResponse.data?.results || [];
                console.log(`📊 Found ${attendanceData.length} attendance records`);
                
                // Extract unique employee IDs from attendance data
                const attendanceEmployeeIds = new Set(attendanceData.map((record: any) => record.employee || record.employee_id).filter(Boolean));
                console.log('👥 Unique employee IDs from attendance:', Array.from(attendanceEmployeeIds));
                
                // Try to fetch missing employees individually
                for (const empId of attendanceEmployeeIds) {
                    const employeeId = Number(empId);
                    if (!isNaN(employeeId) && !allEmployees.has(employeeId)) {
                        try {
                            const individualEmployee = await this.getEmployee(employeeId);
                            if (individualEmployee) {
                                allEmployees.set(employeeId, individualEmployee);
                                console.log(`✅ Fetched missing employee ${employeeId} from attendance data`);
                            }
                        } catch (error) {
                            console.log(`❌ Could not fetch employee ${employeeId}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.warn('❌ Failed to fetch from /payroll/attendance/:', error);
            }
            
            // Convert Map to Array and sort by ID
            const finalEmployees = Array.from(allEmployees.values()).sort((a, b) => a.id - b.id);
            console.log(`🎯 Final result: ${finalEmployees.length} unique employees`);
            
            // Debug: Log all employee IDs to see the range
            const employeeIds = finalEmployees.map(emp => emp.id);
            console.log('📋 All employee IDs found:', employeeIds);
            console.log('📊 Employee ID range:', { min: Math.min(...employeeIds), max: Math.max(...employeeIds) });
            
            return finalEmployees;
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    },

    async getEmployee(id: number): Promise<Employee | null> {
        // Try multiple endpoints to find the employee
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
                console.log(`✅ Success with ${endpoint} for ID ${id}:`, response.status);

            const data = response.data;
                
                // Handle different response formats
            if (data && (data.id === id || data.pk === id)) {
                    console.log(`✅ Found employee ${id} in ${endpoint}`);
                return normalizeEmployee(data);
                } else if (data && Array.isArray(data.results) && data.results.length > 0) {
                    // Handle paginated results
                    const found = data.results.find((d: any) => d.id === id || d.pk === id);
                    if (found) {
                        console.log(`✅ Found employee ${id} in paginated results from ${endpoint}`);
                        return normalizeEmployee(found);
                    }
                } else if (Array.isArray(data) && data.length > 0) {
                    // Handle array responses
                    const found = data.find((d: any) => d.id === id || d.pk === id || d.employee === id || d.employee_id === id);
                    if (found) {
                        console.log(`✅ Found employee ${id} in array results from ${endpoint}`);
                        return normalizeEmployee(found);
                    }
                }
            } catch (error: any) {
                const status = error?.response?.status;
                console.log(`❌ Employee ${id} not found in ${endpoint}: status=${status}`);
            }
        }

        console.error(`❌ Employee ${id} not found in any endpoint`);
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
    },

}; 

// Development helper: probe all candidate endpoints and return per-endpoint diagnostics
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
                sampleIds: Array.isArray(data) ? data.slice(0, 3).map((item: any) => item.id) : (data?.results?.slice(0, 3).map((item: any) => item.id) || [])
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
