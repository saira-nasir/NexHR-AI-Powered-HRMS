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
} from '@/components/financeDashboard';

const FinanceDashboard: React.FC = () => {
  // Mock data
  const payrollData = [
    { month: "Jan", amount: 125000, employees: 45 },
    { month: "Feb", amount: 132000, employees: 48 },
    { month: "Mar", amount: 128000, employees: 47 },
    { month: "Apr", amount: 145000, employees: 52 },
    { month: "May", amount: 158000, employees: 55 },
    { month: "Jun", amount: 162000, employees: 58 },
  ];

  const taxCompliance = [
    { name: "Compliant", value: 85, color: "#10b981" },
    { name: "Pending", value: 12, color: "#f59e0b" },
    { name: "Issues", value: 3, color: "#ef4444" },
  ];

  const recentDisbursements = [
    { employee: "John Smith", amount: 5500, status: "Completed" as const, date: "2024-01-15" },
    { employee: "Sarah Johnson", amount: 6200, status: "Completed" as const, date: "2024-01-15" },
    { employee: "Mike Chen", amount: 1200, status: "Pending" as const, date: "2024-01-16" },
    { employee: "Emily Davis", amount: 4800, status: "Processing" as const, date: "2024-01-16" },
  ];

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
          <TotalPayrollCard amount="$162,000" percentageChange="+12.5%" />
          <ActiveEmployeesCard count={58} newHires={3} />
          <TaxComplianceCard percentage={85} pendingReview={15} />
          <PendingDisbursementsCard count={12} totalAmount="$45,200" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PayrollTrendsChart data={payrollData} />
              <TaxComplianceChart data={taxCompliance} />
            </div>

            <RecentDisbursementsCard disbursements={recentDisbursements} />
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Salary Calculation</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Calculate monthly wages based on attendance and leave records for all employees</p>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
                    Calculate Salary
                  </Button>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-primary transition-colors">Payslip Generation</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Generate and download employee payslips with detailed breakdown</p>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md">
                    Generate Payslips
                  </Button>
                </div>
              </div>
            </div>
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
