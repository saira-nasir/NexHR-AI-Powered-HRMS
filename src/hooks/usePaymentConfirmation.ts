import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import payrollService from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

export const usePaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const payrollIdParam = searchParams.get('payroll_id');
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Start polling if we have the necessary identifiers, regardless of a `success` flag
    // If payroll_id is not present in the URL, try to recover it from localStorage
    const stored = (() => {
      try {
        return localStorage.getItem('nexhr.pending_payroll');
      } catch {
        return null;
      }
    })();

    const resolvedPayrollId = payrollIdParam || stored;
    // Start polling if we have a pending payroll id even if the session_id is missing.
    // This covers cases where Stripe redirects without session_id but webhook will
    // still update the payroll record later.
    if (resolvedPayrollId) {
      pollForWebhookCompletion(Number(resolvedPayrollId));
    }
    // Only re-run when the actual primitive query values change
  }, [sessionId, payrollIdParam]);

  const pollForWebhookCompletion = async (payrollId: number) => {
    setIsConfirming(true);

    const maxAttempts = 12; // ~60s total with backoff
    let attempt = 0;

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    try {
      while (attempt < maxAttempts) {
        try {
          const p = await payrollService.getPayroll(payrollId);
          const status = (p.payment_status || '').toUpperCase();
          if (status === 'PAID') {
            toast({ title: 'Payment Confirmed', description: 'Payroll marked as paid.' });
            // Clear and reload so the UI fetches the updated payroll list
            clearUrlParams();
            try { localStorage.removeItem('nexhr.pending_payroll'); } catch { }
            // Force a refresh to ensure the payroll table shows the updated PAID status
            window.location.reload();
            return;
          }
        } catch {
          // ignore transient errors and keep polling
        }
        attempt += 1;
        const delays = [2000, 3000, 5000, 8000];
        const delay = delays[Math.min(attempt - 1, delays.length - 1)];
        await sleep(delay);
      }

      // Polling timed out - clear params silently without showing toast
      clearUrlParams();
    } finally {
      setIsConfirming(false);
    }
  };

  const clearUrlParams = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    url.searchParams.delete('payroll_id');
    url.searchParams.delete('success');
    window.history.replaceState({}, '', url.toString());
  };

  return { isConfirming };
};
