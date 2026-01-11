import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  TotalPayrollCard,
  ActiveEmployeesCard,
  TaxComplianceCard,
  PendingDisbursementsCard,
  PayrollTrendsChart,
  TaxComplianceChart,
  RecentDisbursementsCard,
  NotificationsCard,
} from '@/components/financeDashboard';
import { employeeService, Employee } from '@/services/employeeService';
import payrollService, { Payroll, Payslip } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';

/**
 * Finance Dashboard Content Component
 * Extracted from FinanceDashboard to be reusable in AdminDashboard
 */
const FinanceDashboardContent: React.FC = () => {
  const { toast } = useToast();
  const { isConfirming } = usePaymentConfirmation();

  const [payrolls, setPayrolls] = React.useState<Payroll[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [employeeMap, setEmployeeMap] = React.useState<Record<number, { name: string; email?: string; department?: string }>>({});

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [pr, ps, emps] = await Promise.all([
        payrollService.listPayrollsWithEmployees().catch(() => payrollService.listPayrolls()),
        payrollService.listPayslips(),
        employeeService.getEmployees().catch(() => [] as Employee[]),
      ]);
      setPayrolls(pr);
      setPayslips(ps);
      
      // Build employee map with proper name resolution
      const map: Record<number, { name: string; email?: string; department?: string }> = {};
      
      // First, try to extract employee details from payroll data if available
      pr.forEach(payroll => {
        if (payroll.employee_details) {
          const emp = payroll.employee_details;
          const firstName = emp.fname || emp.first_name || '';
          const lastName = emp.lname || emp.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const displayName = emp.name || fullName || emp.email || `Employee ${emp.id}`;
          
          map[emp.id] = {
            name: displayName,
            email: emp.email || '',
            department: emp.company || emp.department || 'Unknown',
          };
        }
      });
      
      // Then add employees from the employee service
      if (Array.isArray(emps)) {
        for (const e of emps) {
          const firstName = e.fname || e.first_name || e.firstName || '';
          const lastName = e.lname || e.last_name || e.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const displayName = e.name || fullName || e.email || `Employee ${e.id}`;
          
          map[e.id] = { 
            name: displayName, 
            email: e.email,
            department: e.company || e.department || 'Unknown',
          };
        }
      }
      
      setEmployeeMap(map);
    } catch (e: any) {
      toast({ title: 'Failed to load finance data', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when payment confirmation is happening
  React.useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => {
        loadData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming, loadData]);

  // Derived UI data
  const totalNet = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
  const paidCount = payrolls.filter(p => p.payment_status === 'PAID').length;
  const pending = payrolls.filter(p => p.payment_status === 'PENDING');
  const recentDisbursements = payrolls
    .filter(p => p.payment_status === 'PAID')
    .slice(0, 6)
    .map(p => {
      const emp = employeeMap[p.employee];
      const employeeName = emp ? emp.name : `Employee ${p.employee}`;
      return {
        employee: employeeName,
        employeeId: p.employee,
        amount: Number(p.net_salary || 0),
        status: 'Completed' as const,
        date: p.paid_on || p.period_end,
      };
    });

  const taxCompliance = [
    { name: 'Compliant', value: Math.min(100, Math.max(0, Math.round((paidCount / (payrolls.length || 1)) * 100))), color: '#10b981' },
    { name: 'Pending', value: Math.min(100, Math.max(0, Math.round(((payrolls.length - paidCount) / (payrolls.length || 1)) * 100))), color: '#f59e0b' },
    { name: 'Issues', value: 0, color: '#ef4444' },
  ];

  // Additional derived metrics to match full FinanceDashboard
  const totalEmployees = new Set(payrolls.map(p => p.employee)).size;
  const approvedEmployees = paidCount;

  const calculatedPayrolls = payrolls.filter(p => Number(p.net_salary || 0) > 0);
  const taxCalculatedPayrolls = payrolls.filter(p => Number(p.tax_amount || 0) > 0);

  const salaryCalculationProgress = payrolls.length > 0 ? (calculatedPayrolls.length / payrolls.length) * 100 : 0;
  const taxDeductionProgress = payrolls.length > 0 ? (taxCalculatedPayrolls.length / payrolls.length) * 100 : 0;
  const approvalProgress = totalEmployees > 0 ? (approvedEmployees / totalEmployees) * 100 : 0;
  const disbursementProgress = payrolls.length > 0 ? (paidCount / payrolls.length) * 100 : 0;

  const handleExportData = async () => {
    try {
      const payrollData = payrolls.map(p => ({
        'Payroll ID': p.id,
        'Employee ID': p.employee,
        'Employee Name': employeeMap[p.employee]?.name || `Employee ${p.employee}`,
        'Department': employeeMap[p.employee]?.department || 'Unknown',
        'Period Start': p.period_start ? new Date(p.period_start).toLocaleDateString() : '',
        'Period End': p.period_end ? new Date(p.period_end).toLocaleDateString() : '',
        'Gross Salary': `$${Number(p.gross_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'Tax Amount': `$${Number(p.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'Statutory Deductions': `$${Number(p.statutory_deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'Net Salary': `$${Number(p.net_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'Payment Status': p.payment_status || 'N/A',
        'Paid On': p.paid_on ? new Date(p.paid_on).toLocaleDateString() : ''
      }));

      const exportDate = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let csvContent = '';
      csvContent += '"FINANCE DATA EXPORT"\n';
      csvContent += `"Generated: ${exportDate}"\n`;
      csvContent += `"Company: NexHR"\n`;
      csvContent += '"\n';
      csvContent += '"SUMMARY"\n';
      csvContent += '"Metric","Value"\n';
      csvContent += `"Total Employees","${payrolls.length}"\n`;
      csvContent += `"Total Net Salary","$${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\n`;
      csvContent += '"\n';
      csvContent += '"PAYROLL DETAILS"\n';
      
      if (payrollData.length > 0) {
        const headers = Object.keys(payrollData[0]);
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
        payrollData.forEach(row => {
          csvContent += headers.map(header => `"${String(row[header as keyof typeof row] || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
      }

      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Data exported', description: 'Finance data exported as CSV successfully.' });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const summary = {
        totalPayroll: totalNet,
        activeEmployees: payrolls.length,
        taxCompliance: taxCompliance[0].value,
        pendingDisbursements: pending.length,
        pendingAmount: pending.reduce((s, p) => s + Number(p.net_salary || 0), 0)
      };

      const pdf = new jsPDF();
      let yPosition = 20;
      const margin = 20;

      pdf.setFontSize(20);
      pdf.setTextColor(108, 99, 255);
      pdf.text('Finance Dashboard Report', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Total Payroll: $${summary.totalPayroll.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Active Employees: ${summary.activeEmployees}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Tax Compliance: ${summary.taxCompliance}%`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Pending Disbursements: ${summary.pendingDisbursements}`, margin, yPosition);

      pdf.save(`finance_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: 'Report generated', description: 'Finance report generated as PDF successfully.' });
    } catch (e: any) {
      toast({ title: 'Report generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleCalculate = async () => {
    if (payrolls.length === 0) return;

    if (pending.length === 0) {
      toast({ title: 'No pending calculations', description: 'All payrolls are already calculated/paid.' });
      return;
    }

    try {
      for (const pr of pending) {
        await payrollService.calculatePayroll(pr.id);
      }
      toast({ title: 'Salary calculation complete' });
      await loadData();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || e?.message || 'Please try again.';
      if (errorMessage.includes('No SalaryStructure linked')) {
        toast({
          title: 'Calculation failed',
          description: 'Some employees need salary structures before calculation. Please create them first.',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Calculation failed', description: errorMessage, variant: 'destructive' });
      }
    }
  };

  const handleCheckout = async () => {
    try {
      const firstPending = pending[0];
      if (!firstPending) return;
      const session = await payrollService.createCheckoutSession(firstPending.id);
      if (session?.url) {
        const url = new URL(session.url);
        url.searchParams.set('payroll_id', firstPending.id.toString());
        window.location.href = url.toString();
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finance Overview</h2>
          <p className="text-muted-foreground">Manage payroll, budgets, and financial compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <TotalPayrollCard amount={`$${totalNet.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} percentageChange={"—"} />
        <ActiveEmployeesCard count={payrolls.length} newHires={0} />
        <TaxComplianceCard percentage={taxCompliance[0].value} pendingReview={taxCompliance[1].value} />
        <PendingDisbursementsCard count={pending.length} totalAmount={`$${pending.reduce((s, p) => s + Number(p.net_salary || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
      </div>

      <div className="space-y-6">
        <Card className="group transition-transform transform hover:-translate-y-1 overflow-hidden rounded-lg border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 duration-300 ease-out">
          <div className="flex">
            <div className="w-0.5 bg-gradient-to-b from-[#6C63FF]/60 to-[#FF6B6B]/60" />
            <div className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Payroll Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 py-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-sm">Salary Calculation</span>
                    <span className={`font-medium ${salaryCalculationProgress === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {calculatedPayrolls.length}/{payrolls.length} ({Math.round(salaryCalculationProgress)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300" style={{ width: `${salaryCalculationProgress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-sm">Tax Deductions</span>
                    <span className={`font-medium ${taxDeductionProgress === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {taxCalculatedPayrolls.length}/{payrolls.length} ({Math.round(taxDeductionProgress)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300" style={{ width: `${taxDeductionProgress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-sm">Approval Process</span>
                    <span className={`font-medium ${approvalProgress === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {approvedEmployees}/{totalEmployees} ({Math.round(approvalProgress)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300" style={{ width: `${approvalProgress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-sm">Disbursement</span>
                    <span className={`font-medium ${disbursementProgress === 100 ? 'text-green-600' : disbursementProgress > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {paidCount}/{payrolls.length} ({Math.round(disbursementProgress)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300" style={{ width: `${disbursementProgress}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-1">
          <TaxComplianceChart data={taxCompliance} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentDisbursementsCard disbursements={recentDisbursements} />
          <NotificationsCard />
        </div>

      </div>

      {/* Overview and Reports tabs intentionally removed for Admin Accounts view */}
    </div>
  );
};

export default FinanceDashboardContent;

