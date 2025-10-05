import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Calculator, Shield } from 'lucide-react';
import payrollService, { TaxBracket, StatutoryDeduction } from '@/services/payrollService';
import TaxBracketModal from './TaxBracketModal';
import StatutoryDeductionModal from './StatutoryDeductionModal';
import { useToast } from '@/hooks/use-toast';

const TaxManagementTable: React.FC = () => {
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [statutoryDeductions, setStatutoryDeductions] = useState<StatutoryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [editingTaxBracket, setEditingTaxBracket] = useState<TaxBracket | null>(null);
  const [editingDeduction, setEditingDeduction] = useState<StatutoryDeduction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brackets, deductions] = await Promise.all([
        payrollService.listTaxBrackets(),
        payrollService.listStatutoryDeductions()
      ]);
      setTaxBrackets(brackets);
      setStatutoryDeductions(deductions);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load tax data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTaxBracket = (bracket: TaxBracket) => {
    setEditingTaxBracket(bracket);
    setTaxModalOpen(true);
  };

  const handleEditDeduction = (deduction: StatutoryDeduction) => {
    setEditingDeduction(deduction);
    setDeductionModalOpen(true);
  };

  const handleDeleteTaxBracket = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this tax bracket?')) {
      try {
        await payrollService.deleteTaxBracket(id);
        setTaxBrackets(prev => prev.filter(b => b.id !== id));
        toast({ title: 'Tax bracket deleted successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete tax bracket', variant: 'destructive' });
      }
    }
  };

  const handleDeleteDeduction = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this statutory deduction?')) {
      try {
        await payrollService.deleteStatutoryDeduction(id);
        setStatutoryDeductions(prev => prev.filter(d => d.id !== id));
        toast({ title: 'Statutory deduction deleted successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete statutory deduction', variant: 'destructive' });
      }
    }
  };

  const handleTaxModalClose = () => {
    setTaxModalOpen(false);
    setEditingTaxBracket(null);
  };

  const handleDeductionModalClose = () => {
    setDeductionModalOpen(false);
    setEditingDeduction(null);
  };

  const handleSuccess = () => {
    loadData();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader>
        <CardTitle className="group-hover:text-primary transition-colors">
          Tax Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tax-brackets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tax-brackets" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Tax Brackets
            </TabsTrigger>
            <TabsTrigger value="statutory-deductions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Statutory Deductions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tax-brackets" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setTaxModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Tax Bracket
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Income</TableHead>
                    <TableHead>Max Income</TableHead>
                    <TableHead className="text-right">Rate (%)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : taxBrackets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No tax brackets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxBrackets.map((bracket) => (
                      <TableRow key={bracket.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          ${Number(bracket.min_income).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ${Number(bracket.max_income).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(bracket.rate).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTaxBracket(bracket)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTaxBracket(bracket.id)}
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
          </TabsContent>

          <TabsContent value="statutory-deductions" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setDeductionModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Deduction
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Rate (%)</TableHead>
                    <TableHead>Mandatory</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : statutoryDeductions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No statutory deductions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    statutoryDeductions.map((deduction) => (
                      <TableRow key={deduction.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {deduction.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(deduction.rate).toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            deduction.is_mandatory 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {deduction.is_mandatory ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditDeduction(deduction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDeduction(deduction.id)}
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
          </TabsContent>
        </Tabs>
      </CardContent>

      <TaxBracketModal
        open={taxModalOpen}
        onOpenChange={handleTaxModalClose}
        taxBracket={editingTaxBracket}
        onSuccess={handleSuccess}
      />

      <StatutoryDeductionModal
        open={deductionModalOpen}
        onOpenChange={handleDeductionModalClose}
        statutoryDeduction={editingDeduction}
        onSuccess={handleSuccess}
      />
    </Card>
  );
};

export default TaxManagementTable;
