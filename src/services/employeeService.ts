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

export const employeeService = {
    async getEmployees(): Promise<Employee[]> {
        try {
            // Try multiple endpoints to get employee data
            const endpoints = ['/company-users/', '/users/', '/employees/'];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await api.get(endpoint);
                    console.log(`Success with ${endpoint}:`, response.data);
                    return response.data;
                } catch (endpointError) {
                    console.warn(`Failed to fetch from ${endpoint}:`, endpointError);
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
        const endpoints = [`/company-users/${id}/`, `/users/${id}/`, `/employees/${id}/`];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying employee detail endpoint: ${endpoint} for ID: ${id}`);
                const response = await api.get(endpoint);
                console.log(`Success with ${endpoint} for ID ${id}:`, response.data);
                
                // Ensure the response has the correct ID
                if (response.data && response.data.id === id) {
                    return response.data as Employee;
                } else {
                    console.warn(`Employee ID mismatch: expected ${id}, got ${response.data?.id}`);
                }
            } catch (error) {
                console.warn(`Employee ${id} not found in ${endpoint}:`, error);
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