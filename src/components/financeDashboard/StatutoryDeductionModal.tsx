import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import payrollService, { StatutoryDeduction } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

interface StatutoryDeductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statutoryDeduction?: StatutoryDeduction | null;
  onSuccess?: () => void;
}

const StatutoryDeductionModal: React.FC<StatutoryDeductionModalProps> = ({
  open,
  onOpenChange,
  statutoryDeduction,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    is_mandatory: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (statutoryDeduction) {
        setFormData({
          name: statutoryDeduction.name,
          rate: statutoryDeduction.rate,
          is_mandatory: statutoryDeduction.is_mandatory
        });
      } else {
        resetForm();
      }
    }
  }, [open, statutoryDeduction]);

  const resetForm = () => {
    setFormData({
      name: '',
      rate: '',
      is_mandatory: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        rate: parseFloat(formData.rate).toFixed(2)
      };

      if (statutoryDeduction) {
        await payrollService.updateStatutoryDeduction(statutoryDeduction.id, payload);
        toast({ title: 'Statutory deduction updated successfully' });
      } else {
        await payrollService.createStatutoryDeduction(payload);
        toast({ title: 'Statutory deduction created successfully' });
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to save statutory deduction',
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
            {statutoryDeduction ? 'Edit Statutory Deduction' : 'Create Statutory Deduction'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deduction Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Social Security"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Deduction Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
              placeholder="6.20"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_mandatory"
              checked={formData.is_mandatory}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_mandatory: checked as boolean }))
              }
            />
            <Label htmlFor="is_mandatory">Mandatory Deduction</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : statutoryDeduction ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatutoryDeductionModal;
