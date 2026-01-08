import api from "@/lib/api";

export interface EmployeeTask {
    allocation_id: number;
    task_id: number;
    task_name: string;
    task_status: 'todo' | 'inprogress' | 'done';
    allocation_start: string;
    allocation_end: string;
    allocation_status: string;
}

export interface EmployeeProject {
    project_id: number;
    project_name: string;
    start_date: string;
    end_date: string;
    status: string;
    tasks: EmployeeTask[];
}

export const employeeTaskService = {
    /**
     * Get all tasks assigned to the logged-in member
     */
    async getMyTasks(): Promise<EmployeeProject[]> {
        const response = await api.get('/members/tasks/');
        return response.data;
    },

    /**
     * Update task status for a specific allocation
     */
    async updateTaskStatus(allocationId: number, status: 'todo' | 'inprogress' | 'done'): Promise<any> {
        const response = await api.patch(`/members/tasks/${allocationId}/status/`, {
            task_status: status,
        });
        return response.data;
    }
};
