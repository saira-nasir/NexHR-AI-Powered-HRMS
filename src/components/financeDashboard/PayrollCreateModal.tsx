import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle } from 'lucide-react';
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

  const loadEmployees = async () => {
    console.log('🔄 [PayrollCreateModal] Starting to load employees...');
    setEmployeesLoading(true);
    try {
      const employeesData = await employeeService.getEmployees();
      console.log('✅ [PayrollCreateModal] Employees loaded from API:', employeesData);
      console.log('✅ [PayrollCreateModal] Number of employees:', employeesData?.length || 0);
      console.log('✅ [PayrollCreateModal] Employee IDs:', employeesData?.map((e: Employee) => e.id) || []);

      // Ensure we have an array
      const employeesArray = Array.isArray(employeesData) ? employeesData : [];
      console.log('✅ [PayrollCreateModal] Setting employees state with:', employeesArray.length, 'employees');
      setEmployees(employeesArray);

      // Return employees for use in other functions
      return employeesArray;
    } catch (error: any) {
      console.error('❌ [PayrollCreateModal] Error loading employees:', error);
      console.error('❌ [PayrollCreateModal] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url
      });
      setEmployees([]);
      toast({
        title: "Warning",
        description: error?.response?.data?.detail || error?.message || "Could not load employees. You can still create payroll manually.",
        variant: "destructive",
      });
      return [];
    } finally {
      setEmployeesLoading(false);
      console.log('✅ [PayrollCreateModal] employeesLoading set to false');
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

  const loadBankInfo = useCallback(async (currentEmployeesList?: Employee[]) => {
    setBankInfoLoading(true);
    try {
      const bankInfoList = await payrollService.listBankInfo();
      console.log('🔍 [PayrollCreateModal] Bank info loaded from API:', bankInfoList);
      console.log('🔍 [PayrollCreateModal] Bank info type:', Array.isArray(bankInfoList) ? 'Array' : typeof bankInfoList);
      console.log('🔍 [PayrollCreateModal] Bank info length:', Array.isArray(bankInfoList) ? bankInfoList.length : 'N/A');

      // Extract employee IDs that have bank information
      const employeeIdsWithBankInfo = new Set<number>();

      if (Array.isArray(bankInfoList)) {
        console.log(`📊 [PayrollCreateModal] Processing ${bankInfoList.length} bank info records...`);
        bankInfoList.forEach((bankInfo: EmployeeBankInfo) => {
          const normalizedEmployeeId = Number(bankInfo.employee);
          console.log('🔍 [PayrollCreateModal] Processing bank info:', {
            id: bankInfo.id,
            employee: bankInfo.employee,
            employeeType: typeof bankInfo.employee,
            normalizedEmployeeId: normalizedEmployeeId,
            bank_name: bankInfo.bank_name,
            account_number: bankInfo.account_number ? `${bankInfo.account_number.substring(0, 4)}...` : 'N/A'
          });
          if (bankInfo.employee) {
            // Normalize to number for consistent comparison
            employeeIdsWithBankInfo.add(normalizedEmployeeId);
            console.log(`✅ [PayrollCreateModal] Added employee ${normalizedEmployeeId} to bank info set`);
          }
        });
      } else if (bankInfoList && typeof bankInfoList === 'object') {
        // Handle single object response
        const bi = bankInfoList as any;
        if (bi.employee) {
          const normalizedEmployeeId = Number(bi.employee);
          // Normalize to number for consistent comparison
          employeeIdsWithBankInfo.add(normalizedEmployeeId);
          console.log(`✅ [PayrollCreateModal] Added employee ${normalizedEmployeeId} to bank info set (single object)`);
        }
      }

      // Use provided employees list or get from state
      const employeesToCheck = currentEmployeesList || employees;
      console.log('✅ [PayrollCreateModal] Employees with bank info (IDs):', Array.from(employeeIdsWithBankInfo));
      console.log('✅ [PayrollCreateModal] Total employees loaded:', employeesToCheck.length);
      console.log('✅ [PayrollCreateModal] Employee IDs from employees list:', employeesToCheck.map(e => e.id));

      // Cross-check: Show which employees have bank info
      console.log('🔍 [PayrollCreateModal] Cross-checking employees with bank info...');
      console.log('🔍 [PayrollCreateModal] Bank info employee IDs in Set:', Array.from(employeeIdsWithBankInfo));
      employeesToCheck.forEach(emp => {
        const normalizedEmpId = Number(emp.id);
        const hasBankInfo = employeeIdsWithBankInfo.has(normalizedEmpId);
        if (!hasBankInfo) {
          // Show detailed debug for employees without bank info
          console.log(`❌ [PayrollCreateModal] Employee ${emp.id} (${emp.name || emp.email}): NO bank info`, {
            employeeId: emp.id,
            employeeIdType: typeof emp.id,
            normalizedEmpId: normalizedEmpId,
            inSet: employeeIdsWithBankInfo.has(normalizedEmpId),
            setContents: Array.from(employeeIdsWithBankInfo)
          });
        } else {
          console.log(`✅ [PayrollCreateModal] Employee ${emp.id} (${emp.name || emp.email}): HAS bank info`);
        }
      });

      setEmployeesWithBankInfo(employeeIdsWithBankInfo);
    } catch (error) {
      console.error('❌ [PayrollCreateModal] Error loading bank info:', error);
      // Don't show error toast for bank info as it's not critical
      console.log('⚠️ [PayrollCreateModal] Bank info not available or failed to load');
    } finally {
      setBankInfoLoading(false);
    }
  }, [employees]); // Keep employees in dependencies but call with parameter when needed

  // Load employees and salary structures when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      console.log('🚪 [PayrollCreateModal] Modal closed, resetting state...');
      setEmployeesWithBankInfo(new Set());
      return;
    }

    console.log('🚀 [PayrollCreateModal] Modal opened, starting to load data...');

    // Load data sequentially to avoid race conditions
    const loadAllData = async () => {
      try {
        // Step 1: Load employees first (most important)
        console.log('📥 Step 1: Loading employees...');
        const loadedEmployees = await loadEmployees();
        console.log('✅ Step 1 complete: Loaded', loadedEmployees?.length || 0, 'employees');

        // Step 2: Load salary structures (can be parallel)
        console.log('📥 Step 2: Loading salary structures...');
        loadSalaryStructures().catch(err => {
          console.error('❌ Failed to load salary structures:', err);
        });

        // Step 3: Load bank info AFTER employees are loaded (needs employee data)
        if (loadedEmployees && loadedEmployees.length > 0) {
          console.log('📥 Step 3: Loading bank info for', loadedEmployees.length, 'employees...');
          // Pass employees directly to avoid state timing issues
          loadBankInfo(loadedEmployees).catch(err => {
            console.error('❌ Failed to load bank info:', err);
          });
        } else {
          console.log('⚠️ Step 3 skipped: No employees loaded, cannot load bank info');
        }
      } catch (error) {
        console.error('❌ [PayrollCreateModal] Error in loadAllData:', error);
      }
    };

    // Small delay to ensure modal renders first
    const timer = setTimeout(() => {
      loadAllData();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]); // Removed loadBankInfo from dependencies to avoid infinite loops

  // Reload bank info when employees are loaded (to ensure proper matching)
  useEffect(() => {
    if (isOpen && employees.length > 0) {
      console.log('✅ [PayrollCreateModal] Employees state updated, reloading bank info. Employee count:', employees.length);
      // Pass current employees to avoid stale closure
      loadBankInfo(employees);
    }
  }, [isOpen, employees.length, loadBankInfo]);

  // Debug: Log when employees state changes
  useEffect(() => {
    console.log('📊 [PayrollCreateModal] Employees state changed:', {
      count: employees.length,
      ids: employees.map(e => e.id),
      names: employees.map(e => {
        const firstName = e.first_name || e.fname || e.firstName || '';
        const lastName = e.last_name || e.lname || e.lastName || '';
        const name = e.name || `${firstName} ${lastName}`.trim();
        return name || e.email || 'Unknown Employee';
      }),
      loading: employeesLoading,
      isOpen: isOpen
    });
  }, [employees, employeesLoading, isOpen]);

  // Poll bank info periodically while modal is open to catch updates from other portals
  useEffect(() => {
    if (!isOpen || employees.length === 0) return;

    // Set up periodic refresh every 5 seconds while modal is open
    const interval = setInterval(() => {
      console.log('🔄 [PayrollCreateModal] Periodic bank info refresh...');
      loadBankInfo(employees);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, employees.length, loadBankInfo, employees]);

  // Refresh bank info when window regains focus (user switched tabs/portals)
  useEffect(() => {
    if (!isOpen || employees.length === 0) return;

    const handleFocus = () => {
      console.log('🔄 [PayrollCreateModal] Window focus detected, refreshing bank info...');
      loadBankInfo(employees);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen, employees.length, loadBankInfo, employees]);

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

    // Validate Date Range
    if (formData.period_end < formData.period_start) {
      toast({
        title: "Validation Error",
        description: "Period End Date cannot be before Start Date.",
        variant: "destructive",
      });
      return;
    }

    // Validate Numeric Fields (Prevent Negatives)
    if (parseFloat(formData.gross_salary) < 0 || parseFloat(formData.total_deductions) < 0 || parseFloat(formData.tax_amount) < 0) {
      toast({
        title: "Validation Error",
        description: "Salary and deduction amounts cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    // Validate that selected employee has bank info
    if (formData.employee && formData.employee !== 'none') {
      const selectedEmployeeId = parseInt(formData.employee);
      if (!employeesWithBankInfo.has(selectedEmployeeId)) {
        toast({
          title: "Warning",
          description: `Bank details missing for selected employee. Payroll will be created but payment may fail.`,
          variant: "default",
        });
        // We allow proceeding now
      }
    }

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
              <Label htmlFor="period_start">Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="period_start"
                    name="period_start"
                    type="button"
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
              <Label htmlFor="period_end">Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="period_end"
                    name="period_end"
                    type="button"
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
                key={`employee-select-${employees.length}-${employeesLoading}`}
                value={formData.employee}
                onOpenChange={(open) => {
                  // Refresh bank info when dropdown opens to catch latest updates
                  if (open) {
                    console.log('🔄 [PayrollCreateModal] Employee dropdown opened, refreshing bank info...');
                    console.log('🔄 [PayrollCreateModal] Current employees count:', employees.length);
                    loadBankInfo(employees);
                  }
                }}
                onValueChange={(value) => {
                  console.log('📝 [PayrollCreateModal] Employee value changed to:', value);
                  // Update form data synchronously first
                  handleInputChange('employee', value);

                  // Auto-select salary structure if available
                  if (value && value !== 'none') {
                    const empId = parseInt(value);
                    const empStructure = salaryStructures.find(s => s.employee === empId);

                    if (empStructure) {
                      console.log('✅ [PayrollCreateModal] Found salary structure for employee:', empStructure);
                      handleInputChange('salary_structure', empStructure.id.toString());

                      // Populate fields from structure
                      const basicPay = parseFloat(empStructure.basic_pay) || 0;
                      const allowances = parseFloat(empStructure.allowances) || 0;
                      const deductions = parseFloat(empStructure.deductions) || 0;
                      const tax = parseFloat(empStructure.tax) || 0;

                      const gross = basicPay + allowances;
                      const totalDeductions = deductions + tax; // Assuming total deductions includes tax

                      setFormData(prev => ({
                        ...prev,
                        employee: value,
                        salary_structure: empStructure.id.toString(),
                        gross_salary: gross.toFixed(2),
                        total_deductions: totalDeductions.toFixed(2),
                        tax_amount: tax.toFixed(2),
                        statutory_deductions: '0.00' // Default or calculate if needed
                      }));

                      toast({
                        title: "Info",
                        description: "Salary structure and fields autofilled.",
                      });
                    } else {
                      console.log('⚠️ [PayrollCreateModal] No salary structure found for employee:', empId);
                    }

                    // Always check bank info when employee is selected (to get latest data)
                    // This ensures we have the most up-to-date bank info, especially after employee updates it
                    (async () => {
                      try {
                        console.log(`🔍 Checking bank info for employee ${empId} (refreshing latest data)...`);
                        const info = await payrollService.getBankInfo(empId);
                        if (info) {
                          console.log(`✅ Found bank info for employee ${empId}:`, info);
                          setEmployeesWithBankInfo(prev => {
                            const newSet = new Set(prev);
                            newSet.add(empId);
                            return newSet;
                          });
                          // Only show toast if it was previously missing
                          if (!employeesWithBankInfo.has(empId)) {
                            toast({
                              title: "Info",
                              description: "Bank details found for this employee.",
                            });
                          }
                        } else {
                          // Remove from set if bank info was deleted
                          console.log(`❌ No bank info found for employee ${empId}`);
                          setEmployeesWithBankInfo(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(empId);
                            return newSet;
                          });
                        }
                      } catch (err) {
                        console.log(`❌ No bank info found for employee ${empId} via direct fetch`);
                        // Remove from set if fetch fails (bank info doesn't exist)
                        setEmployeesWithBankInfo(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(empId);
                          return newSet;
                        });
                      }
                    })();
                  }
                }}
                disabled={employeesLoading}
              >
                <SelectTrigger id="employee" name="employee">
                  <SelectValue placeholder={employeesLoading ? "Loading employees..." : employees.length > 0 ? "Select Employee" : "No employees available"} />
                </SelectTrigger>
                <SelectContent>
                  {employeesLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading employees...
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No employees available
                    </div>
                  ) : (
                    <>
                      <SelectItem value="none">Select Employee</SelectItem>
                      {employees.map((employee) => {
                        // Ensure type consistency - convert both to numbers for comparison
                        const employeeId = Number(employee.id);
                        const hasBankInfo = employeesWithBankInfo.has(employeeId);
                        const employeeName = getEmployeeName(employee.id.toString());

                        console.log(`🎨 Rendering employee option: ${employee.id} - ${employeeName} (hasBankInfo: ${hasBankInfo})`);

                        return (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                            className={!hasBankInfo ? 'text-amber-600' : ''}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{employeeName}</span>
                              {!hasBankInfo && (
                                <span className="ml-2 text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Missing bank info
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
              {formData.employee && formData.employee !== 'none' && !employeesWithBankInfo.has(Number(formData.employee)) && (
                <div className="text-sm p-2 rounded-md text-amber-600 bg-amber-50 border border-amber-200">
                  <strong>Warning:</strong> Bank details missing for selected employee.
                  <br />
                  You can still create the payroll, but payment processing may fail.
                  <br />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const empId = parseInt(formData.employee);
                        try {
                          console.log(`🔄 Manually refreshing bank info for employee ${empId}...`);
                          const info = await payrollService.getBankInfo(empId);
                          if (info) {
                            setEmployeesWithBankInfo(prev => {
                              const newSet = new Set(prev);
                              newSet.add(empId);
                              return newSet;
                            });
                            toast({
                              title: "Success",
                              description: "Bank details found and updated.",
                            });
                          } else {
                            toast({
                              title: "No Bank Info",
                              description: "Bank details still not found for this employee.",
                              variant: "destructive",
                            });
                          }
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: "Failed to check bank info. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      🔄 Refresh Bank Info
                    </Button>
                    <a href="/bank-info" target="_blank" className="text-blue-600 underline hover:text-blue-800 inline-flex items-center">
                      Update Bank Information (Opens in new tab) →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_structure">Salary Structure</Label>
              <Select
                value={formData.salary_structure}
                onValueChange={(value) => {
                  handleInputChange('salary_structure', value);

                  if (value && value !== 'none') {
                    const structure = salaryStructures.find(s => s.id.toString() === value);
                    if (structure) {
                      const basicPay = parseFloat(structure.basic_pay) || 0;
                      const allowances = parseFloat(structure.allowances) || 0;
                      const deductions = parseFloat(structure.deductions) || 0;
                      const tax = parseFloat(structure.tax) || 0;

                      const gross = basicPay + allowances;
                      const totalDeductions = deductions + tax;

                      setFormData(prev => ({
                        ...prev,
                        salary_structure: value,
                        gross_salary: gross.toFixed(2),
                        total_deductions: totalDeductions.toFixed(2),
                        tax_amount: tax.toFixed(2)
                      }));
                    }
                  }
                }}
                disabled={salaryStructuresLoading}
              >
                <SelectTrigger id="salary_structure" name="salary_structure">
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
                name="gross_salary"
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
                name="total_deductions"
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
                name="tax_amount"
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
                name="statutory_deductions"
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
            <Label htmlFor="net_salary">Net Salary (Calculated)</Label>
            <Input
              id="net_salary"
              name="net_salary"
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
                <SelectTrigger id="payment_status" name="payment_status">
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
                <Label htmlFor="paid_on">Paid On</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="paid_on"
                      name="paid_on"
                      type="button"
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
              disabled={
                isLoading ||
                !formData.employee ||
                formData.employee === 'none'
              }
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