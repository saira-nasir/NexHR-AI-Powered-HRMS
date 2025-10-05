import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calculator,
  Banknote,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  RefreshCw
} from 'lucide-react';

import payrollService, { Payroll, Payslip, SalaryStructure } from '@/services/payrollService';
// Dialog inspector removed - not required
import { employeeService, Employee } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import PayrollPreviewModal from '@/components/financeDashboard/PayrollPreviewModal';

type EmployeeMap = Record<number, { name: string; email?: string; department?: string }>;

const PayrollPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('December 2024');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<EmployeeMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { isConfirming } = usePaymentConfirmation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayrollId, setPreviewPayrollId] = useState<number | null>(null);
  // Inspect JSON UI removed per UX decision
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'FAILED'>('ALL');
  const [month, setMonth] = useState<string>(''); // yyyy-MM

  const pendingPayrolls = useMemo(() => payrolls.filter(p => p.payment_status === 'PENDING'), [payrolls]);
  const paidPayrolls = useMemo(() => payrolls.filter(p => p.payment_status === 'PAID'), [payrolls]);
  const totalEmployees = useMemo(() => new Set(payrolls.map(p => p.employee)).size, [payrolls]);
  const pendingEmployees = pendingPayrolls.length;
  const approvedEmployees = paidPayrolls.length;
  const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

  const handleSelectAll = () => {
    if (selectedEmployees.length === totalEmployees) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(Array.from(new Set(payrolls.map(p => p.employee))));
    }
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleCalculatePayroll = async (payrollId: number) => {
    try {
      await payrollService.calculatePayroll(payrollId);
      toast({ title: 'Salary calculation completed' });
      await loadData();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || e?.message || 'Please try again.';
      if (errorMessage.includes('No SalaryStructure linked')) {
        toast({ 
          title: 'Calculation failed', 
          description: 'This employee needs a salary structure before calculation. Please create one first.', 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Calculation failed', description: errorMessage, variant: 'destructive' });
      }
    }
  };

  const handlePayPayroll = async (payrollId: number) => {
    try {
      const session = await payrollService.createCheckoutSession(payrollId);
      if (session.url) {
        // Persist payroll id locally before redirecting to Stripe so we can
        // recover it after Stripe redirects back (useful when success_url
        // isn't set to include payroll_id).
        try {
          localStorage.setItem('nexhr.pending_payroll', payrollId.toString());
        } catch (err) {
          // ignore storage errors
        }
        // Redirect to Stripe-hosted checkout
        window.location.href = session.url;
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handlePreviewPayroll = async (payrollId: number) => {
    setPreviewPayrollId(payrollId);
    setPreviewOpen(true);
  };

  const getPayrollData = (payrollId: number) => {
    return payrolls.find(p => p.id === payrollId) || null;
  };

  const handlePreparePayroll = async () => {
    try {
      for (const p of pendingPayrolls) {
        await payrollService.calculatePayroll(p.id);
      }
      toast({ title: 'Salary calculation completed' });
      await loadData();
    } catch (e: any) {
      toast({ title: 'Calculation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleApprovePayroll = async () => {
    try {
      if (pendingPayrolls.length === 0) return;
      const first = pendingPayrolls[0];
      const session = await payrollService.createCheckoutSession(first.id);
      if (session.url) {
        try { localStorage.setItem('nexhr.pending_payroll', first.id.toString()); } catch {};
        window.location.href = session.url;
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDisbursePayroll = async () => {
    await handleApprovePayroll();
  };

  const handleGeneratePayslips = async () => {
    try {
      const selected = payrolls.filter(p => selectedEmployees.includes(p.employee));
      if (selected.length === 0) {
        toast({ title: 'Select employees first', description: 'Choose one or more employees to generate payslips for.' });
        return;
      }

      const paidTargets = selected.filter(p => p.payment_status === 'PAID');
      const skipped = selected.filter(p => p.payment_status !== 'PAID');

      if (paidTargets.length === 0) {
        toast({ title: 'No paid payrolls selected', description: 'Payslips can only be generated for payrolls with status Paid.' });
        return;
      }

      if (skipped.length > 0) {
        toast({ title: 'Some payrolls were skipped', description: `${skipped.length} selected payroll(s) are not paid and were skipped.` });
      }

      // Generate payslips for all paid selected employees
      for (const p of paidTargets) {
        try {
          // First generate the payslip record if it doesn't exist and get its data
          const payslip = await payrollService.generatePayslip(p.id);

          // Prefer direct file URL if backend returned one; otherwise fall back to Download action
          let blob: Blob;
          if (payslip?.payslip_pdf_url) {
            blob = await payrollService.downloadByUrl(payslip.payslip_pdf_url as string);
          } else {
            blob = await payrollService.downloadPayslip(p.id);
          }
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payslip_${p.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Failed to generate payslip for payroll ${p.id}:`, error);
        }
      }
      toast({ title: 'Payslips generated', description: `${paidTargets.length} file(s) downloaded.` });
      await loadData(); // Refresh data to show updated payslips
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDownloadAllPayslips = async () => {
    try {
      const paidPayrolls = payrolls.filter(p => p.payment_status === 'PAID');
      if (paidPayrolls.length === 0) {
        toast({ title: 'No paid payrolls', description: 'No paid payrolls available for download.' });
        return;
      }
      
      for (const p of paidPayrolls) {
        try {
          // First generate the payslip record if it doesn't exist and get its data
          const payslip = await payrollService.generatePayslip(p.id);

          // Prefer direct file URL if backend returned one; otherwise fall back to Download action
          let blob: Blob;
          if (payslip?.payslip_pdf_url) {
            blob = await payrollService.downloadByUrl(payslip.payslip_pdf_url as string);
          } else {
            blob = await payrollService.downloadPayslip(p.id);
          }
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payslip_${p.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Failed to download payslip for payroll ${p.id}:`, error);
        }
      }
      toast({ title: 'All payslips downloaded', description: `${paidPayrolls.length} file(s) downloaded.` });
      await loadData(); // Refresh data to show updated payslips
    } catch (e: any) {
      toast({ title: 'Download failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleBulkGeneratePayslips = async () => {
    try {
      const allPayrolls = payrolls.filter(p => p.payment_status === 'PAID');
      if (allPayrolls.length === 0) {
        toast({ title: 'No paid payrolls', description: 'No paid payrolls available for bulk generation.' });
        return;
      }
      
      toast({ title: 'Bulk generation started', description: `Generating payslips for ${allPayrolls.length} employees...` });
      
      for (const p of allPayrolls) {
        try {
          // Generate payslip record
          await payrollService.generatePayslip(p.id);
        } catch (error) {
          console.error(`Failed to generate payslip for payroll ${p.id}:`, error);
        }
      }
      
      toast({ title: 'Bulk generation completed', description: `Payslips generated for ${allPayrolls.length} employees.` });
      await loadData(); // Refresh data to show updated payslips
    } catch (e: any) {
      toast({ title: 'Bulk generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handlePreviewPayrollRun = async () => {
    try {
      const pendingPayrolls = payrolls.filter(p => p.payment_status === 'PENDING');
      if (pendingPayrolls.length === 0) {
        toast({ title: 'No pending payrolls', description: 'No pending payrolls to preview.' });
        return;
      }
      
      // Show preview modal for the first pending payroll
      setPreviewPayrollId(pendingPayrolls[0].id);
      setPreviewOpen(true);
    } catch (e: any) {
      toast({ title: 'Preview failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleGenerateReports = async () => {
    try {
      // Generate comprehensive payroll report
      const reportData = {
        totalEmployees: payrolls.length,
        totalGrossSalary: payrolls.reduce((sum, p) => sum + Number(p.gross_salary || 0), 0),
        totalTaxAmount: payrolls.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0),
        totalStatutoryDeductions: payrolls.reduce((sum, p) => sum + Number(p.statutory_deductions || 0), 0),
        totalNetSalary: payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0),
        paidCount: payrolls.filter(p => p.payment_status === 'PAID').length,
        pendingCount: payrolls.filter(p => p.payment_status === 'PENDING').length,
        failedCount: payrolls.filter(p => p.payment_status === 'FAILED').length,
        period: selectedMonth
      };

      // Create and download report as JSON
      const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_report_${selectedMonth.replace(' ', '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Report generated', description: 'Payroll report downloaded successfully.' });
    } catch (e: any) {
      toast({ title: 'Report generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleViewDiscrepancies = async () => {
    try {
      const discrepancies = payrolls.filter(p => 
        p.payment_status === 'FAILED' || 
        (p.payment_status === 'PENDING' && Number(p.net_salary || 0) <= 0)
      );
      
      if (discrepancies.length === 0) {
        toast({ title: 'No discrepancies found', description: 'All payroll records appear to be in order.' });
        return;
      }
      
      toast({ 
        title: 'Discrepancies found', 
        description: `${discrepancies.length} payroll record(s) require attention. Check the payroll table for details.`,
        variant: 'destructive'
      });
    } catch (e: any) {
      toast({ title: 'Discrepancy check failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    // Normalize and map backend statuses to UI labels
    const s = (status || '').toString().toUpperCase();
    switch (s) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'PAID':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'FAILED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'AWAITING':
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pr, ps, emps, ss] = await Promise.all([
        payrollService.listPayrollsWithEmployees().catch(() => payrollService.listPayrolls()),
        payrollService.listPayslips(),
        employeeService.getEmployees().catch(() => [] as Employee[]),
        payrollService.listSalaryStructures().catch(() => [] as SalaryStructure[]),
      ]);
      
      console.log('Payroll data:', pr);
      console.log('Employee data:', emps);
      console.log('Payroll data structure:', pr.map(p => ({ id: p.id, employee: p.employee, period: `${p.period_start} to ${p.period_end}` })));
      console.log('Employee data structure:', emps.map(e => ({ id: e.id, name: e.name, fname: e.fname, lname: e.lname, email: e.email })));
      console.log('Employee data length:', emps.length);
      console.log('Payroll data length:', pr.length);
      console.log('Salary structures:', ss);
      
      // Debug specific employee ID 8
      const employee8 = emps.find(e => e.id === 8);
      console.log('Employee ID 8 from employee service:', employee8);
      
      const payrollWithEmployee8 = pr.find(p => p.employee === 8);
      console.log('Payroll with employee 8:', payrollWithEmployee8);
      
      // Check if employee 8 has employee_details in payroll data
      if (payrollWithEmployee8?.employee_details) {
        console.log('Employee 8 details from payroll:', payrollWithEmployee8.employee_details);
      } else {
        console.log('Employee 8 has no employee_details in payroll data');
      }
      
      // Deduplicate payrolls by employee + period (start/end).
      // Backends sometimes return multiple payroll records per employee/period (different ids).
      // Group them and pick the best candidate per group to avoid duplicate rows in the UI.
      const groups: Record<string, Payroll[]> = {};
      pr.forEach((p: Payroll) => {
        const key = `${p.employee}-${p.period_start}-${p.period_end}`;
        groups[key] = groups[key] || [];
        groups[key].push(p);
      });

      const statusPriority: Record<string, number> = { 'PAID': 3, 'PENDING': 2, 'FAILED': 1 };

      const uniquePayrolls: Payroll[] = Object.values(groups).map(group => {
        if (group.length === 1) return group[0];
        // pick by highest status priority
        group.sort((a, b) => {
          const pa = statusPriority[a.payment_status] || 0;
          const pb = statusPriority[b.payment_status] || 0;
          if (pa !== pb) return pb - pa; // descending
          // prefer higher net_salary
          const na = Number(a.net_salary || 0);
          const nb = Number(b.net_salary || 0);
          if (na !== nb) return nb - na;
          // prefer latest paid_on (if available)
          const da = a.paid_on ? new Date(a.paid_on).getTime() : 0;
          const db = b.paid_on ? new Date(b.paid_on).getTime() : 0;
          if (da !== db) return db - da;
          // fallback to highest id
          return b.id - a.id;
        });
        return group[0];
      });

      setPayrolls(uniquePayrolls);
      setPayslips(ps);
      setSalaryStructures(ss);

      // Build employee map with proper name resolution
      const map: EmployeeMap = {};
      
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
      (emps as Employee[]).forEach(e => {
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
      });

      console.log('Initial employee map:', map);
      console.log('Employee map keys:', Object.keys(map));
      console.log('Employee map values:', Object.values(map));

      // Enhanced fallback: resolve any missing names by calling detail endpoint per unique employee id
      const missingIds = Array.from(new Set(pr.map(p => p.employee))).filter(id => !map[id]);
      console.log('Missing employee IDs:', missingIds);
      console.log('All payroll employee IDs:', pr.map(p => p.employee));
      
      if (missingIds.length > 0) {
        console.log('Attempting to fetch missing employee details...');
        
        // Special debug for employee ID 8
        if (missingIds.includes(8)) {
          console.log('🔍 DEBUGGING EMPLOYEE ID 8 - Attempting direct fetch...');
          try {
            const directEmployee8 = await employeeService.getEmployee(8);
            console.log('Direct fetch result for employee 8:', directEmployee8);
            
            // If we found employee 8, add it to the map immediately
            if (directEmployee8) {
              const firstName = directEmployee8.fname || directEmployee8.first_name || directEmployee8.firstName || '';
              const lastName = directEmployee8.lname || directEmployee8.last_name || directEmployee8.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const displayName = directEmployee8.name || fullName || directEmployee8.email || `Employee ${directEmployee8.id}`;
              
              map[directEmployee8.id] = {
                name: displayName,
                email: directEmployee8.email,
                department: directEmployee8.company || directEmployee8.department || 'Unknown',
              };
              console.log('✅ Successfully added Employee 8 to map:', map[directEmployee8.id]);
            }
          } catch (error) {
            console.error('Direct fetch error for employee 8:', error);
          }
        }
        
        const details = await Promise.allSettled(missingIds.map(id => employeeService.getEmployee(id)));
        details.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const d = result.value;
            console.log(`Successfully fetched employee ${d.id}:`, d);
            
            // Try different field name combinations for names
            const firstName = d.fname || d.first_name || d.firstName || '';
            const lastName = d.lname || d.last_name || d.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Use name field if available, otherwise construct from parts
            const displayName = d.name || fullName || d.email || `Employee ${d.id}`;
            
            map[d.id] = {
              name: displayName,
              email: d.email,
              department: d.company || d.department || 'Unknown',
            };
            console.log(`Resolved employee ${d.id}:`, map[d.id]);
          } else {
            // Log the error for debugging
            const missingId = missingIds[index];
            console.error(`Failed to fetch employee ${missingId}:`, result.status === 'rejected' ? result.reason : 'No data returned');
            
            // Use a more generic fallback instead of mock data
            map[missingId] = {
              name: `Employee ${missingId}`,
              email: `employee${missingId}@company.com`,
              department: 'Unknown',
            };
            console.log(`Using fallback for employee ${missingId}:`, map[missingId]);
          }
        });
      }
      
      console.log('Final employee map:', map);
      setEmployees(map);
    } catch (e: any) {
      console.error('Error loading data:', e);
      toast({ title: 'Error loading data', description: 'Some data may not be available', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when payment confirmation is happening
  useEffect(() => {
    if (isConfirming) {
      // Refresh data after a short delay to allow backend processing
      const timer = setTimeout(() => {
        loadData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return payrolls.filter(p => {
      const emp = employees[p.employee];
      const matchesName = lower === '' || (emp?.name || '').toLowerCase().includes(lower) || (emp?.email || '').toLowerCase().includes(lower);
      const matchesStatus = status === 'ALL' || p.payment_status === status;
      const matchesMonth = month === '' || (p.period_end && p.period_end.startsWith(month));
      return matchesName && matchesStatus && matchesMonth;
    });
  }, [payrolls, employees, search, status, month]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payrolls</h1>
            <p className="text-muted-foreground">Manage salary calculations and disbursements</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option>December 2024</option>
              <option>November 2024</option>
              <option>October 2024</option>
            </select>
            <Button onClick={handlePreparePayroll} disabled={loading} className="cursor-pointer">
              <RefreshCw className="w-4 h-4 mr-2" />
              Prepare Payroll
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="flex">
              <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
              <div className="flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2">
                  <div className="text-xl font-semibold">{totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">Active employees</p>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="flex">
              <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
              <div className="flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
                  <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2">
                  <div className="text-xl font-semibold">${totalPayroll.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="flex">
              <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
              <div className="flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2">
                  <div className="text-xl font-semibold">{pendingEmployees}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="flex">
              <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
              <div className="flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2">
                  <div className="text-xl font-semibold">{approvedEmployees}</div>
                  <p className="text-xs text-muted-foreground">Ready for disbursement</p>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Payrolls</TabsTrigger>
            <TabsTrigger value="employee-list">Employees</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payroll Progress */}
              <Card className="transition-transform transform hover:-translate-y-0.5 hover:shadow-lg overflow-hidden rounded-lg border border-gray-50">
                <div className="flex">
                  <div className="w-0.5 bg-gradient-to-b from-[#6C63FF]/60 to-[#FF6B6B]/60" />
                  <div className="flex-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calculator className="w-5 h-5" />
                        Payroll Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 py-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-sm">Salary Calculation</span>
                          <span className="text-green-600 font-medium">Completed</span>
                        </div>
                        <Progress value={100} className="h-2" />

                        <div className="flex justify-between text-sm">
                          <span className="text-sm">Tax Deductions</span>
                          <span className="text-green-600 font-medium">Completed</span>
                        </div>
                        <Progress value={100} className="h-2" />

                        <div className="flex justify-between text-sm">
                          <span className="text-sm">Approval Process</span>
                          <span className="text-yellow-600 font-medium">{approvedEmployees}/{totalEmployees}</span>
                        </div>
                        <Progress value={(approvedEmployees / totalEmployees) * 100 || 0} className="h-2" />

                        <div className="flex justify-between text-sm">
                          <span className="text-sm">Disbursement</span>
                          <span className="text-gray-600 font-medium">Pending</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="transition-transform transform hover:-translate-y-0.5 hover:shadow-lg overflow-hidden rounded-lg border border-gray-50">
                <div className="flex">
                  <div className="w-0.5 bg-gradient-to-b from-[#6C63FF]/60 to-[#FF6B6B]/60" />
                  <div className="flex-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Banknote className="w-5 h-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 py-2">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={handleDownloadAllPayslips}
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All Payslips
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={handlePreviewPayrollRun}
                        disabled={loading}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Payroll Run
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={handleGenerateReports}
                        disabled={loading}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Generate Reports
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={handleViewDiscrepancies}
                        disabled={loading}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        View Discrepancies
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <CardTitle className="text-xl">Payrolls</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" />
                      <input
                        placeholder="Search by employee name"
                        className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="FAILED">Failed</option>
                    </select>
                    <input
                      type="month"
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Select All */}
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === totalEmployees && totalEmployees > 0}
                      onChange={handleSelectAll}
                      className="rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

              <div className="overflow-x-auto rounded-xl border shadow-sm">
                <table className="w-full min-w-[1400px] table-fixed">
                  <thead className="sticky top-0 z-10 text-white">
                    <tr className="bg-gradient-to-r from-purple-600 to-purple-700">
                      <th className="w-12 px-2 py-4">
                        <input type="checkbox" className="rounded border-white/30 text-white focus:ring-white/50 cursor-pointer" disabled />
                      </th>
                      <th className="w-[260px] text-left px-4 py-4 text-sm font-semibold">Employee</th>
                      <th className="w-[220px] text-left px-4 py-4 text-sm font-semibold">Period</th>
                      <th className="w-[120px] text-right px-4 py-4 text-sm font-semibold">Gross</th>
                      <th className="w-[120px] text-right px-4 py-4 text-sm font-semibold">Tax</th>
                      <th className="w-[120px] text-right px-4 py-4 text-sm font-semibold">Statutory</th>
                      <th className="w-[120px] text-right px-4 py-4 text-sm font-semibold">Deductions</th>
                      <th className="w-[120px] text-right px-4 py-4 text-sm font-semibold">Net</th>
                      <th className="w-[140px] text-center px-4 py-4 text-sm font-semibold">Status</th>
                      <th className="w-[160px] text-center px-4 py-4 text-sm font-semibold">Paid On</th>
                      <th className="w-[180px] text-center px-4 py-4 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                          Loading payroll data...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">No payroll records found</td>
                      </tr>
                    ) : (
                      filtered.map((p, idx) => {
                        const emp = employees[p.employee];
                        const name = emp?.name || `Employee ${p.employee}`;
                        const dept = emp?.department || 'Unknown';
                        const slip = payslips.find(ps => ps.payroll === p.id);
                        const isSelected = selectedEmployees.includes(p.employee);

                        return (
                          <tr
                            key={p.id}
                            className={`transition-all duration-200 hover:bg-purple-50 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } ${isSelected ? 'ring-2 ring-purple-200 bg-purple-25' : ''}`}
                          >
                            {/* Checkbox */}
                            <td className="px-2 py-3">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleEmployeeSelect(p.employee)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                />
                              </div>
                            </td>

                            {/* Employee Info */}
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate text-sm">{name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  ID: {p.employee} • {dept}
                                </div>
                              </div>
                            </td>

                            {/* Period */}
                            <td className="px-4 py-3">
                              <div className="text-gray-700 min-w-0">
                                <div className="font-medium text-xs truncate">
                                  {p.period_start} → {p.period_end}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {p.period_end
                                    ? new Date(p.period_end).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "—"}
                                </div>
                              </div>
                            </td>

                            {/* Gross Salary */}
                            <td className="px-4 py-3 text-right">
                              <div className="font-semibold text-green-700 text-xs">${Number(p.gross_salary || 0).toLocaleString()}</div>
                            </td>

                            {/* Tax */}
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-red-600 text-xs">${Number(p.tax_amount || 0).toLocaleString()}</div>
                            </td>

                            {/* Statutory Deductions */}
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-orange-500 text-xs">${Number(p.statutory_deductions || 0).toLocaleString()}</div>
                            </td>

                            {/* Deductions */}
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-orange-600 text-xs">${Number(p.total_deductions || 0).toLocaleString()}</div>
                            </td>

                            {/* Net Salary */}
                            {/** Net salary - highlight if negative and compute numeric value once */}
                            {(() => {
                              const netNum = Number(p.net_salary || 0);
                              const netClass = netNum < 0 ? 'text-red-600' : 'text-blue-700';
                              return (
                                <td className="px-4 py-3 text-right">
                                  <div className={`font-bold ${netClass} text-xs whitespace-nowrap`}>${netNum.toLocaleString()}</div>
                                  {netNum < 0 && (
                                    <div className="text-xs text-red-600 mt-1">Negative net — check salary structure</div>
                                  )}
                                </td>
                              );
                            })()}

                            {/* Status */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center">
                                {getStatusBadge(p.payment_status)}
                              </div>
                            </td>

                            {/* Paid On */}
                            <td className="px-4 py-3 text-center">
                              <div className="text-xs text-gray-600">
                                {p.paid_on ? new Date(p.paid_on).toLocaleDateString() : '—'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center items-center gap-1 whitespace-nowrap">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 w-7 p-0 hover:bg-gray-100 border-gray-200 bg-transparent flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105"
                                  onClick={() => handlePreviewPayroll(p.id)}
                                  title="Preview Payroll"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>

                                {/* Inspect JSON button removed */}

                                <Button 
                                  size="sm" 
                                  className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                  onClick={() => handleCalculatePayroll(p.id)}
                                >
                                  <Calculator className="w-3 h-3 mr-1" />
                                  Calc
                                </Button>

                                {p.payment_status === 'PENDING' ? (
                                  (() => {
                                    const netNum = Number(p.net_salary || 0);
                                    const disabled = netNum <= 0;
                                    return (
                                      <Button 
                                        size="sm" 
                                        className={`h-7 px-2 ${disabled ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'} text-xs font-medium flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95`}
                                        onClick={() => {
                                          if (disabled) {
                                            toast({ title: 'Cannot pay', description: 'Net salary is non-positive. Fix salary structure or deductions before paying.', variant: 'destructive' });
                                            return;
                                          }
                                          handlePayPayroll(p.id);
                                        }}
                                      >
                                        Pay
                                      </Button>
                                    );
                                  })()
                                ) : slip?.payslip_pdf_url ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-blue-600 hover:text-blue-700 border-blue-200 text-xs font-medium bg-transparent flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    onClick={() => window.open(slip.payslip_pdf_url, '_blank')}
                                  >
                                    PDF
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="h-7 px-2 bg-green-100 text-green-800 text-xs font-medium flex-shrink-0"
                                  >
                                    Paid
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleApprovePayroll}
                      disabled={selectedEmployees.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected ({selectedEmployees.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      className="hover:bg-gray-50 bg-transparent border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Selected
                    </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGeneratePayslips} 
                    className="hover:bg-gray-50 bg-transparent border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Selected Payslips
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBulkGeneratePayslips} 
                    className="hover:bg-gray-50 bg-transparent border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate All Payslips
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Employee Directory</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        placeholder="Search employees..."
                        className="w-72 rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-xl border overflow-hidden shadow-sm">
                    {/* Employee Table Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <div className="grid grid-cols-[1fr_200px_200px_150px_120px] gap-4 px-6 py-4 text-sm font-semibold items-center">
                        <div>Employee</div>
                        <div>Department</div>
                        <div>Email</div>
                        <div>Phone</div>
                        <div>Payroll Status</div>
                      </div>
                    </div>

                    {/* Employee Table Body */}
                    <div className="divide-y divide-gray-100">
                      {loading ? (
                        <div className="px-6 py-8 text-center text-muted-foreground">Loading employee data...</div>
                      ) : Object.entries(employees).length === 0 ? (
                        <div className="px-6 py-8 text-center text-muted-foreground">No employees found</div>
                      ) : (
                        Object.entries(employees)
                          .filter(([id, emp]) => {
                            const lower = search.trim().toLowerCase();
                            return lower === '' || 
                              emp.name.toLowerCase().includes(lower) || 
                              emp.email?.toLowerCase().includes(lower) ||
                              emp.department?.toLowerCase().includes(lower);
                          })
                          .map(([id, emp], idx) => {
                            const employeeId = Number(id);
                            const payroll = payrolls.find(p => p.employee === employeeId);
                            const status = payroll?.payment_status || 'No Payroll';
                            
                            return (
                              <div
                                key={id}
                                className={`grid grid-cols-[1fr_200px_200px_150px_120px] gap-4 px-6 py-4 text-sm items-center transition-colors hover:bg-blue-50 ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{emp.name}</div>
                                  <div className="text-xs text-gray-500">ID: {id}</div>
                                </div>

                                <div className="text-gray-600 truncate">
                                  {emp.department || 'Unknown'}
                                </div>

                                <div className="text-gray-600 truncate">
                                  {emp.email || '—'}
                                </div>

                                <div className="text-gray-600">
                                  —
                                </div>

                                <div className="flex justify-center">
                                  {status === 'PENDING' ? (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      Pending
                                    </Badge>
                                  ) : status === 'PAID' ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      Paid
                                    </Badge>
                                  ) : status === 'FAILED' ? (
                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                      Failed
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                      No Payroll
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payslip Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {payrolls.map((p) => {
                    const emp = employees[p.employee];
                    const name = emp?.name || String(p.employee);
                    const status = p.payment_status === 'PAID' ? 'approved' : 'pending';
                    const slip = payslips.find(ps => ps.payroll === p.id);
                    return (
                        <Card key={p.id} className="transition-transform transform hover:-translate-y-0.5 hover:shadow-md rounded-lg overflow-hidden border border-gray-100">
                          <div className="flex">
                            <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B] opacity-80" />
                            <div className="flex-1 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium text-sm">{name}</h3>
                                  <p className="text-xs text-muted-foreground">ID: {p.employee}</p>
                                </div>
                                {getStatusBadge(status)}
                              </div>
                              <div className="space-y-1 mb-3 text-sm">
                                <div className="flex justify-between">
                                  <span>Net Salary:</span>
                                  <span className="font-medium">${Number(p.net_salary || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Month:</span>
                                  <span className="text-sm">{new Date(p.period_end).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {slip?.payslip_pdf_url ? (
                                  <a href={slip.payslip_pdf_url} target="_blank" rel="noreferrer" className="flex-1">
                                    <Button size="sm" className="w-full text-sm py-2">
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="flex-1 text-sm py-2"
                                    onClick={async () => {
                                      if (p.payment_status !== 'PAID') {
                                        toast({ title: 'Cannot generate payslip', description: 'Payslips can only be generated for payrolls with status Paid.' });
                                        return;
                                      }
                                      try {
                                        const blob = await payrollService.downloadPayslip(p.id);
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `payslip_${p.id}.pdf`;
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                      } catch (err) {
                                        console.error('Failed to download payslip:', err);
                                        toast({ title: 'Download failed', description: 'Could not download payslip. Please try again.', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Generate & Download
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => { setPreviewPayrollId(p.id); setPreviewOpen(true); }} className="py-2">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );})}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="transition-transform transform hover:-translate-y-0.5 hover:shadow-md rounded-lg overflow-hidden border border-gray-100">
                <div className="flex">
                  <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B] opacity-80" />
                  <div className="flex-1 p-4">
                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-base">Payroll Summary Report</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Total Gross Salary</span>
                          <span className="font-medium">${payrolls.reduce((s, p) => s + Number(p.gross_salary || 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Tax Amount</span>
                          <span className="font-medium">${payrolls.reduce((s, p) => s + Number(p.tax_amount || 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Statutory Deductions</span>
                          <span className="font-medium">${payrolls.reduce((s, p) => s + Number(p.statutory_deductions || 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Deductions</span>
                          <span className="font-medium">${payrolls.reduce((s, p) => s + Number(p.total_deductions || 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Net Payroll</span>
                          <span className="font-bold">${totalPayroll.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>

              <Card className="transition-transform transform hover:-translate-y-0.5 hover:shadow-md rounded-lg overflow-hidden border border-gray-100">
                <div className="flex">
                  <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B] opacity-80" />
                  <div className="flex-1 p-4">
                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-base">Department Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-3 text-sm">
                        {Array.from(new Set(Object.values(employees).map(e => e.department || 'Unknown'))).map(dept => {
                          const ids = Object.entries(employees).filter(([, v]) => (v.department || 'Unknown') === dept).map(([k]) => Number(k));
                          const deptTotal = payrolls.filter(p => ids.includes(p.employee)).reduce((s, p) => s + Number(p.net_salary || 0), 0);
                          const deptCount = payrolls.filter(p => ids.includes(p.employee)).length;
                          return (
                            <div key={dept} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                              <div>
                                <span className="font-medium">{dept}</span>
                                <span className="text-sm text-gray-500 ml-2">({deptCount} employees)</span>
                              </div>
                              <span className="font-medium">${deptTotal.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50">
                      <span className="font-medium text-yellow-800">Pending Payments</span>
                      <span className="font-bold text-yellow-800">{pendingEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                      <span className="font-medium text-green-800">Completed Payments</span>
                      <span className="font-bold text-green-800">{approvedEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                      <span className="font-medium text-red-800">Failed Payments</span>
                      <span className="font-bold text-red-800">{payrolls.filter(p => p.payment_status === 'FAILED').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications dropdown moved to topbar; card removed per design */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <PayrollPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        payrollId={previewPayrollId}
        payrollData={previewPayrollId ? getPayrollData(previewPayrollId) : null}
        onRecalculate={async () => { await loadData(); }}
      />

      {/* Inspect dialog removed per UX decision */}
    </DashboardLayout>
  );
};

export default PayrollPage;
