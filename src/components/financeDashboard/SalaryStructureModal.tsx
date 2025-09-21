import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import payrollService, { SalaryStructure } from '@/services/payrollService';
import { employeeService, Employee } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';

interface SalaryStructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaryStructure?: SalaryStructure | null;
  onSuccess?: () => void;
}

const SalaryStructureModal: React.FC<SalaryStructureModalProps> = ({
  open,
  onOpenChange,
  salaryStructure,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    employee: '',
    basic_pay: '',
    allowances: '',
    deductions: '',
    tax: '',
    effective_from: '',
    effective_to: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadEmployees();
      if (salaryStructure) {
        setFormData({
          employee: salaryStructure.employee.toString(),
          basic_pay: salaryStructure.basic_pay,
          allowances: salaryStructure.allowances,
          deductions: salaryStructure.deductions,
          tax: salaryStructure.tax,
          effective_from: salaryStructure.effective_from,
          effective_to: salaryStructure.effective_to || ''
        });
        setDateFrom(new Date(salaryStructure.effective_from));
        setDateTo(salaryStructure.effective_to ? new Date(salaryStructure.effective_to) : undefined);
      } else {
        resetForm();
      }
    }
  }, [open, salaryStructure]);

  const loadEmployees = async () => {
    try {
      const empData = await employeeService.getEmployees();
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employee: '',
      basic_pay: '',
      allowances: '',
      deductions: '',
      tax: '',
      effective_from: '',
      effective_to: ''
    });
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        employee: parseInt(formData.employee),
        effective_from: dateFrom?.toISOString().split('T')[0] || '',
        effective_to: dateTo?.toISOString().split('T')[0] || null
      };

      if (salaryStructure) {
        await payrollService.updateSalaryStructure(salaryStructure.id, payload);
        toast({ title: 'Salary structure updated successfully' });
      } else {
        await payrollService.createSalaryStructure(payload);
        toast({ title: 'Salary structure created successfully' });
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to save salary structure',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {salaryStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employee: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name || `${emp.fname || ''} ${emp.lname || ''}`.trim() || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basic_pay">Basic Pay ($)</Label>
              <Input
                id="basic_pay"
                type="number"
                step="0.01"
                value={formData.basic_pay}
                onChange={(e) => setFormData(prev => ({ ...prev, basic_pay: e.target.value }))}
                placeholder="5000.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances ($)</Label>
              <Input
                id="allowances"
                type="number"
                step="0.01"
                value={formData.allowances}
                onChange={(e) => setFormData(prev => ({ ...prev, allowances: e.target.value }))}
                placeholder="1000.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions ($)</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => setFormData(prev => ({ ...prev, deductions: e.target.value }))}
                placeholder="200.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax ($)</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData(prev => ({ ...prev, tax: e.target.value }))}
                placeholder="500.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Effective From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Effective To (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick a date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : salaryStructure ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryStructureModal;
