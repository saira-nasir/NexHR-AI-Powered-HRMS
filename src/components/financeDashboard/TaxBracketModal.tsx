import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import payrollService, { TaxBracket } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

interface TaxBracketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxBracket?: TaxBracket | null;
  onSuccess?: () => void;
}

const TaxBracketModal: React.FC<TaxBracketModalProps> = ({
  open,
  onOpenChange,
  taxBracket,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    min_income: '',
    max_income: '',
    rate: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (taxBracket) {
        setFormData({
          min_income: taxBracket.min_income,
          max_income: taxBracket.max_income,
          rate: taxBracket.rate
        });
      } else {
        resetForm();
      }
    }
  }, [open, taxBracket]);

  const resetForm = () => {
    setFormData({
      min_income: '',
      max_income: '',
      rate: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        min_income: parseFloat(formData.min_income).toFixed(2),
        max_income: parseFloat(formData.max_income).toFixed(2),
        rate: parseFloat(formData.rate).toFixed(2)
      };

      if (taxBracket) {
        await payrollService.updateTaxBracket(taxBracket.id, payload);
        toast({ title: 'Tax bracket updated successfully' });
      } else {
        await payrollService.createTaxBracket(payload);
        toast({ title: 'Tax bracket created successfully' });
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to save tax bracket',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {taxBracket ? 'Edit Tax Bracket' : 'Create Tax Bracket'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_income">Minimum Income ($)</Label>
              <Input
                id="min_income"
                type="number"
                step="0.01"
                value={formData.min_income}
                onChange={(e) => setFormData(prev => ({ ...prev, min_income: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_income">Maximum Income ($)</Label>
              <Input
                id="max_income"
                type="number"
                step="0.01"
                value={formData.max_income}
                onChange={(e) => setFormData(prev => ({ ...prev, max_income: e.target.value }))}
                placeholder="10000.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Tax Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
              placeholder="10.00"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : taxBracket ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaxBracketModal;
