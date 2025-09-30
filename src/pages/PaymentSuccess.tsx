import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import payrollService from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConfirming } = usePaymentConfirmation();
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const payrollIdParam = searchParams.get('payroll_id');

    // Recover pending payroll id from storage if not present in URL
    const resolvedPayrollId = payrollIdParam || (() => {
      try { return localStorage.getItem('nexhr.pending_payroll'); } catch (err: unknown) { console.debug('localStorage not available', err); return null; }
    })();

  // Proceed if we have a payroll id (sessionId may be absent if stripe doesn't include it)
  if (!resolvedPayrollId) return;

  const payrollId = Number(resolvedPayrollId);
    let mounted = true;

    const tryConfirm = async () => {
      if (mounted) setLoading(true);
      try {
        // Attempt the confirm endpoint (will fallback in service if unavailable)
  const p = await payrollService.confirmPayment(payrollId, sessionId || undefined);
        const status = (p?.payment_status || '').toUpperCase();
        if (status === 'PAID') {
          if (mounted) setLocalConfirmed(true);
          toast({ title: 'Payment confirmed', description: 'Payroll marked as paid.' });
          // clear our stored pending id
          try { localStorage.removeItem('nexhr.pending_payroll'); } catch (err: unknown) { console.debug('localStorage remove failed', err); }
          // remove query params from URL so hook/polls don't keep them around
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          url.searchParams.delete('payroll_id');
          url.searchParams.delete('success');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (err: unknown) {
        // Non-fatal: we'll rely on webhook + hook polling. Surface server validation messages when available.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        console.debug('Confirm endpoint not available or failed — will rely on webhook polling. Error:', err);
        if (e?.serverErrors) {
          const detail = e.serverErrors.detail || JSON.stringify(e.serverErrors);
          toast({ title: 'Payment confirmation failed', description: String(detail), variant: 'destructive' });
        } else {
          toast({ title: 'Payment confirmation failed', description: 'Server rejected the confirmation request.', variant: 'destructive' });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    tryConfirm();
    return () => { mounted = false; };
  }, [searchParams, toast]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Payment Initiated</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Thanks — your payment was received by Stripe. We are confirming the payroll status now.
        </p>

        {localConfirmed ? (
          <p className="text-sm text-green-700 font-medium mb-4">Payment confirmed. Payroll will be shown as Paid.</p>
        ) : isConfirming || loading ? (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
            <RefreshCw className="animate-spin" /> Confirming payment with the server…
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">If confirmation is delayed the payroll will update automatically once our server receives Stripe's notification.</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/payroll')}>Back to Payroll</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
