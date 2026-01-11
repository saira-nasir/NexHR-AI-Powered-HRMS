import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Payslip {
  id: number;
  // For compatibility with older payloads we keep several optional fields
  period_start?: string | null;
  period_end?: string | null;
  net_salary?: number | null;
  payslip_pdf_url?: string | null;
  payroll?: number | null;
  issued_on?: string | null;
  // New API fields
  title?: string;
  period?: string; // human-friendly period string returned by new endpoint
  pdf_url?: string | null; // alias for payslip_pdf_url from new endpoint
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

  // Get backend base URL (without /api) for constructing full PDF URLs
  const getBackendBaseUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    // Remove /api suffix if present
    return apiUrl.replace(/\/api\/?$/, '');
  }, []);

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
      }

      // New API: GET /payroll/payslips/user-last-12-months/
      let payslipsData: Payslip[] = [];
      let lastError: Error | null = null;
      try {
        const userId = getUserId();
        const query = userId ? `?user_id=${userId}` : '';
        const response = await apiGet(`/payroll/payslips/user-last-12-months/${query}`);

        const results = response?.results || response || [];

        // Map new API shape to our Payslip interface
        payslipsData = (Array.isArray(results) ? results : []).map((r: any) => ({
          id: r.payroll_id || r.id,
          title: r.title,
          period: r.period,
          pdf_url: r.pdf_url || r.payslip_pdf_url || null,
          payslip_pdf_url: r.pdf_url || r.payslip_pdf_url || null,
          payroll: r.payroll_id || r.payroll || null,
        }));
      } catch (err) {
        lastError = err as Error;
      }

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
              const hasPeriod = Boolean(
                payslip.period ||
                ((payslip.period_start || payslip.issued_on) && (payslip.period_end || payslip.issued_on))
              );
              
              if (!hasId) {
                console.warn('Payslip missing ID:', payslip);
                return null;
              }
              
              if (!hasPeriod) {
                console.warn('Payslip missing period data:', payslip);
                return null;
              }

              // Use available date fields if provided; otherwise fallback to title/period string
              const startDate = payslip.period_start ? new Date(payslip.period_start) :
                               payslip.issued_on ? new Date(payslip.issued_on) : null;
              const endDate = payslip.period_end ? new Date(payslip.period_end) :
                             payslip.issued_on ? new Date(payslip.issued_on) : null;
              const hasNetSalary = payslip.net_salary !== undefined && payslip.net_salary !== null && !Number.isNaN(Number(payslip.net_salary));
              const netSalary = hasNetSalary ? Number(payslip.net_salary) : null;

              // Format filename: prefer month-year when date available, otherwise fallback to id
              const monthYear = startDate ? startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
              const filename = startDate
                ? `payslip_${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_').toLowerCase()}.pdf`
                : `payslip_${payslip.id || payslip.payroll || 'unknown'}.pdf`;

              // Construct full PDF URL from new `pdf_url` or legacy `payslip_pdf_url`
              const getPdfUrl = (): string | null => {
                const pdfPath = payslip.pdf_url || payslip.payslip_pdf_url;
                if (!pdfPath) return null;

                const backendBaseUrl = getBackendBaseUrl();
                const pdfUrl = pdfPath;
                if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) return pdfUrl;
                if (pdfUrl.startsWith('/')) return `${backendBaseUrl}${pdfUrl}`;
                return `${backendBaseUrl}/${pdfUrl}`;
              };

              const fullPdfUrl = getPdfUrl();
              const hasPdfUrl = !!fullPdfUrl;

              // Download handler - simple link approach
              const handleDownload = () => {
                if (!fullPdfUrl) {
                  toast.error('Payslip PDF is not available yet. Please contact your administrator.');
                  return;
                }

                // Open in new tab for download
                window.open(fullPdfUrl, '_blank');
              };

              return (
                <Card key={payslip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            {payslip.title || (monthYear ? `Payslip - ${monthYear}` : `Payslip ${payslip.id}`)}
                          </CardTitle>
                          <CardDescription>
                            {payslip.period || (startDate && endDate ? `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` : 'Period information not available')}
                          </CardDescription>
                        </div>
                      </div>
                      {netSalary !== null && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Net Salary</p>
                          <p className="text-lg font-semibold text-primary">₨{netSalary.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasPdfUrl ? (
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="w-full sm:w-auto"
                        asChild
                      >
                        <a href={fullPdfUrl || '#'} download={filename} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        PDF not available yet. Payslip will be generated once payment is confirmed.
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
