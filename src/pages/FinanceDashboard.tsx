import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
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
  // SalaryStructureTable and TaxManagementTable moved to dedicated pages
  NotificationsCard,
} from '@/components/financeDashboard';
import { employeeService, Employee } from '@/services/employeeService';
import payrollService, { Payroll, Payslip } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';

const FinanceDashboard: React.FC = () => {
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
      
      // Build employee map with proper name resolution (same as Payroll page)
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
          // Try different field name combinations for names
          const firstName = e.fname || e.first_name || e.firstName || '';
          const lastName = e.lname || e.last_name || e.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Use name field if available, otherwise construct from parts
          const displayName = e.name || fullName || e.email || `Employee ${e.id}`;
          
          map[e.id] = { 
            name: displayName, 
            email: e.email,
            department: e.company || e.department || 'Unknown',
          };
        }
      }
      
      setEmployeeMap(map);
      console.log('Finance Dashboard - Employee map created:', map);
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
      // Refresh data after a short delay to allow backend processing
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

  const handleCalculate = async () => {
    if (payrolls.length === 0) return;
    try {
      // Calculate for all pending payrolls sequentially
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
        // Add payroll_id to the success URL for confirmation
        const url = new URL(session.url);
        url.searchParams.set('payroll_id', firstPending.id.toString());
        window.location.href = url.toString();
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  // Helper function to convert data to CSV format with proper escaping
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeaders = headers.map(h => `"${h}"`).join(',');
    
    // Create CSV data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        // Always wrap in quotes for consistency and proper Excel handling
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Helper function to format currency values
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to format date for CSV
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleExportData = async () => {
    try {
      // Prepare payroll data for CSV with better formatting
      const payrollData = payrolls.map(p => ({
        'Payroll ID': p.id,
        'Employee ID': p.employee,
        'Employee Name': employeeMap[p.employee]?.name || `Employee ${p.employee}`,
        'Department': employeeMap[p.employee]?.department || 'Unknown',
        'Period Start': formatDate(p.period_start),
        'Period End': formatDate(p.period_end),
        'Gross Salary': formatCurrency(Number(p.gross_salary || 0)),
        'Tax Amount': formatCurrency(Number(p.tax_amount || 0)),
        'Statutory Deductions': formatCurrency(Number(p.statutory_deductions || 0)),
        'Net Salary': formatCurrency(Number(p.net_salary || 0)),
        'Payment Status': p.payment_status || 'N/A',
        'Paid On': formatDate(p.paid_on)
      }));

      // Prepare summary data
      const totalGross = payrolls.reduce((sum, p) => sum + Number(p.gross_salary || 0), 0);
      const totalTax = payrolls.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0);
      const totalDeductions = payrolls.reduce((sum, p) => sum + Number(p.statutory_deductions || 0), 0);
      const totalNet = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
      const paidCount = payrolls.filter(p => p.payment_status === 'PAID').length;
      const pendingCount = payrolls.filter(p => p.payment_status === 'PENDING').length;
      const failedCount = payrolls.filter(p => p.payment_status === 'FAILED').length;

      // Build well-formatted CSV content
      const exportDate = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let csvContent = '';
      
      // Header section with metadata
      csvContent += '"FINANCE DATA EXPORT"\n';
      csvContent += `"Generated: ${exportDate}"\n`;
      csvContent += `"Company: NexHR"\n`;
      csvContent += '"\n'; // Empty row for spacing
      
      // Summary section
      csvContent += '"SUMMARY"\n';
      csvContent += '"Metric","Value"\n';
      csvContent += `"Total Employees","${payrolls.length}"\n`;
      csvContent += `"Total Gross Salary","${formatCurrency(totalGross)}"\n`;
      csvContent += `"Total Tax Amount","${formatCurrency(totalTax)}"\n`;
      csvContent += `"Total Statutory Deductions","${formatCurrency(totalDeductions)}"\n`;
      csvContent += `"Total Net Salary","${formatCurrency(totalNet)}"\n`;
      csvContent += '"\n'; // Empty row
      csvContent += '"Payment Status Breakdown"\n';
      csvContent += '"Status","Count"\n';
      csvContent += `"Paid","${paidCount}"\n`;
      csvContent += `"Pending","${pendingCount}"\n`;
      csvContent += `"Failed","${failedCount}"\n`;
      csvContent += '"\n'; // Empty row
      csvContent += '"\n'; // Extra spacing
      
      // Payroll data section
      csvContent += '"PAYROLL DETAILS"\n';
      csvContent += convertToCSV(payrollData);
      csvContent += '\n';

      // Add BOM for Excel UTF-8 compatibility (helps Excel recognize special characters)
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create and download CSV file
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
      // Calculate report data
      const summary = {
        totalPayroll: totalNet,
        activeEmployees: payrolls.length,
        taxCompliance: taxCompliance[0].value,
        pendingDisbursements: pending.length,
        pendingAmount: pending.reduce((s, p) => s + Number(p.net_salary || 0), 0)
      };

      const breakdownByStatus = {
        paid: payrolls.filter(p => p.payment_status === 'PAID').length,
        pending: payrolls.filter(p => p.payment_status === 'PENDING').length,
        failed: payrolls.filter(p => p.payment_status === 'FAILED').length
      };

      const breakdownByDepartment = Object.entries(employeeMap).reduce((acc, [id, emp]) => {
        const dept = emp.department || 'Unknown';
        if (!acc[dept]) acc[dept] = { count: 0, total: 0 };
        acc[dept].count++;
        const payroll = payrolls.find(p => p.employee === Number(id));
        if (payroll) acc[dept].total += Number(payroll.net_salary || 0);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const recentDisbursementsData = recentDisbursements.slice(0, 10);

      // Create PDF document
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(108, 99, 255); // Primary color
      pdf.text('Finance Dashboard Report', margin, yPosition);
      yPosition += 10;

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 15;

      // Summary Section
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
      yPosition += 7;
      pdf.text(`Pending Amount: $${summary.pendingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, margin, yPosition);
      yPosition += 15;

      // Breakdown by Status
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Breakdown by Status', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Paid: ${breakdownByStatus.paid}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Pending: ${breakdownByStatus.pending}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Failed: ${breakdownByStatus.failed}`, margin, yPosition);
      yPosition += 15;

      // Breakdown by Department
      if (Object.keys(breakdownByDepartment).length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Breakdown by Department', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        Object.entries(breakdownByDepartment).forEach(([dept, data]) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${dept}: ${data.count} employees, $${data.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Recent Disbursements
      if (recentDisbursementsData.length > 0) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Recent Disbursements', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        
        recentDisbursementsData.forEach((disbursement) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          const line = `${disbursement.employee}: $${disbursement.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${disbursement.date || 'N/A'}`;
          pdf.text(line, margin, yPosition, { maxWidth });
          yPosition += 7;
        });
      }

      // Save PDF
      pdf.save(`finance_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: 'Report generated', description: 'Finance report generated as PDF successfully.' });
    } catch (e: any) {
      toast({ title: 'Report generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleProcessAllPending = async () => {
    try {
      if (pending.length === 0) {
        toast({ title: 'No pending disbursements', description: 'All payrolls are already processed.' });
        return;
      }

      // Process all pending payrolls
      for (const p of pending) {
        try {
          await payrollService.calculatePayroll(p.id);
        } catch (error) {
          console.error(`Failed to calculate payroll ${p.id}:`, error);
        }
      }
      
      toast({ title: 'Processing started', description: `${pending.length} payroll(s) are being processed.` });
      await loadData();
    } catch (e: any) {
      toast({ title: 'Processing failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleViewDetails = async () => {
    try {
      const paidPayrolls = payrolls.filter(p => p.payment_status === 'PAID');
      if (paidPayrolls.length === 0) {
        toast({ title: 'No completed payments', description: 'No completed payments to view.' });
        return;
      }
      
      toast({ 
        title: 'Completed Payments', 
        description: `${paidPayrolls.length} payment(s) completed. Total amount: $${paidPayrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0).toLocaleString()}` 
      });
    } catch (e: any) {
      toast({ title: 'Failed to load details', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleRetryFailed = async () => {
    try {
      const failedPayrolls = payrolls.filter(p => p.payment_status === 'FAILED');
      if (failedPayrolls.length === 0) {
        toast({ title: 'No failed payments', description: 'No failed payments to retry.' });
        return;
      }

      // Retry failed payrolls by recalculating them
      for (const p of failedPayrolls) {
        try {
          await payrollService.calculatePayroll(p.id);
        } catch (error) {
          console.error(`Failed to retry payroll ${p.id}:`, error);
        }
      }
      
      toast({ title: 'Retry initiated', description: `${failedPayrolls.length} failed payroll(s) are being retried.` });
      await loadData();
    } catch (e: any) {
      toast({ title: 'Retry failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
            <p className="text-muted-foreground">Manage payroll, budgets, and financial compliance for NexHR</p>
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
              {/* Salary Structures and Tax Management moved to dedicated pages */}
              <TabsTrigger
                value="reports"
                className="rounded-full px-6 py-2 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200"
              >
                Reports
              </TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PayrollTrendsChart data={[] /* can be built from payrolls when periods available */} />
              <TaxComplianceChart data={taxCompliance} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <RecentDisbursementsCard disbursements={recentDisbursements} />
              <NotificationsCard />
            </div>

          </TabsContent>

          {/* Payroll tab removed - payroll management is handled on the dedicated Payrolls page */}

          {/* salary-structures and tax-management content removed from dashboard
              They are available under Finance > Salary Structures and Finance > Tax Management
          */}

          {/* Disbursement tab removed per design change - only Overview and Reports remain */}

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
    </DashboardLayout>
  );
};

export default FinanceDashboard;
