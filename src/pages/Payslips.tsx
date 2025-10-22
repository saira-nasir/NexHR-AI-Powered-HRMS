import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Payslip {
  id: number;
  period_start: string;
  period_end: string;
  net_salary: number;
  payslip_pdf_url?: string;
  payroll?: number;
  issued_on?: string;
}

interface ApiResponse {
  results?: Payslip[];
  data?: Payslip[];
}

const Payslips: React.FC = () => {
  // console.log('Payslips component rendering...');
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  // Decode user id from JWT access token with better error handling
  const getUserId = useCallback((): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return null;
      }
      
      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const userId = payload.user_id || payload.id || payload.sub || null;
      
      if (!userId) {
        console.warn('No user ID found in token payload');
        return null;
      }
      
      return Number(userId);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }, []);

  const fetchPayslips = useCallback(async (isRetry = false) => {
    try {
      setError(null);
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        // console.log(`🔄 Retry attempt ${retryCount + 1}...`);
      }

      const employeeId = getUserId();
      // console.log('🔍 Fetching payslips for employee ID:', employeeId);
      
      let data: Payslip[] | null = null;
      let lastError: Error | null = null;
      
      // Approach 1: Try with employee filter first (most likely to work)
      if (employeeId) {
        try {
          // console.log('🔄 Trying payslips with employee filter...');
          const response = await apiGet(`/payroll/payslips/?employee=${employeeId}`);
          // console.log('✅ Payslips with employee filter:', response);
          
          if (response && (Array.isArray(response) || response.results || response.data)) {
            data = Array.isArray(response) ? response : (response.results || response.data || []);
            // Debug: Uncomment for development debugging
            // console.log('📊 Parsed payslips data structure:', {
            //   isArray: Array.isArray(response),
            //   hasResults: !!response.results,
            //   hasData: !!response.data,
            //   dataLength: data.length,
            //   firstItem: data[0]
            // });
          }
        } catch (error1) {
          // console.log('❌ Employee filter failed:', error1);
          lastError = error1 as Error;
        }
      }
      
      // Approach 2: Try all payslips
      if (!data || data.length === 0) {
        try {
          // console.log('🔄 Trying all payslips...');
          const response = await apiGet('/payroll/payslips/');
          // console.log('✅ All payslips data:', response);
          
          if (response && (Array.isArray(response) || response.results || response.data)) {
            data = Array.isArray(response) ? response : (response.results || response.data || []);
          }
        } catch (error2) {
          // console.log('❌ All payslips failed:', error2);
          lastError = error2 as Error;
        }
      }
      
      // Approach 3: Try payrolls endpoint (might contain payslip info)
      if (!data || data.length === 0) {
        try {
          // console.log('🔄 Trying payrolls endpoint for payslips...');
          const payrollsData = await apiGet('/payroll/payrolls/');
          // console.log('✅ Payrolls data for payslips:', payrollsData);
          
          // Convert payrolls to payslips format if needed
          if (payrollsData && (Array.isArray(payrollsData) ? payrollsData.length > 0 : payrollsData.results?.length > 0)) {
            const payrolls = Array.isArray(payrollsData) ? payrollsData : (payrollsData.results || []);
            data = payrolls.map((payroll: any) => ({
              id: payroll.id,
              period_start: payroll.period_start,
              period_end: payroll.period_end,
              net_salary: Number(payroll.net_salary) || 0,
              payslip_pdf_url: payroll.payslip_pdf_url,
              payroll: payroll.id,
              issued_on: payroll.paid_on
            }));
            // console.log('✅ Converted payrolls to payslips format:', data);
          }
        } catch (error3) {
          // console.log('❌ Payrolls for payslips failed:', error3);
          lastError = error3 as Error;
        }
      }
      
      // Validate and set data
      const payslipsData = data || [];
      
      // Debug: Uncomment for development debugging
      // console.log('🔍 Final payslips data before setting state:', payslipsData);
      // console.log('🔍 Data type:', typeof payslipsData, 'Length:', payslipsData.length);
      
      setPayslips(payslipsData);
      
      if (payslipsData.length === 0) {
        if (lastError) {
          const errorMessage = `Failed to fetch payslips: ${lastError.message}`;
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const noDataMessage = 'No payslips found for your account. Payslips will appear here once they are generated.';
          setError(noDataMessage);
          toast.info(noDataMessage);
        }
      } else {
        toast.success(`Successfully loaded ${payslipsData.length} payslip(s)`);
      }
    } catch (error) {
      console.error('❌ Error fetching payslips:', error);
      const errorMessage = `Failed to fetch payslips: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      setPayslips([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [getUserId, retryCount]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleRetry = useCallback(() => {
    // Clear any existing timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    setLoading(true);
    fetchPayslips(true);
  }, [fetchPayslips, retryTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isRetrying ? 'Retrying...' : 'Loading payslips...'}
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">Retry attempt {retryCount}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payslips</h1>
            <p className="text-muted-foreground">Download and view your payslips</p>
          </div>
          {error && (
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRetrying ? 'Retrying...' : 'Refresh'}
            </Button>
          )}
        </div>

        {error && payslips.length === 0 ? (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Unable to Load Payslips</p>
              <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
              {payslips.map((payslip) => {
              // Enhanced validation with better logging
              // Debug: Uncomment for development debugging
              // console.log('Processing payslip:', payslip);
              
              // More flexible validation - check for essential fields
              const hasId = payslip.id !== undefined && payslip.id !== null;
              const hasPeriod = (payslip.period_start || payslip.issued_on) && (payslip.period_end || payslip.issued_on);
              
              if (!hasId) {
                console.warn('Payslip missing ID:', payslip);
                return null;
              }
              
              if (!hasPeriod) {
                console.warn('Payslip missing period data:', payslip);
                return null;
              }

              // Use available date fields
              const startDate = payslip.period_start ? new Date(payslip.period_start) : 
                               payslip.issued_on ? new Date(payslip.issued_on) : new Date();
              const endDate = payslip.period_end ? new Date(payslip.period_end) : 
                            payslip.issued_on ? new Date(payslip.issued_on) : new Date();
              const hasNetSalary = payslip.net_salary !== undefined && payslip.net_salary !== null && !Number.isNaN(Number(payslip.net_salary));
              const netSalary = hasNetSalary ? Number(payslip.net_salary) : null;

              return (
                <Card key={payslip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            Payslip - {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </CardTitle>
                          <CardDescription>
                            Period: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {/* Net Pay display intentionally removed as salary details are present within the payslip */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {payslip.payslip_pdf_url ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <a href={payslip.payslip_pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        PDF not available yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
              })}

            {payslips.length === 0 && !error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">No payslips found</p>
                  <p className="text-sm text-muted-foreground">Your payslips will appear here once they are generated</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Payslips;
