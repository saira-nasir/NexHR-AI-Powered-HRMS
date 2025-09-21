import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import payrollService from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

export const usePaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const payrollId = searchParams.get('payroll_id');
    const success = searchParams.get('success');

    if (success === 'true' && sessionId && payrollId) {
      handlePaymentConfirmation(Number(payrollId), sessionId);
    }
  }, [searchParams]);

  const handlePaymentConfirmation = async (payrollId: number, sessionId: string) => {
    try {
      setIsConfirming(true);
      await payrollService.confirmPayment(payrollId, sessionId);
      toast({
        title: 'Payment Confirmed',
        description: 'Payroll has been successfully marked as paid.',
      });
      
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('payroll_id');
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      toast({
        title: 'Payment Confirmation Failed',
        description: error?.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return { isConfirming };
};
