// src/services/payrollService.ts
import api from "@/lib/api";

/**
 * Helper: safely extract HTTP status from an unknown error (avoids `any` casts)
 */
const extractHttpStatus = (err: unknown): number | null => {
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    const response = e["response"] as Record<string, unknown> | undefined;
    const status =
      response && typeof response["status"] === "number"
        ? (response["status"] as number)
        : null;
    return status;
  }
  return null;
};

/* -------------------------
   Types exported for app
   ------------------------- */
export interface SalaryStructure {
  id: number;
  employee: number;
  basic_pay: string;
  allowances: string;
  deductions: string;
  tax: string;
  effective_from: string; // ISO date
  effective_to?: string | null; // ISO date or null
  name?: string; // Optional name field for display
  title?: string; // Alternative name field
  structure_name?: string; // Another possible name field
  salary_name?: string; // Another possible name field
}

export interface Payroll {
  id: number;
  employee: number;
  salary_structure: number | null;
  period_start: string;
  period_end: string;
  gross_salary: string;
  tax_amount?: string;
  statutory_deductions?: string;
  total_deductions: string;
  net_salary: string;
  payment_status: "PENDING" | "PAID" | "FAILED" | string;
  paid_on?: string | null;
  approval_status?: "AWAITING" | "APPROVED" | "REJECTED";
  paid_by?: number | null;
  // optionally included by backend
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

// Payload shape for creating a Payroll via POST /payroll/payrolls/
// Matches backend expectations and allows sending computed numeric fields.
export interface CreatePayrollPayload {
  employee: number;
  salary_structure?: number | null;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  gross_salary?: string | number;
  total_deductions?: string | number;
  net_salary?: string | number;
  tax_amount?: string | number;
  statutory_deductions?: string | number;
  payment_status?: "PENDING" | "PAID" | "FAILED"; // default PENDING
  paid_on?: string | null;
}

export interface Payslip {
  id: number;
  payroll: number;
  payslip_pdf_url?: string | null;
  issued_on: string;
}

export interface EmployeeAttendance {
  id: number;
  employee: number;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  work_hours: string;
  photo?: string | null;
  geo_location?: string | null;
}

export interface LeaveRecord {
  id: number;
  employee: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  approved_by?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Notification {
  id: number;
  employee: number;
  message: string;
  created_at: string;
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
  requested_on: string;
  approved_on?: string | null;
}

export interface Expense {
  id: number;
  employee: number;
  title: string;
  amount: string;
  category: string;
  receipt?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_on: string;
  reviewed_on?: string | null;
}

export interface BulkPaymentLog {
  id: number;
  created_by?: number | null;
  created_on: string;
  period_start: string;
  period_end: string;
  payrolls?: number[]; // backend may attach this
  total_amount: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | string;
  // may contain items/results field
  items?: any[];
}

export interface TaxBracket {
  id: number;
  min_income: string;
  max_income: string | null;
  rate: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatutoryDeduction {
  id: number;
  name: string;
  rate: string;
  is_mandatory: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StripeCheckoutResponse {
  id: string;
  url?: string | null;
}

/* -------------------------
   Base
   ------------------------- */
const BASE = "/payroll";

const payrollService = {
  /* ---------------- Salary Structures ---------------- */
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

  /* ---------------- Payrolls ---------------- */
  listPayrolls: async () => {
    const { data } = await api.get<Payroll[]>(`${BASE}/payrolls/`);
    return data;
  },

  // Frontend often requests payrolls with included employee details
  listPayrollsWithEmployees: async () => {
    // match earlier frontend expectations: include_employee_details=true
    const { data } = await api.get<Payroll[]>(
      `${BASE}/payrolls/?include_employee_details=true`
    );
    return data;
  },

  getPayroll: async (id: number) => {
    const { data } = await api.get<Payroll>(`${BASE}/payrolls/${id}/`);
    return data;
  },
  createPayroll: async (payload: CreatePayrollPayload) => {
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

  // calculate payroll (calls viewset action)
  calculatePayroll: async (id: number) => {
    const { data } = await api.post<Payroll>(`${BASE}/payrolls/${id}/calculate/`);
    return data;
  },

  // confirm payment (viewset action confirm-payment)
  confirmPayment: async (payrollId: number, sessionId?: string) => {
    const payload = sessionId ? { session_id: sessionId } : {};
    try {
      const { data } = await api.post<Payroll>(`${BASE}/payrolls/${payrollId}/confirm-payment/`, payload);
      return data;
    } catch (err: unknown) {
      const status = extractHttpStatus(err);
      if (status === 404) {
        // fallback to fetching payroll to refresh UI
        const resp = await api.get<Payroll>(`${BASE}/payrolls/${payrollId}/`);
        return resp.data;
      }
      throw err;
    }
  },

  // mark as paid (helper)
  markAsPaid: async (payrollId: number) => {
    const { data } = await api.patch<Payroll>(`${BASE}/payrolls/${payrollId}/`, {
      payment_status: "PAID",
      paid_on: new Date().toISOString().split("T")[0],
    });
    return data;
  },

  /* ---------------- Payslips ---------------- */
  listPayslips: async () => {
    const { data } = await api.get<Payslip[]>(`${BASE}/payslips/`);
    return data;
  },
  getPayslip: async (id: number) => {
    const { data } = await api.get<Payslip>(`${BASE}/payslips/${id}/`);
    return data;
  },

  // Generate a payslip record (backend may return a URL or a record)
  generatePayslip: async (payrollId: number, employeeId: number, month: string, netSalary: number) => {
    const payload = {
      payroll: payrollId,
      employee: employeeId,
      month,
      net_salary: netSalary,
      issued_on: new Date().toISOString().split("T")[0],
    };
    const { data } = await api.post<Payslip>(`${BASE}/payslips/`, payload);
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

  // Stripe Checkout - Using correct backend endpoints
  createCheckoutSession: async (payrollId: number) => {
    try {
      console.log(`Creating checkout session for payroll ${payrollId}...`);
      const { data } = await api.post<StripeCheckoutResponse>(`${BASE}/create-checkout-session/${payrollId}/`);
      console.log('Checkout session created:', data);
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
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
  listStatutoryDeductions: async () => {
    const { data } = await api.get<StatutoryDeduction[]>(`${BASE}/statutory-deductions/`);
    return data;
  },

  /* ---------------- Notifications (extended) ---------------- */
  markNotificationAsRead: async (id: number) => {
    const { data } = await api.patch<Notification>(`${BASE}/notifications/${id}/`, { is_read: true });
    return data;
  },
  createNotification: async (payload: Omit<Notification, "id" | "created_at" | "is_read">) => {
    const { data } = await api.post<Notification>(`${BASE}/notifications/`, payload);
    return data;
  },

  /* ---------------- Employee bank info ---------------- */
  listBankInfo: async () => {
    const { data } = await api.get<EmployeeBankInfo[]>(`${BASE}/bank-info/`);
    return data;
  },

  /* ---------------- Loans & Expenses ---------------- */
  listLoans: async () => {
    const { data } = await api.get<Loan[]>(`${BASE}/loans/`);
    return data;
  },
  listExpenses: async () => {
    const { data } = await api.get<Expense[]>(`${BASE}/expenses/`);
    return data;
  },

  /* ---------------- Bulk Payments ---------------- */
  listBulkPayments: async () => {
    const { data } = await api.get<BulkPaymentLog[]>(`${BASE}/bulk-payments/`);
    return data;
  },

  /**
   * Create bulk payment.
   * Backend requires `payrolls` as non-empty list. This helper will:
   * - if payload.payrolls is present and non-empty, POST as-is
   * - otherwise, if payload.period_start & period_end given, will try to fetch
   *   payrolls for that period and use their ids
   * Make sure `total_amount` is a number or string acceptable to backend.
   */
  createBulkPayment: async (payload: {
    payrolls?: number[]; // optional - we will auto-detect if missing
    period_start?: string;
    period_end?: string;
    total_amount?: number | string;
  }) => {
    let payIds = payload.payrolls;
    if (!Array.isArray(payIds) || payIds.length === 0) {
      // try to auto-resolve by fetching payrolls in the period
      if (payload.period_start && payload.period_end) {
        const all = await payrollService.listPayrollsWithEmployees().catch(() => []);
        const filtered = (all || []).filter((p) => {
          return p.period_start >= payload.period_start && p.period_end <= payload.period_end;
        });
        payIds = filtered.map((p) => p.id);
      }
    }

    if (!Array.isArray(payIds) || payIds.length === 0) {
      throw new Error("No payroll IDs provided or found for the selected period.");
    }

    // ensure total_amount if provided is a string (backend likely expects decimal string)
    const postPayload: Record<string, unknown> = {
      payrolls: payIds,
    };
    if (payload.total_amount != null) {
      postPayload.total_amount = String(payload.total_amount);
    }

    const { data } = await api.post<BulkPaymentLog>(`${BASE}/bulk-payments/`, postPayload);
    return data;
  },

  getBulkPayment: async (id: number) => {
    const { data } = await api.get<BulkPaymentLog & Record<string, unknown>>(`${BASE}/bulk-payments/${id}/`);
    return data;
  },
  confirmBulkPayment: async (id: number) => {
    const { data } = await api.post<BulkPaymentLog>(`${BASE}/bulk-payments/${id}/confirm/`);
    return data;
  },
};

export default payrollService;
