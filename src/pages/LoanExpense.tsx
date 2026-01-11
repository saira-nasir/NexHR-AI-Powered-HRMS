import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import payrollService from '@/services/payrollService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Receipt, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Loan {
  id: number;
  amount: number;
  installment: number;
  remaining_amount?: number;
  status?: string;
  created_at?: string;
  requested_on?: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at?: string;
  submitted_on?: string;
  status?: string;
}

// Helper to get status badge variant
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    case 'CLOSED':
      return 'outline';
    default:
      return 'secondary';
  }
};

const LoanExpense: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [loanOpen, setLoanOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [activeLoanError, setActiveLoanError] = useState<string | null>(null);
  const [loanFormData, setLoanFormData] = useState({
    amount: '',
    installment: '',
  });
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    amount: '',
    category: '',
  });

  // Check if user has an active loan (PENDING or APPROVED)
  const hasActiveLoan = loans.some(
    (loan) => loan.status?.toUpperCase() === 'PENDING' || loan.status?.toUpperCase() === 'APPROVED'
  );

  // Fetch loans data using employee self-service endpoint
  const fetchLoans = async () => {
    try {
      setLoansLoading(true);
      const data = await payrollService.listMyLoans();
      const normalized = (Array.isArray(data) ? data : []).map((l: any) => ({
        ...l,
        amount: Number(l.amount),
        installment: Number(l.installment),
        remaining_amount: l.remaining_balance != null ? Number(l.remaining_balance) : undefined,
      }));
      setLoans(normalized);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      toast.error('Failed to fetch your loans');
    } finally {
      setLoansLoading(false);
    }
  };

  // Fetch expenses data using employee self-service endpoint
  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      const data = await payrollService.listMyExpenses();
      const normalized = (Array.isArray(data) ? data : []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
      }));
      setExpenses(normalized);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to fetch your expenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchExpenses();
  }, []);

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveLoanError(null);
    setLoanSubmitting(true);

    try {
      await payrollService.createMyLoan({
        amount: loanFormData.amount,
        installment: loanFormData.installment,
      });
      toast.success('Loan request submitted successfully');
      setLoanOpen(false);
      setLoanFormData({ amount: '', installment: '' });
      // Refresh loans data
      await fetchLoans();
    } catch (error: any) {
      console.error('Failed to submit loan request:', error);
      // Check for active loan error from backend
      const errorDetail = error?.response?.data?.detail || error?.response?.data?.error || error?.message;
      if (errorDetail && errorDetail.toLowerCase().includes('active loan')) {
        setActiveLoanError(errorDetail);
        toast.error('You already have an active loan');
      } else {
        toast.error(errorDetail || 'Failed to submit loan request');
      }
    } finally {
      setLoanSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSubmitting(true);

    try {
      await payrollService.createMyExpense({
        title: expenseFormData.title,
        amount: expenseFormData.amount,
        category: expenseFormData.category,
      });
      toast.success('Expense submitted successfully');
      setExpenseOpen(false);
      setExpenseFormData({ title: '', amount: '', category: '' });
      // Refresh expenses data
      await fetchExpenses();
    } catch (error: any) {
      console.error('Failed to submit expense:', error);
      const errorDetail = error?.response?.data?.detail || error?.response?.data?.error || error?.message;
      toast.error(errorDetail || 'Failed to submit expense');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteLoan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this loan request?')) return;
    try {
      await payrollService.deleteMyLoan(id);
      toast.success('Loan request deleted');
      await fetchLoans();
    } catch (error: any) {
      console.error('Failed to delete loan:', error);
      const errorDetail = error?.response?.data?.detail || error?.message;
      toast.error(errorDetail || 'Failed to delete loan request');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await payrollService.deleteMyExpense(id);
      toast.success('Expense deleted');
      await fetchExpenses();
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      const errorDetail = error?.response?.data?.detail || error?.message;
      toast.error(errorDetail || 'Failed to delete expense');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Loans & Expenses</h1>
          <p className="text-muted-foreground">Manage your loan requests and expense submissions</p>
        </div>

        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="loans"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Banknote className="mr-2 h-4 w-4" />
              My Loans
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Receipt className="mr-2 h-4 w-4" />
              My Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Loan Management</h2>
                <p className="text-muted-foreground">Request salary advances and track loan status</p>
              </div>
              <Dialog open={loanOpen} onOpenChange={(open) => {
                setLoanOpen(open);
                if (!open) setActiveLoanError(null);
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                    disabled={hasActiveLoan}
                    title={hasActiveLoan ? 'You already have an active loan' : 'Request a new loan'}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Request Loan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Loan</DialogTitle>
                    <DialogDescription>Submit a new loan or advance request</DialogDescription>
                  </DialogHeader>

                  {activeLoanError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{activeLoanError}</AlertDescription>
                    </Alert>
                  )}

                  {hasActiveLoan && !activeLoanError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You already have an active loan application or ongoing loan. You cannot apply for a new loan until the current one is CLOSED or REJECTED.
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleLoanSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Loan Amount (₨)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50000"
                        min="1"
                        value={loanFormData.amount}
                        onChange={(e) => setLoanFormData({ ...loanFormData, amount: e.target.value })}
                        required
                        disabled={hasActiveLoan}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installment">Monthly Installment (₨)</Label>
                      <Input
                        id="installment"
                        type="number"
                        placeholder="5000"
                        min="1"
                        value={loanFormData.installment}
                        onChange={(e) => setLoanFormData({ ...loanFormData, installment: e.target.value })}
                        required
                        disabled={hasActiveLoan}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                      disabled={loanSubmitting || hasActiveLoan}
                    >
                      {loanSubmitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {hasActiveLoan && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have an active loan. New loan requests are disabled until your current loan is closed or rejected.
                </AlertDescription>
              </Alert>
            )}

            {loansLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {loans.map((loan) => {
                  const totalMonths = Math.ceil(loan.amount / loan.installment);
                  const progress = loan.remaining_amount != null
                    ? ((loan.amount - loan.remaining_amount) / loan.amount) * 100
                    : 0;
                  const dateStr = loan.requested_on || loan.created_at;

                  return (
                    <Card key={loan.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Banknote className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                Loan - ₨{loan.amount.toLocaleString()}
                                {loan.status && (
                                  <Badge variant={getStatusVariant(loan.status)}>
                                    {loan.status}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                Monthly: ₨{loan.installment.toLocaleString()} × {totalMonths} months
                                {dateStr && ` • ${new Date(dateStr).toLocaleDateString()}`}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Remaining</p>
                              <p className="text-xl font-bold text-foreground">
                                ₨{(loan.remaining_amount ?? loan.amount).toLocaleString()}
                              </p>
                            </div>
                            {loan.status?.toUpperCase() === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteLoan(loan.id)}
                                title="Delete loan request"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {loans.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">No active loans</p>
                      <p className="text-sm text-muted-foreground">Click "Request Loan" to apply</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Expense Management</h2>
                <p className="text-muted-foreground">Track and submit your business expenses</p>
              </div>
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                    <DialogDescription>Submit a new expense for reimbursement</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Office Supplies"
                        value={expenseFormData.title}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₨)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1200"
                        min="1"
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="Stationery"
                        value={expenseFormData.category}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                      disabled={expenseSubmitting}
                    >
                      {expenseSubmitting ? 'Submitting...' : 'Submit Expense'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {expensesLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {expenses.map((expense) => {
                  const dateStr = expense.submitted_on || expense.created_at;
                  return (
                    <Card key={expense.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {expense.title}
                                {expense.status && (
                                  <Badge variant={getStatusVariant(expense.status)}>
                                    {expense.status}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {expense.category} • {dateStr ? new Date(dateStr).toLocaleDateString() : '-'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-2xl font-bold text-foreground">₨{expense.amount.toLocaleString()}</p>
                            {expense.status?.toUpperCase() === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteExpense(expense.id)}
                                title="Delete expense"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}

                {expenses.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">No expenses recorded</p>
                      <p className="text-sm text-muted-foreground">Click "Add Expense" to submit</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LoanExpense;
