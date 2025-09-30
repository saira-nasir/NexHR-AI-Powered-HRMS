import api from "@/lib/api";

// Base path for payroll APIs
const BASE = "/payroll";

// Helper: safely extract HTTP status from an unknown error (avoids `any` casts)
const extractHttpStatus = (err: unknown): number | null => {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const response = e['response'] as Record<string, unknown> | undefined;
    const status = response && typeof response['status'] === 'number' ? (response['status'] as number) : null;
    return status;
  }
  return null;
};

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

export interface EmployeeBankInfo {
  id: number;
  employee: number;
  bank_name: string;
  account_number: string;
  routing_number?: string | null;
  stripe_account_id?: string | null;
}

export interface Loan {
  id: number;
  employee: number;
  amount: string;
  remaining_balance: string;
  installment: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CLOSED";
  requested_on: string; // ISO date
  approved_on?: string | null; // ISO date
}

export interface Expense {
  id: number;
  employee: number;
  title: string;
  amount: string;
  category: string;
  receipt?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_on: string; // ISO date
  reviewed_on?: string | null; // ISO date
}

export interface BulkPaymentLog {
  id: number;
  created_by?: number | null;
  created_on: string; // ISO datetime
  period_start: string; // ISO date
  period_end: string; // ISO date
  total_amount: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
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
    // Backend may expose the checkout creation endpoint in multiple ways
    // depending on backend routing. Try the most likely endpoints in order
    // so the frontend works across deployments.
    const tries = [
      `${BASE}/payrolls/${payrollId}/create-checkout/`, // explicit action on payrolls
      `${BASE}/${payrollId}/`, // backend's create_checkout_session registered at base/<id>/ in some setups
      `${BASE}/checkout/${payrollId}/`, // older/alternate path
    ];

    // local helper removed - use `extractHttpStatus` above

    for (const url of tries) {
      try {
        const { data } = await api.post<StripeCheckoutResponse>(url);
        if (data && data.url) return data;
      } catch (err: unknown) {
  const status = extractHttpStatus(err);
        if (status === 404) continue;
        throw err;
      }
    }

