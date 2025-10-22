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
import { useToast } from '@/hooks/use-toast';
import { employeeService, Employee } from '@/services/employeeService';
import payrollService, { Payroll, SalaryStructure, EmployeeBankInfo } from '@/services/payrollService';

interface PayrollCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PayrollCreateModal: React.FC<PayrollCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  console.log('PayrollCreateModal rendered, isOpen:', isOpen);
  console.log('PayrollCreateModal props:', { isOpen, onClose: typeof onClose, onSuccess: typeof onSuccess });
  
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [salaryStructuresLoading, setSalaryStructuresLoading] = useState(false);
  const [employeesWithBankInfo, setEmployeesWithBankInfo] = useState<Set<number>>(new Set());
  const [bankInfoLoading, setBankInfoLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    period_start: new Date(),
    period_end: new Date(),
    gross_salary: '',
    total_deductions: '',
    net_salary: '',
    tax_amount: '',
    statutory_deductions: '',
    payment_status: 'PENDING' as 'PENDING' | 'PAID' | 'FAILED',
    paid_on: new Date(),
    employee: 'none',
    salary_structure: 'none'
  });

  const { toast } = useToast();

  // Load employees and salary structures when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay API calls to ensure modal renders first
      setTimeout(() => {
        loadEmployees();
        loadSalaryStructures();
        loadBankInfo();
      }, 100);
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const employees = await employeeService.getEmployees();
      setEmployees(employees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      toast({
        title: "Warning",
        description: "Could not load employees. You can still create payroll manually.",
        variant: "destructive",
      });
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadSalaryStructures = async () => {
    setSalaryStructuresLoading(true);
    try {
      const structures = await payrollService.listSalaryStructures();
      console.log('Salary structures loaded:', structures);
      console.log('First structure fields:', structures[0] ? Object.keys(structures[0]) : 'No structures');
      setSalaryStructures(structures);
    } catch (error) {
      console.error('Error loading salary structures:', error);
      setSalaryStructures([]);
      toast({
        title: "Warning",
        description: "Could not load salary structures. You can still create payroll manually.",
        variant: "destructive",
      });
    } finally {
      setSalaryStructuresLoading(false);
    }
  };

  const loadBankInfo = async () => {
    setBankInfoLoading(true);
    try {
      const bankInfoList = await payrollService.listBankInfo();
      console.log('Bank info loaded:', bankInfoList);
      
      // Extract employee IDs that have bank information
      const employeeIdsWithBankInfo = new Set<number>();
      
      if (Array.isArray(bankInfoList)) {
        bankInfoList.forEach((bankInfo: EmployeeBankInfo) => {
          if (bankInfo.employee) {
            employeeIdsWithBankInfo.add(bankInfo.employee);
          }
        });
      }
      
      console.log('Employees with bank info:', Array.from(employeeIdsWithBankInfo));
      setEmployeesWithBankInfo(employeeIdsWithBankInfo);
    } catch (error) {
      console.error('Error loading bank info:', error);
      // Don't show error toast for bank info as it's not critical
      console.log('Bank info not available or failed to load');
    } finally {
      setBankInfoLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNetSalary = () => {
    const gross = parseFloat(formData.gross_salary) || 0;
    const deductions = parseFloat(formData.total_deductions) || 0;
    return (gross - deductions).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payrollData = {
        period_start: formData.period_start.toISOString().split('T')[0],
        period_end: formData.period_end.toISOString().split('T')[0],
        gross_salary: formData.gross_salary,
        total_deductions: formData.total_deductions,
        net_salary: calculateNetSalary(),
        tax_amount: formData.tax_amount,
        statutory_deductions: formData.statutory_deductions,
        payment_status: formData.payment_status,
        paid_on: formData.payment_status === 'PAID' ? formData.paid_on.toISOString().split('T')[0] : null,
        employee: formData.employee && formData.employee !== 'none' ? parseInt(formData.employee) : null,
        salary_structure: formData.salary_structure && formData.salary_structure !== 'none' ? parseInt(formData.salary_structure) : null,
      };

      await payrollService.createPayroll(payrollData);
      
      toast({
        title: "Success",
        description: "Payroll created successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating payroll:', error);
      
      // Extract the specific error message from the backend response
      let errorMessage = "Failed to create payroll";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Handle different error formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.employee && Array.isArray(errorData.employee)) {
          // Handle employee-specific errors (like missing bank info)
          errorMessage = errorData.employee[0];
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        } else {
          // Look for the first error in any field
          const firstErrorField = Object.keys(errorData)[0];
          if (firstErrorField && errorData[firstErrorField]) {
            const fieldErrors = errorData[firstErrorField];
            errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeAndReset = () => {
    setFormData({
      period_start: new Date(),
      period_end: new Date(),
      gross_salary: '',
      total_deductions: '',
      net_salary: '',
      tax_amount: '',
      statutory_deductions: '',
      payment_status: 'PENDING',
      paid_on: new Date(),
      employee: 'none',
      salary_structure: 'none'
    });
    onClose();
  };

  // Radix Dialog will invoke onOpenChange with the new open state (true when opening,
  // false when closing). We should only call the parent's onClose when the dialog is
  // actually being closed to avoid immediately closing right after opening.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAndReset();
    }
  };

  // Get employee name for display
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === parseInt(employeeId));
    if (!employee) return 'Select Employee';
    
    const firstName = employee.first_name || employee.fname || employee.firstName || '';
    const lastName = employee.last_name || employee.lname || employee.lastName || '';
    const name = employee.name || `${firstName} ${lastName}`.trim();
    
    return name || employee.email || 'Unknown Employee';
  };

  // Get salary structure name for display
  const getSalaryStructureName = (structureId: string) => {
    const structure = salaryStructures.find(struct => struct.id === parseInt(structureId));
    if (!structure) return 'Select Salary Structure';
    
    // Try multiple possible name fields
    const name = structure.name || structure.title || (structure as any).structure_name || (structure as any).salary_name;
    
    if (name) {
      return name;
    }
    
    // Fallback to ID-based format if no name is available
    return `Structure #${structure.id} (${structure.basic_pay})`;
  };

  // Early return if not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Payroll</DialogTitle>
        </DialogHeader>
        
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Period Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.period_start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_start ? format(formData.period_start, "MM/dd/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.period_start}
                    onSelect={(date) => date && handleInputChange('period_start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.period_end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_end ? format(formData.period_end, "MM/dd/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.period_end}
                    onSelect={(date) => date && handleInputChange('period_end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Employee and Salary Structure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) => handleInputChange('employee', value)}
                disabled={employeesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Select Employee"} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? (
                    employees
                      .filter(employee => employeesWithBankInfo.has(employee.id))
                      .length > 0 ? (
                        employees
                          .filter(employee => employeesWithBankInfo.has(employee.id))
                          .map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {getEmployeeName(employee.id.toString())}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-red-600">
                          No employees with bank information found. Please add bank information for employees first.
                        </div>
                      )
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {employeesLoading ? "Loading..." : "No employees available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {employees.length > 0 && (
                <div className={`text-sm p-2 rounded-md ${
                  employeesWithBankInfo.size === 0 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-amber-600 bg-amber-50'
                }`}>
                  {employeesWithBankInfo.size === 0 ? (
                    <>
                      <strong>Warning:</strong> No employees have bank information. 
                      Please add bank information for employees before creating payroll.
                      <br />
                      <a href="/bank-info" className="text-blue-600 underline hover:text-blue-800">
                        Go to Bank Information page →
                      </a>
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> Only employees with bank information are shown.
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_structure">Salary Structure</Label>
              <Select
                value={formData.salary_structure}
                onValueChange={(value) => handleInputChange('salary_structure', value)}
                disabled={salaryStructuresLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={salaryStructuresLoading ? "Loading structures..." : "Select Salary Structure"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Structure</SelectItem>
                  {salaryStructures.length > 0 ? (
                    salaryStructures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id.toString()}>
                        {getSalaryStructureName(structure.id.toString())}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {salaryStructuresLoading ? "Loading..." : "No salary structures available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gross_salary">Gross Salary</Label>
              <Input
                id="gross_salary"
                type="number"
                step="0.01"
                value={formData.gross_salary}
                onChange={(e) => handleInputChange('gross_salary', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_deductions">Total Deductions</Label>
              <Input
                id="total_deductions"
                type="number"
                step="0.01"
                value={formData.total_deductions}
                onChange={(e) => handleInputChange('total_deductions', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => handleInputChange('tax_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statutory_deductions">Statutory Deductions</Label>
              <Input
                id="statutory_deductions"
                type="number"
                step="0.01"
                value={formData.statutory_deductions}
                onChange={(e) => handleInputChange('statutory_deductions', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Net Salary Display */}
          <div className="space-y-2">
            <Label>Net Salary (Calculated)</Label>
            <Input
              value={calculateNetSalary()}
              readOnly
              className="bg-muted"
              placeholder="Will be calculated automatically"
            />
          </div>

          {/* Payment Status and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => handleInputChange('payment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_status === 'PAID' && (
              <div className="space-y-2">
                <Label>Paid On</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.paid_on && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.paid_on ? format(formData.paid_on, "MM/dd/yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.paid_on}
                      onSelect={(date) => date && handleInputChange('paid_on', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || employeesWithBankInfo.size === 0}
            >
              {isLoading ? 'Creating...' : 'Create Payroll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollCreateModal;