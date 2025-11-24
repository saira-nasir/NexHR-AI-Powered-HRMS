import api from "@/lib/api";

export interface DepartmentAnalysis {
    id: number;
    name: string;
    employee_count: number;
}

export const departmentsService = {
    async getDepartmentAnalysis(): Promise<DepartmentAnalysis[]> {
        try {
            const response = await api.get('/analysis/departments/');
            return response.data;
        } catch (error) {
            console.error('Error fetching department analysis:', error);
            throw error;
        }
    }
};

export default departmentsService;
