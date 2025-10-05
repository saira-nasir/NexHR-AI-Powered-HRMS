import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import payrollService, { SalaryStructure } from '@/services/payrollService';
import { employeeService, Employee } from '@/services/employeeService';
import SalaryStructureModal from './SalaryStructureModal';
import { useToast } from '@/hooks/use-toast';

const SalaryStructureTable: React.FC = () => {
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [structures, empData] = await Promise.all([
        payrollService.listSalaryStructures(),
        employeeService.getEmployees().catch(() => [])
      ]);
      setSalaryStructures(structures);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load salary structures', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (structure: SalaryStructure) => {
    setEditingStructure(structure);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this salary structure?')) {
      try {
        await payrollService.deleteSalaryStructure(id);
        setSalaryStructures(prev => prev.filter(s => s.id !== id));
        toast({ title: 'Salary structure deleted successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete salary structure', variant: 'destructive' });
      }
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return `Employee ${employeeId}`;
    
    return employee.name || 
           `${employee.fname || ''} ${employee.lname || ''}`.trim() || 
           employee.email || 
           `Employee ${employeeId}`;
  };

  const filteredStructures = salaryStructures.filter(structure => {
    const employeeName = getEmployeeName(structure.employee).toLowerCase();
    return employeeName.includes(searchTerm.toLowerCase());
  });

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingStructure(null);
  };

  const handleSuccess = () => {
    loadData();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="group-hover:text-primary transition-colors">
            Salary Structures
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Structure
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Basic Pay</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No salary structures found matching your search' : 'No salary structures found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStructures.map((structure) => (
                  <TableRow key={structure.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {getEmployeeName(structure.employee)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(structure.basic_pay).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(structure.allowances).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(structure.deductions).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(structure.tax).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(structure.effective_from).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {structure.effective_to 
                        ? new Date(structure.effective_to).toLocaleDateString()
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(structure)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(structure.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <SalaryStructureModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        salaryStructure={editingStructure}
        onSuccess={handleSuccess}
      />
    </Card>
  );
};

export default SalaryStructureTable;
