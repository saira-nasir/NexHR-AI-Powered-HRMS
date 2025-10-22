import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet } from '@/lib/api';
import payrollService from '@/services/payrollService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface SalaryStructure {
  id: number;
  employee: number;
  basic_pay: string;
  allowances: string;
  deductions: string;
  tax: string;
  effective_from: string;
  effective_to?: string | null;
}

const EmployeeSalaryStructure: React.FC = () => {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Decode user id from JWT access token
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || null;
    } catch {
      return null;
    }
  };

  const fetchSalaryStructure = async (isRetry = false) => {
    try {
      setError(null);
      if (isRetry) {
        setRetryCount(prev => prev + 1);
        // console.log(`🔄 Retry attempt ${retryCount + 1}...`);
      }

      const employeeId = getUserId();
      if (!employeeId) {
        toast.error('User not identified. Please log in again.');
        setLoading(false);
        return;
      }

      // console.log('🔍 Fetching salary structure for employee ID:', employeeId);
      // console.log('🔍 Current user token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
      
      let s = null;
      
      // Approach 1: Try to get from payrolls first (most likely to work for employees)
      try {
        // console.log('🔄 Trying payrolls endpoint first...');
        const payrollsData = await apiGet(`/payroll/payrolls/?employee=${employeeId}`);
        // console.log('✅ Payrolls data:', payrollsData);
        
        if (payrollsData && (Array.isArray(payrollsData) ? payrollsData.length > 0 : payrollsData.results?.length > 0)) {
          const payrolls = Array.isArray(payrollsData) ? payrollsData : (payrollsData.results || []);
          const payroll = payrolls[0];
          // console.log('📊 Found payroll:', payroll);
          
          if (payroll) {
            // Check if payroll has salary structure data directly
            if (payroll.basic_pay || payroll.allowances || payroll.deductions || payroll.tax) {
              // console.log('🔄 Using payroll data directly as salary structure...');
              s = {
                id: payroll.salary_structure || payroll.id || 0,
                employee: payroll.employee,
                basic_pay: payroll.basic_pay?.toString() || '0',
                allowances: payroll.allowances?.toString() || '0',
                deductions: payroll.deductions?.toString() || '0',
                tax: payroll.tax?.toString() || '0',
                effective_from: payroll.period_start || new Date().toISOString(),
                effective_to: payroll.period_end || null,
              };
              // console.log('✅ Created salary structure from payroll data:', s);
            } else if (payroll.salary_structure) {
              // Try to get the detailed salary structure from the payroll
              try {
                // console.log('🔄 Fetching detailed salary structure from payroll...');
                const salaryStructureData = await payrollService.getSalaryStructure(payroll.salary_structure);
                s = salaryStructureData;
                // console.log('✅ Found detailed salary structure:', s);
              } catch (error3) {
                // console.log('❌ Could not fetch detailed salary structure:', error3);
                // Fallback to basic payroll data
                s = {
                  id: payroll.salary_structure || payroll.id || 0,
                  employee: payroll.employee,
                  basic_pay: '0',
                  allowances: '0',
                  deductions: '0',
                  tax: '0',
                  effective_from: payroll.period_start || new Date().toISOString(),
                  effective_to: payroll.period_end || null,
                };
                // console.log('✅ Using fallback salary structure:', s);
              }
            }
          }
        }
      } catch (error2) {
        // console.log('❌ Payrolls endpoint failed:', error2);
      }
      
      // Approach 2: Try using payrollService (only if payrolls failed)
      if (!s) {
        try {
          // console.log('🔄 Trying payrollService.listSalaryStructures...');
          const data1 = await payrollService.listSalaryStructures();
          // console.log('✅ Salary structures from payrollService:', data1);
          
          if (data1 && data1.length > 0) {
            s = data1.find((structure: any) => {
              // console.log('🔍 Checking structure:', structure, 'employee field:', structure.employee, 'looking for:', employeeId);
              return structure.employee === employeeId || structure.employee === Number(employeeId);
            });
            
            if (s) {
              // console.log('✅ Found via payrollService:', s);
            }
          }
        } catch (error1) {
          // console.log('❌ PayrollService failed (403 expected for employees):', error1);
        }
      }
      
      // Approach 3: Try direct API call as last resort
      if (!s) {
        try {
          // console.log('🔄 Trying direct API call as last resort...');
          const data3 = await apiGet('/payroll/salary-structures/');
          // console.log('✅ All salary structures:', data3);
          
          const structures3 = Array.isArray(data3) ? data3 : (data3.results || []);
          s = structures3.find((structure: any) => {
            // console.log('🔍 Checking structure:', structure, 'employee field:', structure.employee, 'looking for:', employeeId);
            return structure.employee === employeeId || structure.employee === Number(employeeId);
          });
          
          if (s) {
            // console.log('✅ Found via direct API:', s);
          }
        } catch (error3) {
          // console.log('❌ Direct API failed (403 expected for employees):', error3);
        }
      }
      
      if (s) {
        // console.log('✅ Found salary structure:', s);
        setStructure({
          id: s.id,
          employee: s.employee,
          basic_pay: s.basic_pay,
          allowances: s.allowances,
          deductions: s.deductions,
          tax: s.tax,
          effective_from: s.effective_from,
          effective_to: s.effective_to,
        });
        setError(null);
      } else {
        // console.log('❌ No salary structure found');
        setStructure(null);
        setError('No salary structure found for your account. Please contact HR to set up your salary structure.');
      }
    } catch (error) {
      // console.error('❌ Error fetching salary structure:', error);
      setError('Failed to fetch salary structure. Please try again.');
      setStructure(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStructure();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    fetchSalaryStructure(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading salary structure...</p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">Retry attempt {retryCount}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !structure) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salary Structure</h1>
            <p className="text-muted-foreground">Your current salary breakdown</p>
          </div>
          
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Unable to Load Salary Structure</p>
              <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!structure) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salary Structure</h1>
            <p className="text-muted-foreground">Your current salary breakdown</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No salary structure found</p>
              <p className="text-sm text-muted-foreground">Please contact HR to set up your salary structure</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Convert string values to numbers for calculations and display
  const basicPayNum = Number(structure.basic_pay);
  const allowancesNum = Number(structure.allowances);
  const deductionsNum = Number(structure.deductions);
  const taxNum = Number(structure.tax);

  const grossSalary = basicPayNum + allowancesNum;
  const taxAmount = taxNum;
  const netSalary = grossSalary - deductionsNum - taxAmount;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Salary Structure</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your current salary breakdown</p>
          </div>
          {error && (
            <Button onClick={handleRetry} variant="outline" size="sm" className="flex items-center gap-2 self-start sm:self-auto">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Retry</span>
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Basic Pay</CardTitle>
                <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
              </div>
              <CardDescription className="text-xs">Base salary</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-success break-words">₨{basicPayNum.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Allowances</CardTitle>
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              </div>
              <CardDescription className="text-xs">Additional benefits</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary break-words">₨{allowancesNum.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Deductions</CardTitle>
                <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0"></div>
              </div>
              <CardDescription className="text-xs">Total deducted</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive break-words">₨{deductionsNum.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Tax</CardTitle>
                <div className="w-2 h-2 bg-warning rounded-full flex-shrink-0"></div>
              </div>
              <CardDescription className="text-xs">Income tax</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-warning break-words">₨{taxAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 px-3 sm:px-4">
              <CardTitle className="text-base sm:text-lg">Net Salary</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your take-home amount</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4">
              <p className="text-2xl sm:text-3xl font-bold text-primary break-words">₨{netSalary.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Current period</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/10 border border-success/20 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 px-3 sm:px-4">
              <CardTitle className="text-base sm:text-lg">Gross Salary</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Before deductions</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4">
              <p className="text-2xl sm:text-3xl font-bold text-success break-words">₨{grossSalary.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Base + Allowances</p>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 px-3 sm:px-4">
            <CardTitle className="text-base sm:text-lg">Salary Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Detailed calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Basic Pay</span>
              <span className="font-medium text-foreground text-xs sm:text-sm break-words">₨{basicPayNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Allowances</span>
              <span className="font-medium text-success text-xs sm:text-sm break-words">+₨{allowancesNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs sm:text-sm font-medium text-foreground">Gross Salary</span>
              <span className="font-bold text-foreground text-xs sm:text-sm break-words">₨{grossSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Tax</span>
              <span className="font-medium text-destructive text-xs sm:text-sm break-words">-₨{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Other Deductions</span>
              <span className="font-medium text-destructive text-xs sm:text-sm break-words">-₨{deductionsNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3 sm:px-4 mt-3 sm:mt-4">
              <span className="font-bold text-foreground text-sm sm:text-base">Net Salary</span>
              <span className="text-lg sm:text-xl font-bold text-primary break-words">₨{netSalary.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 px-3 sm:px-4">
            <CardTitle className="text-base sm:text-lg">Effective Period</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-foreground ml-2 break-words">{new Date(structure.effective_from).toLocaleDateString()}</span>
              </div>
              {structure.effective_to && (
                <div className="flex items-center">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium text-foreground ml-2 break-words">{new Date(structure.effective_to).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeSalaryStructure;