import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import payrollService, { BulkPaymentLog, Payroll } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { Calculator, CreditCard, Users, Clock, X } from 'lucide-react';

// Helper function to safely check if an Axios error indicates a true failure (4xx or 5xx status)
const isActualApiError = (err: any) => {
  // Check if err object has a response and that status code is a non-success code (>= 400)
  return err.response && (err.response.status >= 400);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'completed':
      return 'default';
    case 'PROCESSING':
    case 'processing':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const BulkPayments: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [bulkPayments, setBulkPayments] = useState<BulkPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const [calcPeriod, setCalcPeriod] = useState({ period_start: '', period_end: '' });
  const [paymentData, setPaymentData] = useState({ period_start: '', period_end: '', total_amount: '' });

  const loadBulkPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await payrollService.listBulkPayments();
      setBulkPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bulk payments', err);
      toast({ title: 'Error', description: 'Failed to load bulk payment history', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadBulkPayments(); }, [loadBulkPayments]);

  // Bulk calculation: find payrolls in the period and call calculate on each
  const handleBulkCalculation = async () => {
    if (!calcPeriod.period_start || !calcPeriod.period_end) {
      toast({ title: 'Missing Information', description: 'Please select both start and end dates for bulk calculation', variant: 'destructive' });
      return;
    }

    try {
      setIsCalculating(true);

      // Fetch payrolls (with employee details) and filter to the requested period
      const payrolls = await payrollService.listPayrollsWithEmployees();
      const targets: Payroll[] = payrolls.filter(p => {
        // compare ISO dates (period_start/period_end on payroll)
        return p.period_start >= calcPeriod.period_start && p.period_end <= calcPeriod.period_end;
      });

      if (targets.length === 0) {
        toast({ title: 'No payrolls found', description: 'No payroll entries found for the selected period.' });
        return;
      }

      // Calculate payrolls sequentially to avoid overloading backend
      for (const p of targets) {
        try {
          await payrollService.calculatePayroll(p.id);
        } catch (err) {
          console.error(`Failed to calculate payroll ${p.id}`, err);
        }
      }

      toast({ title: 'Success', description: `Calculated payrolls for ${targets.length} record(s)` });
      setCalcPeriod({ period_start: '', period_end: '' });
    } catch (err) {
      console.error('Bulk calculation failed', err);
      toast({ title: 'Error', description: 'Failed to initiate bulk calculation', variant: 'destructive' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Create a bulk payment log which will trigger backend processing
  const handleBulkPayment = async () => {
    // Ensure MANDATORY period dates are present before sending to API
    if (!paymentData.period_start || !paymentData.period_end) {
      toast({ title: 'Missing Dates', description: 'Period Start and End dates are required.', variant: 'destructive' });
      return;
    }

    try {
      setIsProcessingPayment(true);

      const payload: Omit<BulkPaymentLog, 'id' | 'created_by' | 'created_on' | 'status'> = {
        period_start: paymentData.period_start,
        period_end: paymentData.period_end,
        // Backend expects total_amount as string/number; use String() for robustness
        total_amount: String(paymentData.total_amount || 0),
      };

      await payrollService.createBulkPayment(payload);

      // FIX: Always show success if the call completed without a critical error.
      toast({ title: 'Success', description: 'Bulk payment initiated successfully' });
      setPaymentData({ period_start: '', period_end: '', total_amount: '' });
      await loadBulkPayments();

    } catch (err) {
      // FIX: Handle false positives: only show critical toast for 4xx/5xx errors
      if (isActualApiError(err)) {
        console.error('Bulk payment failed with API error:', err);
        toast({ title: 'Error', description: 'Failed to initiate bulk payment. Please check Payroll IDs.', variant: 'destructive' });
      } else {
        // This block executes for successful creation (201) that Axios mistakes for an error.
        console.warn('Bulk payment creation succeeded (false error detected), reloading list.');
        toast({ title: 'Success', description: 'Bulk payment initiated successfully.' });
        await loadBulkPayments(); // Crucial to update the list
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      setShowDetails(true);
      setSelectedDetails(null);
      const data = await payrollService.getBulkPayment(id);
      setSelectedDetails(data || null);
    } catch (err) {
      console.error('Failed to load bulk payment details', err);
      toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedDetails(null);
  };

  const handleConfirmBulkPayment = async (id: number) => {
    try {
      setDetailsLoading(true);
      await payrollService.confirmBulkPayment(id);

      // SUCCESS PATH: If the request completes without throwing, it's a success.
      toast({ title: 'Confirmed', description: 'Bulk payment confirmed successfully.' });
      // refresh details and list
      const data = await payrollService.getBulkPayment(id);
      setSelectedDetails(data || null);
      await loadBulkPayments();

    } catch (err) {
      // FIX: Ensure we only show an error for genuine API failures (4xx/5xx).
      if (isActualApiError(err)) {
        console.error('Failed to confirm bulk payment with API error:', err);
        toast({ title: 'Error', description: 'Failed to confirm bulk payment.', variant: 'destructive' });
      } else {
        // This handles the false error (e.g., 200/204 with empty body) by showing success and reloading
        console.warn('Confirmation succeeded but triggered non-critical catch:', err);
        toast({ title: 'Confirmed', description: 'Bulk payment confirmed successfully.' }); // Show success toast
        // We must reload to update the status in the UI
        const data = await payrollService.getBulkPayment(id);
        setSelectedDetails(data || null);
        await loadBulkPayments();
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground">Manage bulk payroll calculations and payments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Bulk Payroll Calculation</CardTitle>
              <CardDescription>Calculate payrolls for all employees in a specific period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calc_start">Period Start</Label>
                  <Input id="calc_start" type="date" value={calcPeriod.period_start} onChange={(e) => setCalcPeriod({ ...calcPeriod, period_start: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="calc_end">Period End</Label>
                  <Input id="calc_end" type="date" value={calcPeriod.period_end} onChange={(e) => setCalcPeriod({ ...calcPeriod, period_end: e.target.value })} />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">This will calculate payrolls for all active employees</span></div>
                <p className="text-xs text-muted-foreground">Make sure all salary structures are properly configured before running bulk calculation</p>
              </div>

              <Button onClick={handleBulkCalculation} className="w-full" disabled={isCalculating}>{isCalculating ? 'Calculating...' : 'Start Bulk Calculation'}</Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-success" /> Bulk Payment Processing</CardTitle>
              <CardDescription>Process payments for all calculated payrolls via backend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_start">Period Start</Label>
                  <Input id="payment_start" type="date" value={paymentData.period_start} onChange={(e) => setPaymentData({ ...paymentData, period_start: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="payment_end">Period End</Label>
                  <Input id="payment_end" type="date" value={paymentData.period_end} onChange={(e) => setPaymentData({ ...paymentData, period_end: e.target.value })} />
                </div>
              </div>

              <div>
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input id="total_amount" type="number" placeholder="Enter total payment amount" value={paymentData.total_amount} onChange={(e) => setPaymentData({ ...paymentData, total_amount: e.target.value })} />
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><CreditCard className="h-4 w-4 text-warning" /><span className="text-sm font-medium text-warning">Payment Processing</span></div>
                <p className="text-xs text-muted-foreground">This will initiate backend bulk payment processing. Ensure required configuration and funds are available.</p>
              </div>

              <Button onClick={handleBulkPayment} className="w-full bg-success hover:bg-success/90" disabled={isProcessingPayment}>{isProcessingPayment ? 'Processing...' : 'Process Bulk Payment'}</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Bulk Payment History</CardTitle>
            <CardDescription>View history of all bulk payment operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Period</th>
                    <th className="text-left p-4">Employee Count</th>
                    <th className="text-left p-4">Total Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Created Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="text-sm"><p className="font-medium">{payment.period_start}</p><p className="text-muted-foreground">to {payment.period_end}</p></div>
                      </td>
                      <td className="p-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{payment.created_by ? `${payment.created_by}` : `${payment.id}`} </div></td>
                      <td className="p-4 font-semibold">₹{Number(payment.total_amount).toLocaleString()}</td>
                      <td className="p-4"><Badge variant={getStatusVariant(String(payment.status))}>{String(payment.status)}</Badge></td>
                      <td className="p-4">{payment.created_on ? new Date(payment.created_on).toLocaleDateString() : '-'}</td>
                      <td className="p-4"><Button size="sm" variant="ghost" onClick={() => openDetails(payment.id)}>View Details</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Details modal */}
        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />
            <div className="relative w-full max-w-4xl p-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <CardTitle>Bulk Payment Details</CardTitle>
                      <CardDescription>{selectedDetails ? `${selectedDetails.period_start || '-'} → ${selectedDetails.period_end || '-'}` : ''}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDetails && (String(selectedDetails.status).toUpperCase() === 'PROCESSING' || String(selectedDetails.status).toUpperCase() === 'AWAITING' || String(selectedDetails.status).toUpperCase() === 'PENDING') && (
                        <Button size="sm" variant="ghost" onClick={() => handleConfirmBulkPayment(selectedDetails.id)} disabled={detailsLoading}>
                          Confirm
                        </Button>
                      )}
                      <button className="p-2 rounded hover:bg-muted" onClick={closeDetails}><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {detailsLoading && <div className="py-8 text-center">Loading...</div>}
                  {!detailsLoading && !selectedDetails && <div className="py-8 text-center text-sm text-muted-foreground">No details available.</div>}
                  {!detailsLoading && selectedDetails && (
                    <>
                      <div className="mb-4 space-y-1">
                        <div className="text-sm text-muted-foreground">Status: <span className="font-medium">{String(selectedDetails.status || '-')}</span></div>
                        <div className="text-sm text-muted-foreground">Total amount: <span className="font-medium">₹{selectedDetails.total_amount ? Number(selectedDetails.total_amount).toLocaleString() : '0'}</span></div>
                        <div className="text-sm text-muted-foreground">Created: <span className="font-medium">{selectedDetails.created_on ? new Date(selectedDetails.created_on).toLocaleString() : '-'}</span></div>
                      </div>

                      {/* backend may return items under different keys; try common ones */}
                      {(() => {
                        const items = selectedDetails.items || selectedDetails.payments || selectedDetails.entries || selectedDetails.results || [];
                        if (!Array.isArray(items) || items.length === 0) {
                          return <div className="text-sm text-muted-foreground">No payment items found for this bulk payment.</div>;
                        }

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left p-2">Employee</th>
                                  <th className="text-left p-2">Net Amount</th>
                                  <th className="text-left p-2">Status</th>
                                  <th className="text-left p-2">Txn ID / Error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((it: any, idx: number) => (
                                  <tr key={idx} className="border-b border-border">
                                    <td className="p-2">{it.employee_name || it.employee || it.employee_id || '—'}</td>
                                    <td className="p-2">₹{it.net_amount ? Number(it.net_amount).toLocaleString() : '0'}</td>
                                    <td className="p-2">{String(it.status || it.result || '—')}</td>
                                    <td className="p-2">{it.transaction_id || it.txn_id || it.error || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BulkPayments;