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
import { employeeService, Employee } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import PayrollPreviewModal from '@/components/financeDashboard/PayrollPreviewModal';
import { NotificationsCard } from '@/components/financeDashboard';

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayrollId, setPreviewPayrollId] = useState<number | null>(null);
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
      if (session.url) window.location.href = session.url;
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
      if (session.url) window.location.href = session.url;
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDisbursePayroll = async () => {
    await handleApprovePayroll();
  };

  const handleGeneratePayslips = async () => {
    try {
      const targetPayrolls = payrolls.filter(p => selectedEmployees.includes(p.employee));
      if (targetPayrolls.length === 0) {
        toast({ title: 'Select employees first', description: 'Choose one or more employees to generate payslips for.' });
        return;
      }
      for (const p of targetPayrolls) {
        const blob = await payrollService.downloadPayslip(p.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${p.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      toast({ title: 'Payslips generated', description: `${targetPayrolls.length} file(s) downloaded.` });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'disbursed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Disbursed</Badge>;
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
      
      setPayrolls(pr);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payrolls</h1>
            <p className="text-muted-foreground">Manage salary calculations and disbursements</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>December 2024</option>
              <option>November 2024</option>
              <option>October 2024</option>
            </select>
            <Button onClick={handlePreparePayroll} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Prepare Payroll
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEmployees}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedEmployees}</div>
              <p className="text-xs text-muted-foreground">Ready for disbursement</p>
            </CardContent>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Payroll Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Salary Calculation</span>
                      <span className="text-green-600 font-medium">Completed</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Tax Deductions</span>
                      <span className="text-green-600 font-medium">Completed</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Approval Process</span>
                      <span className="text-yellow-600 font-medium">{approvedEmployees}/{totalEmployees}</span>
                    </div>
                    <Progress value={(approvedEmployees / totalEmployees) * 100} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Disbursement</span>
                      <span className="text-gray-600 font-medium">Pending</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download All Payslips
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Payroll Run
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    View Discrepancies
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Payrolls</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        placeholder="Search by employee name"
                        className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === totalEmployees && totalEmployees > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

              <div className="rounded-xl border overflow-hidden shadow-sm">
                {/* Table Header with gradient background */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold items-center">
                    <div className="col-span-1 flex justify-center">
                      <input type="checkbox" className="rounded border-white/30 text-white focus:ring-white/50" disabled />
                    </div>
                      <div className="col-span-2">Employee</div>
                    <div className="col-span-2">Period</div>
                    <div className="col-span-1 text-right">Gross</div>
                      <div className="col-span-1 text-right">Tax</div>
                      <div className="col-span-1 text-right">Deductions</div>
                      <div className="col-span-2 text-right">Net</div>
                    <div className="col-span-2 text-center">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100 bg-white">
                      {loading ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                          Loading payroll data...
                    </div>
                      ) : filtered.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">No payroll records found</div>
                      ) : (
                        filtered.map((p, idx) => {
                        const emp = employees[p.employee];
                          const name = emp?.name || `Employee ${p.employee}`;
                          const dept = emp?.department || 'Unknown';
                          const slip = payslips.find(ps => ps.payroll === p.id);
                          const isSelected = selectedEmployees.includes(p.employee);

                        return (
                            <div
                              key={p.id}
                              className={`grid grid-cols-12 gap-4 px-6 py-4 text-sm items-center transition-all duration-200 hover:bg-purple-50 ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } ${isSelected ? 'ring-2 ring-purple-200 bg-purple-25' : ''}`}
                            >
                              {/* Checkbox */}
                              <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                                  checked={isSelected}
                                onChange={() => handleEmployeeSelect(p.employee)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                />
                              </div>

                              {/* Employee Info */}
                              <div className="col-span-2 min-w-0">
                                <div className="font-semibold text-gray-900 truncate text-base">{name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ID: {p.employee} • {dept}
                                </div>
                              </div>

                              {/* Period */}
                              <div className="col-span-2 text-gray-700">
                                <div className="font-medium">
                                  {p.period_start} → {p.period_end}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {p.period_end
                                    ? new Date(p.period_end).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "—"}
                            </div>
                          </div>

                              {/* Gross Salary */}
                              <div className="col-span-1 text-right">
                                <div className="font-semibold text-green-700">${Number(p.gross_salary || 0).toLocaleString()}</div>
                              </div>

                              {/* Tax */}
                              <div className="col-span-1 text-right">
                                <div className="font-medium text-red-600">${Number(p.tax_amount || 0).toLocaleString()}</div>
                              </div>

                              {/* Deductions */}
                              <div className="col-span-1 text-right">
                                <div className="font-medium text-orange-600">${Number(p.total_deductions || 0).toLocaleString()}</div>
                              </div>

                              {/* Net Salary */}
                              <div className="col-span-2 text-right">
                                <div className="font-bold text-blue-700 text-base whitespace-nowrap">${Number(p.net_salary || 0).toLocaleString()}</div>
                            </div>

                              {/* Actions */}
                              <div className="col-span-2 flex justify-center items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                  className="h-8 w-8 p-0 hover:bg-gray-100 border-gray-200 bg-transparent"
                                onClick={() => handlePreviewPayroll(p.id)}
                                  title="Preview Payroll"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                                <Button 
                                  size="sm" 
                                  className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium"
                                  onClick={() => handleCalculatePayroll(p.id)}
                                >
                                  <Calculator className="w-3 h-3 mr-1" />
                                  Calc
                                </Button>

                                {p.payment_status === 'PENDING' ? (
                                <Button 
                                  size="sm" 
                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                                  onClick={() => handlePayPayroll(p.id)}
                                >
                                  Pay
                                </Button>
                                ) : slip?.payslip_pdf_url ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 text-xs font-medium bg-transparent"
                                    onClick={() => window.open(slip.payslip_pdf_url, '_blank')}
                                  >
                                    PDF
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="h-8 px-3 bg-green-100 text-green-800 text-xs font-medium"
                                  >
                                    Paid
                                  </Badge>
                              )}
                            </div>
                          </div>
                        );
                        })
                      )}
                        </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      onClick={handleApprovePayroll}
                      disabled={selectedEmployees.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected ({selectedEmployees.length})
                    </Button>
                    <Button variant="outline" className="hover:bg-gray-50 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Selected
                    </Button>
                    <Button variant="outline" onClick={handleGeneratePayslips} className="hover:bg-gray-50 bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Payslips
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
                    <Card key={p.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {p.employee}</p>
                        </div>
                        {getStatusBadge(status)}
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Net Salary:</span>
                          <span className="font-medium">${Number(p.net_salary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Month:</span>
                          <span>{new Date(p.period_end).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {slip?.payslip_pdf_url ? (
                          <a href={slip.payslip_pdf_url} target="_blank" rel="noreferrer" className="flex-1">
                            <Button size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                          </a>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={async () => {
                              const blob = await payrollService.downloadPayslip(p.id);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `payslip_${p.id}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Generate & Download
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setPreviewPayrollId(p.id); setPreviewOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );})}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Summary Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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

              <NotificationsCard />
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
    </DashboardLayout>
  );
};

export default PayrollPage;
