import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import payrollService, { Payroll } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

interface PayrollEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  onUpdated?: () => void;
}

const PayrollEditModal: React.FC<PayrollEditModalProps> = ({ open, onOpenChange, payroll, onUpdated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    gross_salary: '',
    total_deductions: '',
    tax_amount: '',
    statutory_deductions: '',
    net_salary: '',
  });

  const computedNet = useMemo(() => {
    const gross = Number(form.gross_salary || 0);
    const deductions = Number(form.total_deductions || 0);
    const tax = Number(form.tax_amount || 0);
    const statutory = Number(form.statutory_deductions || 0);
    const net = gross - deductions - tax - statutory;
    return isFinite(net) ? net.toFixed(2) : '0.00';
  }, [form.gross_salary, form.total_deductions, form.tax_amount, form.statutory_deductions]);

  useEffect(() => {
    if (open && payroll) {
      setForm({
        gross_salary: payroll.gross_salary || '',
        total_deductions: payroll.total_deductions || '',
        tax_amount: payroll.tax_amount || '',
        statutory_deductions: payroll.statutory_deductions || '',
        net_salary: payroll.net_salary || '',
      });
    }
  }, [open, payroll]);

  useEffect(() => {
    setForm(prev => ({ ...prev, net_salary: computedNet }));
  }, [computedNet]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payroll) return;
    setLoading(true);
    try {
      await payrollService.updatePayroll(payroll.id, {
        gross_salary: form.gross_salary,
        total_deductions: form.total_deductions,
        tax_amount: form.tax_amount,
        statutory_deductions: form.statutory_deductions,
        net_salary: form.net_salary,
      });
      toast({ title: 'Payroll updated' });
      onUpdated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.response?.data?.detail || e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gross salary</Label>
              <Input type="number" step="0.01" value={form.gross_salary} onChange={(e) => setForm(p => ({ ...p, gross_salary: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Total deductions</Label>
              <Input type="number" step="0.01" value={form.total_deductions} onChange={(e) => setForm(p => ({ ...p, total_deductions: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tax amount</Label>
              <Input type="number" step="0.01" value={form.tax_amount} onChange={(e) => setForm(p => ({ ...p, tax_amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Statutory deductions</Label>
              <Input type="number" step="0.01" value={form.statutory_deductions} onChange={(e) => setForm(p => ({ ...p, statutory_deductions: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Net salary</Label>
              <Input type="number" step="0.01" value={form.net_salary} onChange={(e) => setForm(p => ({ ...p, net_salary: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollEditModal;


