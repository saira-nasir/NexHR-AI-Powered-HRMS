import api from '@/lib/api';

const API_ENDPOINT = '/attendance/branch-stats/';

export interface AttendanceStats {
    branch_name: string;
    branch_id: number;
    date: string;
    total_employees: number;
    present_today: number;
    absent_today: number;
    attendance_percentage: number;
}

export interface DailyHours {
    date: string;
    day: string;
    hours_worked: number;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
}

export interface WorkingHoursStats {
    employee_name: string;
    employee_id: number;
    average_working_hours: number;
    current_week: {
        start_date: string;
        end_date: string;
        total_hours: number;
        average_hours_per_day: number;
        days_worked: number;
        daily_hours: DailyHours[];
    };
    total_days_worked_all_time: number;
    query_date: string;
}

export const getAttendanceStats = async (): Promise<AttendanceStats> => {
    try {
        const response = await api.get(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        throw error;
    }
};

export const getWorkingHours = async (): Promise<WorkingHoursStats> => {
    try {
        const response = await api.get('/attendance/my-working-hours/');
        return response.data;
    } catch (error) {
        console.error('Error fetching working hours:', error);
        throw error;
    }
};
