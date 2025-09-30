import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import payrollService, { Loan as LoanType } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Banknote } from 'lucide-react';

interface LoanItem extends LoanType {
  employee_name?: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'secondary'; // green-ish in this theme
    case 'REJECTED':
      return 'destructive';
    case 'CLOSED':
      return 'outline';
    default:
      return 'secondary';
  }
};

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadLoans = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await payrollService.listLoans();
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load loans', err);
      toast({ title: 'Error', description: 'Failed to load loan requests', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  const handleApproveLoan = async (id: number) => {
    try {
      await payrollService.approveLoan(id);
      toast({ title: 'Success', description: 'Loan approved successfully' });
      await loadLoans();
    } catch (err) {
      console.error('Approve loan failed', err);
      toast({ title: 'Error', description: 'Failed to approve loan', variant: 'destructive' });
    }
  };

  const handleRejectLoan = async (id: number) => {
    try {
      // Backend doesn't expose a dedicated reject action for loans in this branch.
      // Use a PATCH to update status instead.
      await payrollService.updateLoan(id, { status: 'REJECTED' });
      toast({ title: 'Success', description: 'Loan rejected successfully' });
      await loadLoans();
    } catch (err) {
      console.error('Reject loan failed', err);
      toast({ title: 'Error', description: 'Failed to reject loan', variant: 'destructive' });
    }
  };

  const pendingLoans = loans.filter(l => l.status === 'PENDING');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loan Management</h1>
            <p className="text-muted-foreground">Review and approve employee loan requests</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingLoans.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>

        {pendingLoans.length > 0 && (
          <Card className="border-l-4 border-l-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-warning" />
                Pending Loan Requests
              </CardTitle>
              <CardDescription>Review and approve or reject employee loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingLoans.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold">{loan.employee_name || `Employee #${loan.employee}`}</h3>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Loan Amount</p>
                          <p className="font-medium">₹{Number(loan.amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Installment</p>
                          <p className="font-medium">₹{Number(loan.installment).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Applied On</p>
                          <p className="font-medium">{loan.requested_on ? new Date(loan.requested_on).toLocaleDateString() : '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" onClick={() => handleApproveLoan(loan.id)} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectLoan(loan.id)}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Loan Requests</CardTitle>
            <CardDescription>Complete history of employee loan requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Installment</th>
                    <th className="text-left p-4">Remaining</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Applied Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium">{loan.employee_name || `Employee #${loan.employee}`}</td>
                      <td className="p-4">₹{Number(loan.amount).toLocaleString()}</td>
                      <td className="p-4">₹{Number(loan.installment).toLocaleString()}</td>
                      <td className="p-4">₹{Number(loan.remaining_balance).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={getStatusVariant(loan.status)}>{loan.status}</Badge>
                      </td>
                      <td className="p-4">{loan.requested_on ? new Date(loan.requested_on).toLocaleDateString() : '—'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {loan.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleApproveLoan(loan.id)}><CheckCircle className="h-4 w-4"/></Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectLoan(loan.id)}><XCircle className="h-4 w-4"/></Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost"><Eye className="h-4 w-4"/></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Loans;
