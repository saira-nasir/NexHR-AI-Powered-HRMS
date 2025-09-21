import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText } from 'lucide-react';
import {
  TotalPayrollCard,
  ActiveEmployeesCard,
  TaxComplianceCard,
  PendingDisbursementsCard,
  PayrollTrendsChart,
  TaxComplianceChart,
  RecentDisbursementsCard,
  SalaryStructureTable,
  TaxManagementTable,
  NotificationsCard,
} from '@/components/financeDashboard';
import PayrollTable from '@/components/financeDashboard/PayrollTable';
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

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
            <p className="text-muted-foreground">Manage payroll, budgets, and financial compliance for NexHR</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="salary-structures">Salary Structures</TabsTrigger>
            <TabsTrigger value="tax-management">Tax Management</TabsTrigger>
            <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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

          <TabsContent value="payroll" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Salary Calculation</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Calculate monthly wages based on attendance and leave records for all employees</p>
                  </div>
                  <Button onClick={handleCalculate} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
                    {isLoading ? 'Loading…' : 'Calculate Salary'}
                  </Button>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Payslip Generation</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Generate and download employee payslips with detailed breakdown</p>
                  </div>
                  <Button onClick={handleCheckout} disabled={pending.length === 0 || isLoading} className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
                    {pending.length === 0 ? 'No Pending Payments' : 'Pay Now (Stripe)'}
                  </Button>
                </div>
              </div>
            </div>
            <PayrollTable
              payrolls={payrolls}
              payslips={payslips}
              employees={employeeMap}
              onCalculate={async (id) => { 
                try {
                  await payrollService.calculatePayroll(id); 
                  await loadData(); 
                } catch (e: any) {
                  const errorMessage = e?.response?.data?.detail || e?.message || 'Please try again.';
                  if (errorMessage.includes('No SalaryStructure linked')) {
                    toast({ 
                      title: 'Calculation failed', 
                      description: 'This employee needs a salary structure before calculation.', 
                      variant: 'destructive' 
                    });
                  } else {
                    toast({ title: 'Calculation failed', description: errorMessage, variant: 'destructive' });
                  }
                }
              }}
              onPay={async (id) => { 
                try {
                  const s = await payrollService.createCheckoutSession(id); 
                  if (s.url) window.location.href = s.url; 
                } catch (e: any) {
                  const errorMessage = e?.response?.data?.detail || e?.message || 'Please try again.';
                  toast({ title: 'Checkout failed', description: errorMessage, variant: 'destructive' });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="salary-structures" className="space-y-4">
            <SalaryStructureTable />
          </TabsContent>

          <TabsContent value="tax-management" className="space-y-4">
            <TaxManagementTable />
          </TabsContent>

          <TabsContent value="disbursement" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors">Pending</h3>
                    <div className="text-3xl font-bold text-orange-600 mb-2">12</div>
                    <p className="text-sm text-muted-foreground mb-6">$45,200 total amount</p>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 transition-colors duration-200 shadow-sm hover:shadow-md">
                    Process All
                  </Button>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">Completed</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">46</div>
                    <p className="text-sm text-muted-foreground mb-6">$116,800 disbursed</p>
                  </div>
                  <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 transition-colors duration-200">
                    View Details
                  </Button>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-red-200 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-red-600 transition-colors">Failed</h3>
                    <div className="text-3xl font-bold text-red-600 mb-2">3</div>
                    <p className="text-sm text-muted-foreground mb-6">Requires attention</p>
                  </div>
                  <Button variant="destructive" className="w-full bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-sm hover:shadow-md">
                    Retry Failed
                  </Button>
                </div>
              </div>
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
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
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
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
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
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
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
