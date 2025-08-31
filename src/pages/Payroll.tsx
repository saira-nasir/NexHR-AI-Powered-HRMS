import React, { useState } from 'react';
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

// Mock data for payroll
const mockEmployees = [
  {
    id: 1,
    name: 'John Doe',
    employeeId: 'EMP001',
    department: 'Engineering',
    basicSalary: 5000,
    allowances: 800,
    deductions: 500,
    netSalary: 5300,
    status: 'pending',
    attendance: 22,
    totalDays: 25
  },
  {
    id: 2,
    name: 'Jane Smith',
    employeeId: 'EMP002',
    department: 'Marketing',
    basicSalary: 4500,
    allowances: 600,
    deductions: 450,
    netSalary: 4650,
    status: 'approved',
    attendance: 24,
    totalDays: 25
  },
  {
    id: 3,
    name: 'Mike Johnson',
    employeeId: 'EMP003',
    department: 'Sales',
    basicSalary: 4800,
    allowances: 700,
    deductions: 480,
    netSalary: 5020,
    status: 'pending',
    attendance: 20,
    totalDays: 25
  }
];

const PayrollPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('December 2024');
  const [payrollStatus, setPayrollStatus] = useState('preparing');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const totalEmployees = mockEmployees.length;
  const pendingEmployees = mockEmployees.filter(emp => emp.status === 'pending').length;
  const approvedEmployees = mockEmployees.filter(emp => emp.status === 'approved').length;
  const totalPayroll = mockEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);

  const handleSelectAll = () => {
    if (selectedEmployees.length === totalEmployees) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(mockEmployees.map(emp => emp.id));
    }
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handlePreparePayroll = () => {
    setPayrollStatus('preparing');
    // Mock API call
    setTimeout(() => setPayrollStatus('ready'), 2000);
  };

  const handleApprovePayroll = () => {
    setPayrollStatus('approved');
  };

  const handleDisbursePayroll = () => {
    setPayrollStatus('disbursed');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
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
            <Button onClick={handlePreparePayroll} disabled={payrollStatus === 'preparing'}>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Payroll</TabsTrigger>
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
                  <CardTitle>Employee Payroll Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === totalEmployees}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

                  {/* Employee List */}
                  <div className="space-y-3">
                    {mockEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeSelect(employee.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{employee.name}</h3>
                              <p className="text-sm text-muted-foreground">{employee.employeeId} • {employee.department}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${employee.netSalary.toLocaleString()}</p>
                              {getStatusBadge(employee.status)}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Basic:</span> ${employee.basicSalary}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Allowances:</span> ${employee.allowances}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Deductions:</span> ${employee.deductions}
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">Attendance: {employee.attendance}/{employee.totalDays} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button onClick={handleApprovePayroll} disabled={selectedEmployees.length === 0}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected ({selectedEmployees.length})
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Selected
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Payslips
                    </Button>
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
                  {mockEmployees.map((employee) => (
                    <Card key={employee.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                        </div>
                        {getStatusBadge(employee.status)}
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Net Salary:</span>
                          <span className="font-medium">${employee.netSalary}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Month:</span>
                          <span>{selectedMonth}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
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
                      <span className="font-medium">${mockEmployees.reduce((sum, emp) => sum + emp.basicSalary + emp.allowances, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions</span>
                      <span className="font-medium">${mockEmployees.reduce((sum, emp) => sum + emp.deductions, 0).toLocaleString()}</span>
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
                    {Array.from(new Set(mockEmployees.map(emp => emp.department))).map(dept => {
                      const deptEmployees = mockEmployees.filter(emp => emp.department === dept);
                      const deptTotal = deptEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);
                      return (
                        <div key={dept} className="flex justify-between items-center">
                          <span>{dept}</span>
                          <span className="font-medium">${deptTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PayrollPage;
