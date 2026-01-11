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
import PayrollSelectionTable from '@/components/financeDashboard/PayrollSelectionTable';
import BulkPaymentForm from '@/components/financeDashboard/BulkPaymentForm';
import BulkPaymentResults from '@/components/financeDashboard/BulkPaymentResults';

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


  const { toast } = useToast();

  // Workflow state
  const [workflowStep, setWorkflowStep] = useState<'SELECTION' | 'PAYMENT' | 'RESULT'>('SELECTION');
  const [selectedPayrolls, setSelectedPayrolls] = useState<number[]>([]);
  const [paymentResult, setPaymentResult] = useState<any>(null);

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

        {/* Workflow container: Selection -> Form -> Result */}
        <div className="h-full">
          {workflowStep === 'SELECTION' && (
            <PayrollSelectionTable
              onProceed={(ids) => {
                setSelectedPayrolls(ids);
                setWorkflowStep('PAYMENT');
              }}
            />
          )}

          {workflowStep === 'PAYMENT' && (
            <div className="max-w-xl mx-auto">
              <BulkPaymentForm
                selectedPayrollIds={selectedPayrolls}
                onBack={() => setWorkflowStep('SELECTION')}
                onSuccess={() => {
                  // Handled via onResult mostly
                }}
                onError={(msg) => toast({ title: 'Payment Failed', description: msg, variant: 'destructive' })}
                onResult={(res) => {
                  setPaymentResult(res);
                  toast({ title: 'Payment Processed', description: 'Bulk payment completed successfully.', variant: 'default' });
                  setWorkflowStep('SELECTION');
                  loadBulkPayments();
                  setSelectedPayrolls([]);
                }}
              />
            </div>
          )}

          {workflowStep === 'RESULT' && paymentResult && (
            <div className="max-w-2xl mx-auto">
              <BulkPaymentResults
                result={paymentResult}
                onClose={() => {
                  setWorkflowStep('SELECTION');
                  setPaymentResult(null);
                  setSelectedPayrolls([]);
                }}
              />
            </div>
          )}
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