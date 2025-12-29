import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 bg-[#F3F4F6] rounded-full p-1">
          <TabsTrigger
            value="overview"
            className="rounded-full px-6 py-2 text-sm font-semibold text-[#6C63FF] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-full px-6 py-2 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PayrollTrendsChart data={[]} />
            <TaxComplianceChart data={taxCompliance} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RecentDisbursementsCard disbursements={recentDisbursements} />
            <NotificationsCard />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group cursor-pointer transform hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Payroll Reports</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">Monthly and quarterly payroll summaries with detailed analytics</p>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group cursor-pointer transform hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Tax Reports</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">Tax deduction and compliance reports for regulatory filing</p>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group cursor-pointer transform hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Financial Reports</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">Audit and financial analysis reports for stakeholders</p>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboardContent;

