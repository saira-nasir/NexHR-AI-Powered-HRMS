import api from "@/lib/api";

// Base path for payroll APIs
const BASE = "/payroll";

export interface SalaryStructure {
  id: number;
  employee: number;
  basic_pay: string;
  allowances: string;
  deductions: string;
  tax: string;
  effective_from: string; // ISO date
  effective_to?: string | null; // ISO date or null
}

export interface Payroll {
  id: number;
  employee: number;
  salary_structure: number | null;
  period_start: string; // ISO date
  period_end: string; // ISO date
  gross_salary: string;
  tax_amount?: string; // added by backend
  statutory_deductions?: string; // added by backend
  total_deductions: string;
  net_salary: string;
  payment_status: "PENDING" | "PAID" | "FAILED";
  paid_on?: string | null; // ISO date
  // newly exposed fields from backend
  approval_status?: "AWAITING" | "APPROVED" | "REJECTED";
  paid_by?: number | null;
  // Employee details that might be included in the response
  employee_details?: {
    id: number;
    fname?: string;
    lname?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    company?: string;
    department?: string;
  };
}

export interface Payslip {
  id: number;
  payroll: number;
  payslip_pdf_url?: string | null;
  issued_on: string; // ISO date
}

export interface EmployeeAttendance {
  id: number;
  employee: number;
  date: string; // ISO date
  check_in?: string | null; // HH:mm:ss
  check_out?: string | null; // HH:mm:ss
  work_hours: string; // decimal as string
  photo?: string | null;
  geo_location?: string | null;
}

