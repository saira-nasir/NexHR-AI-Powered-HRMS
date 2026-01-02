import api from "@/lib/api";

// --- Types ---

export interface Project {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'on-hold';
    created_at?: string;
    updated_at?: string;
    total_allocated_users?: number;
    tasks?: Task[];
    allocations?: Allocation[];
    assignments?: any[]; // Frontend backward compatibility if needed, but we should switch to allocations
}

export interface Task {
    id: number;
    project: number;
    project_name?: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    created_at?: string;
    updated_at?: string;
}

export interface Allocation {
    id: number;
    project: number;
    project_name: string;
    user: number;
    user_name: string;
    task: number;
    task_name: string;
    task_status?: 'todo' | 'inprogress' | 'done';
    assigned_task?: string | null;
    start_date: string;
    end_date: string;
    status: 'active' | 'released';
    created_at?: string;
    updated_at?: string;
}

// --- API Service ---

export const resourceAllocationService = {
    // === Projects ===
    async getProjects(status?: string): Promise<Project[]> {
        const params = status ? { status } : {};
        const response = await api.get('/projects/', { params });
        return response.data;
    },

    async getProject(id: number | string): Promise<Project> {
        const response = await api.get(`/projects/${id}/`);
        return response.data;
    },

    async createProject(data: Partial<Project>): Promise<Project> {
        const response = await api.post('/projects/', data);
        return response.data;
    },

    async updateProject(id: number | string, data: Partial<Project>): Promise<Project> {
        const response = await api.put(`/projects/${id}/`, data);
        return response.data;
    },

    async deleteProject(id: number | string): Promise<void> {
        await api.delete(`/projects/${id}/`);
    },

    // === Tasks ===
    async getTasks(params?: { project_id?: number; status?: string }): Promise<Task[]> {
        const response = await api.get('/tasks/', { params });
        return response.data;
    },

    async createTask(data: Partial<Task>): Promise<Task> {
        const response = await api.post('/tasks/', data);
        return response.data;
    },

    async updateTask(id: number | string, data: Partial<Task>): Promise<Task> {
        const response = await api.put(`/tasks/${id}/`, data);
        return response.data;
    },

    async deleteTask(id: number | string): Promise<void> {
        await api.delete(`/tasks/${id}/`);
    },

    // === Assignments ===
    async assignUsersToTask(data: {
        task_id: number;
        user_ids: number[];
        start_date: string;
        end_date: string;
    }): Promise<any> {
        const response = await api.post('/tasks/assign/', data);
        return response.data;
    },

    // === Allocations ===
    async getAllocations(params?: { project_id?: number; user_id?: number; status?: string }): Promise<Allocation[]> {
        const response = await api.get('/allocations/', { params });
        return response.data;
    },

    async updateAllocation(id: number | string, data: Partial<Allocation>): Promise<Allocation> {
        const response = await api.put(`/allocations/${id}/`, data);
        return response.data;
    },

    async deleteAllocation(id: number | string): Promise<void> {
        await api.delete(`/allocations/${id}/`);
    }
};