    throw new Error('Checkout creation endpoint not found on server');
  },

  // Payment confirmation and status update
  confirmPayment: async (payrollId: number, sessionId?: string) => {
    // Preferred confirm endpoint (provided in backend API list)
    const prefer = [`${BASE}/payrolls/${payrollId}/confirm-payment/`, `${BASE}/checkout/${payrollId}/confirm/`];
    for (const url of prefer) {
      try {
        const payload = sessionId ? { session_id: sessionId } : {};
        // Explicit debug log so network/console clearly shows what we're sending
        console.log('Confirm payment request', { url, payload });
        const { data } = await api.post<Payroll>(url, payload);
        return data;
      } catch (err: unknown) {
  const status = extractHttpStatus(err);
        // If endpoint not found try the next candidate
        if (status === 404) continue;

        // If backend returned validation errors (400) attach them to the error
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = err as any;
          if (e?.response?.data) {
            // add a serverErrors property to help callers inspect details
            (err as any).serverErrors = e.response.data;
            console.error('Confirm payment failed with server errors:', e.response.data);
          }
        } catch (e) {
          // ignore
        }

        throw err;
      }
    }

    // If confirm endpoints are webhook-only or not available, fetch payroll
    // detail so the caller can refresh UI state. This is non-fatal.
    const payroll = await api.get<Payroll>(`${BASE}/payrolls/${payrollId}/`);
    return payroll.data;
  },

  // Mark payroll as paid (for manual confirmation if needed)
  markAsPaid: async (payrollId: number) => {
    const { data } = await api.patch<Payroll>(`${BASE}/payrolls/${payrollId}/`, { 
      payment_status: 'PAID',
      paid_on: new Date().toISOString()
    });
    return data;
  },

  // Generate payslip
  generatePayslip: async (payrollId: number) => {
    try {
      console.log('Generating payslip for payroll ID:', payrollId);
      const payload = {
        payroll: payrollId,
        issued_on: new Date().toISOString().split('T')[0]
      };
      console.log('Payslip generation payload:', payload);
      
      const { data } = await api.post<Payslip>(`${BASE}/payslips/`, payload);
      console.log('Payslip generation response:', data);
      return data;
    } catch (error) {
      console.error('Payslip generation error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Download payslip as PDF stream (uses action on PayrollViewSet)
  downloadPayslip: async (payrollId: number) => {
    const response = await api.get(`${BASE}/payrolls/${payrollId}/download-payslip/`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Download a binary file from an absolute or relative URL (returns Blob)
  downloadByUrl: async (url: string) => {
    // If the url is relative (starts with '/'), axios with baseURL will work.
    // If absolute (http/https) axios will use it as-is.
    const response = await api.get(url, { responseType: 'blob' });
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

  // Employee Bank Info
  listBankInfo: async () => {
    const { data } = await api.get<EmployeeBankInfo[]>(`${BASE}/bank-info/`);
    return data;
  },
  getBankInfo: async (id: number) => {
    const { data } = await api.get<EmployeeBankInfo>(`${BASE}/bank-info/${id}/`);
    return data;
  },
  createBankInfo: async (payload: Omit<EmployeeBankInfo, "id">) => {
    const { data } = await api.post<EmployeeBankInfo>(`${BASE}/bank-info/`, payload);
    return data;
  },
  updateBankInfo: async (id: number, payload: Partial<EmployeeBankInfo>) => {
    const { data } = await api.patch<EmployeeBankInfo>(`${BASE}/bank-info/${id}/`, payload);
    return data;
  },
  deleteBankInfo: async (id: number) => {
    await api.delete(`${BASE}/bank-info/${id}/`);
  },

  // Loans Management
  listLoans: async () => {
    const { data } = await api.get<Loan[]>(`${BASE}/loans/`);
    return data;
  },
  getLoan: async (id: number) => {
    const { data } = await api.get<Loan>(`${BASE}/loans/${id}/`);
    return data;
  },
  createLoan: async (payload: Omit<Loan, "id" | "requested_on" | "approved_on">) => {
    const { data } = await api.post<Loan>(`${BASE}/loans/`, payload);
    return data;
  },
  updateLoan: async (id: number, payload: Partial<Loan>) => {
    const { data } = await api.patch<Loan>(`${BASE}/loans/${id}/`, payload);
    return data;
  },
  deleteLoan: async (id: number) => {
    await api.delete(`${BASE}/loans/${id}/`);
  },
  approveLoan: async (id: number) => {
    const { data } = await api.post<Loan>(`${BASE}/loans/${id}/approve/`);
    return data;
  },

  // Expenses Management
  listExpenses: async () => {
    const { data } = await api.get<Expense[]>(`${BASE}/expenses/`);
    return data;
  },
  getExpense: async (id: number) => {
    // Ensure the service uses the shared API client (api) and returns parsed data
    const { data } = await api.get<Expense>(`${BASE}/expenses/${id}/`);
    return data;
  },
  createExpense: async (payload: Omit<Expense, "id" | "submitted_on" | "reviewed_on">) => {
    const { data } = await api.post<Expense>(`${BASE}/expenses/`, payload);
    return data;
  },
  updateExpense: async (id: number, payload: Partial<Expense>) => {
    const { data } = await api.patch<Expense>(`${BASE}/expenses/${id}/`, payload);
    return data;
  },
  deleteExpense: async (id: number) => {
    await api.delete(`${BASE}/expenses/${id}/`);
  },
  approveExpense: async (id: number) => {
    const { data } = await api.post<Expense>(`${BASE}/expenses/${id}/approve/`);
    return data;
  },
  rejectExpense: async (id: number) => {
    const { data } = await api.post<Expense>(`${BASE}/expenses/${id}/reject/`);
    return data;
  },

  // Bulk Payments
  listBulkPayments: async () => {
    const { data } = await api.get<BulkPaymentLog[]>(`${BASE}/bulk-payments/`);
    return data;
  },
  createBulkPayment: async (payload: Omit<BulkPaymentLog, "id" | "created_by" | "created_on" | "status">) => {
    const { data } = await api.post<BulkPaymentLog>(`${BASE}/bulk-payments/`, payload);
    return data;
  },
  // GET single bulk payment log (includes items / per-employee results when backend provides them)
  getBulkPayment: async (id: number) => {
    // Backend may include nested result items; use a flexible but typed shape
    const { data } = await api.get<BulkPaymentLog & Record<string, unknown>>(`${BASE}/bulk-payments/${id}/`);
    return data;
  },
  // Confirm (finalize) a bulk payment operation - calls backend action
  confirmBulkPayment: async (id: number) => {
    const { data } = await api.post<BulkPaymentLog>(`${BASE}/bulk-payments/${id}/confirm/`);
    return data;
  },
  // Enhanced Attendance Management
  createAttendance: async (payload: Omit<EmployeeAttendance, "id">) => {
    const { data } = await api.post<EmployeeAttendance>(`${BASE}/attendance/`, payload);
    return data;
  },
  getAttendance: async (id: number) => {
    const { data } = await api.get<EmployeeAttendance>(`${BASE}/attendance/${id}/`);
    return data;
  },
  updateAttendance: async (id: number, payload: Partial<EmployeeAttendance>) => {
    const { data } = await api.patch<EmployeeAttendance>(`${BASE}/attendance/${id}/`, payload);
    return data;
  },
  deleteAttendance: async (id: number) => {
    await api.delete(`${BASE}/attendance/${id}/`);
  },

  // Enhanced Leave Management
  createLeave: async (payload: Omit<LeaveRecord, "id">) => {
    const { data } = await api.post<LeaveRecord>(`${BASE}/leaves/`, payload);
    return data;
  },
  getLeave: async (id: number) => {
    const { data } = await api.get<LeaveRecord>(`${BASE}/leaves/${id}/`);
    return data;
  },
  updateLeave: async (id: number, payload: Partial<LeaveRecord>) => {
    const { data } = await api.patch<LeaveRecord>(`${BASE}/leaves/${id}/`, payload);
    return data;
  },
  deleteLeave: async (id: number) => {
    await api.delete(`${BASE}/leaves/${id}/`);
  },
  approveLeave: async (id: number) => {
    const { data } = await api.post<LeaveRecord>(`${BASE}/leaves/${id}/approve/`);
    return data;
  },
  rejectLeave: async (id: number) => {
    const { data } = await api.post<LeaveRecord>(`${BASE}/leaves/${id}/reject/`);
    return data;
  },
};

export default payrollService;