export interface LeaveRecord {
  id: number;
  employee: number;
  leave_type: string;
  from_date: string; // ISO date
  to_date: string; // ISO date
  approved_by?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Notification {
  id: number;
  employee: number;
  message: string;
  created_at: string; // ISO datetime
  is_read: boolean;
}

export interface TaxBracket {
  id: number;
  min_income: string;
  max_income: string;
  rate: string;
  created_at: string;
  updated_at: string;
}

export interface StatutoryDeduction {
  id: number;
  name: string;
  rate: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripeCheckoutResponse {
  id: string;
  url: string;
}

const payrollService = {
  // Salary Structures
  listSalaryStructures: async () => {
    const { data } = await api.get<SalaryStructure[]>(`${BASE}/salary-structures/`);
    return data;
  },
  getSalaryStructure: async (id: number) => {
    const { data } = await api.get<SalaryStructure>(`${BASE}/salary-structures/${id}/`);
    return data;
  },
  createSalaryStructure: async (payload: Omit<SalaryStructure, "id">) => {
    const { data } = await api.post<SalaryStructure>(`${BASE}/salary-structures/`, payload);
    return data;
  },
  updateSalaryStructure: async (id: number, payload: Partial<SalaryStructure>) => {
    const { data } = await api.patch<SalaryStructure>(`${BASE}/salary-structures/${id}/`, payload);
    return data;
  },
  deleteSalaryStructure: async (id: number) => {
    await api.delete(`${BASE}/salary-structures/${id}/`);
  },

  // Payrolls
  listPayrolls: async () => {
    const { data } = await api.get<Payroll[]>(`${BASE}/payrolls/`);
    return data;
  },
  listPayrollsWithEmployees: async () => {
    const { data } = await api.get<Payroll[]>(`${BASE}/payrolls/?include_employee_details=true`);
    return data;
  },
  getPayroll: async (id: number) => {
    const { data } = await api.get<Payroll>(`${BASE}/payrolls/${id}/`);
    return data;
  },
  createPayroll: async (payload: Omit<Payroll, "id" | "gross_salary" | "total_deductions" | "net_salary" | "payment_status" | "paid_on">) => {
    const { data } = await api.post<Payroll>(`${BASE}/payrolls/`, payload);
    return data;
  },
  updatePayroll: async (id: number, payload: Partial<Payroll>) => {
    const { data } = await api.patch<Payroll>(`${BASE}/payrolls/${id}/`, payload);
    return data;
  },
  deletePayroll: async (id: number) => {
    await api.delete(`${BASE}/payrolls/${id}/`);
  },
  calculatePayroll: async (id: number) => {
    const { data } = await api.post<Payroll>(`${BASE}/payrolls/${id}/calculate/`);
    return data;
  },

  // Approval actions
  approvePayroll: async (id: number) => {
    const { data } = await api.post<Payroll>(`${BASE}/payrolls/${id}/approve/`);
    return data;
  },
  rejectPayroll: async (id: number) => {
    const { data } = await api.post<Payroll>(`${BASE}/payrolls/${id}/reject/`);
    return data;
  },

  // Payslips
  listPayslips: async () => {
    const { data } = await api.get<Payslip[]>(`${BASE}/payslips/`);
    return data;
  },
  getPayslip: async (id: number) => {
    const { data } = await api.get<Payslip>(`${BASE}/payslips/${id}/`);
    return data;
  },

  // Attendance
  listAttendance: async () => {
    const { data } = await api.get<EmployeeAttendance[]>(`${BASE}/attendance/`);
    return data;
  },

  // Leaves
  listLeaves: async () => {
    const { data } = await api.get<LeaveRecord[]>(`${BASE}/leaves/`);
    return data;
  },

  // Notifications
  listNotifications: async () => {
    const { data } = await api.get<Notification[]>(`${BASE}/notifications/`);
    return data;
  },

  // Stripe Checkout
  createCheckoutSession: async (payrollId: number) => {
    const { data } = await api.post<StripeCheckoutResponse>(`${BASE}/${payrollId}/checkout/`);
    return data;
  },

  // Download payslip as PDF stream (uses action on PayrollViewSet)
  downloadPayslip: async (payrollId: number) => {
    const response = await api.get(`${BASE}/payrolls/${payrollId}/download-payslip/`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Tax Brackets
  listTaxBrackets: async () => {
    const { data } = await api.get<TaxBracket[]>(`${BASE}/tax-brackets/`);
    return data;
  },
  getTaxBracket: async (id: number) => {
    const { data } = await api.get<TaxBracket>(`${BASE}/tax-brackets/${id}/`);
    return data;
  },
  createTaxBracket: async (payload: Omit<TaxBracket, "id" | "created_at" | "updated_at">) => {
    const { data } = await api.post<TaxBracket>(`${BASE}/tax-brackets/`, payload);
    return data;
  },
  updateTaxBracket: async (id: number, payload: Partial<TaxBracket>) => {
    const { data } = await api.patch<TaxBracket>(`${BASE}/tax-brackets/${id}/`, payload);
    return data;
  },
  deleteTaxBracket: async (id: number) => {
    await api.delete(`${BASE}/tax-brackets/${id}/`);
  },

  // Statutory Deductions
  listStatutoryDeductions: async () => {
    const { data } = await api.get<StatutoryDeduction[]>(`${BASE}/statutory-deductions/`);
    return data;
  },
  getStatutoryDeduction: async (id: number) => {
    const { data } = await api.get<StatutoryDeduction>(`${BASE}/statutory-deductions/${id}/`);
    return data;
  },
  createStatutoryDeduction: async (payload: Omit<StatutoryDeduction, "id" | "created_at" | "updated_at">) => {
    const { data } = await api.post<StatutoryDeduction>(`${BASE}/statutory-deductions/`, payload);
    return data;
  },
  updateStatutoryDeduction: async (id: number, payload: Partial<StatutoryDeduction>) => {
    const { data } = await api.patch<StatutoryDeduction>(`${BASE}/statutory-deductions/${id}/`, payload);
    return data;
  },
  deleteStatutoryDeduction: async (id: number) => {
    await api.delete(`${BASE}/statutory-deductions/${id}/`);
  },

  // Notifications Management
  markNotificationAsRead: async (id: number) => {
    const { data } = await api.patch<Notification>(`${BASE}/notifications/${id}/`, { is_read: true });
    return data;
  },
  markAllNotificationsAsRead: async () => {
    const { data } = await api.post(`${BASE}/notifications/mark-all-read/`);
    return data;
  },
  createNotification: async (payload: Omit<Notification, "id" | "created_at" | "is_read">) => {
    const { data } = await api.post<Notification>(`${BASE}/notifications/`, payload);
    return data;
  },
  deleteNotification: async (id: number) => {
    await api.delete(`${BASE}/notifications/${id}/`);
  },
};

export default payrollService;


