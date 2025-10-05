import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import payrollService, { Payroll } from '@/services/payrollService';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payrollId: number | null;
  payrollData?: Payroll | null; // Pass current payroll data
  onRecalculate?: (id: number) => Promise<void>;
}

const PayrollPreviewModal: React.FC<Props> = ({ open, onOpenChange, payrollId, payrollData, onRecalculate }) => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Payroll | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!open || !payrollId) return;
      setLoading(true);
      try {
        if (payrollData) {
          setData(payrollData);
        } else {
          // Fetch fresh data if not provided
          const payroll = await payrollService.getPayroll(payrollId);
          setData(payroll);
        }
      } catch (error) {
        console.error('Failed to load payroll data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, payrollId, payrollData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payroll Preview</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-2 text-sm">
            {data ? (
              <>
                <div className="flex justify-between"><span>Gross Salary</span><span>${Number(data.gross_salary || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Tax Amount</span><span>${Number(data.tax_amount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Statutory Deductions</span><span>${Number(data.statutory_deductions || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Total Deductions</span><span>${Number(data.total_deductions || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2"><span>Net Salary</span><span>${Number(data.net_salary || 0).toLocaleString()}</span></div>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">
                    <div><strong>Period:</strong> {data.period_start} to {data.period_end}</div>
                    <div><strong>Status:</strong> {data.payment_status}</div>
                    {data.paid_on && <div><strong>Paid On:</strong> {data.paid_on}</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-2 text-muted-foreground">Preview breakdown unavailable. You can recalculate to refresh values.</div>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {payrollId && (
            <Button
              onClick={async () => {
                if (!payrollId) return;
                await payrollService.calculatePayroll(payrollId);
                if (onRecalculate) await onRecalculate(payrollId);
                onOpenChange(false);
              }}
            >
              Recalculate
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollPreviewModal;


