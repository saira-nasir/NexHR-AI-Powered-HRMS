import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet, apiPost } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Loan {
  id: number;
  amount: number;
  installment: number;
  remaining_amount?: number;
  status?: string;
  created_at: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  status?: string;
}

const LoanExpense: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [loanOpen, setLoanOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [loanFormData, setLoanFormData] = useState({
    amount: '',
    installment: '',
  });
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    amount: '',
    category: '',
  });

  // Decode user id from JWT access token
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || null;
    } catch {
      return null;
    }
  };

  // Fetch loans data
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await apiGet('/payroll/loans/');
        const normalized = (Array.isArray(data) ? data : []).map((l: any) => ({
          ...l,
          amount: Number(l.amount),
          installment: Number(l.installment),
          remaining_amount: l.remaining_balance != null ? Number(l.remaining_balance) : undefined,
        }));
        setLoans(normalized);
      } catch (error) {
        toast.error('Failed to fetch loans');
      } finally {
        setLoansLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // Fetch expenses data
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await apiGet('/payroll/expenses/');
        const normalized = (Array.isArray(data) ? data : []).map((e: any) => ({
          ...e,
          amount: Number(e.amount),
        }));
        setExpenses(normalized);
      } catch (error) {
        toast.error('Failed to fetch expenses');
      } finally {
        setExpensesLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = getUserId();
    if (!employee) {
      toast.error('User not identified. Please log in again.');
      return;
    }
    try {
      await apiPost('/payroll/loans/', {
        employee,
        amount: String(loanFormData.amount),
        installment: String(loanFormData.installment),
        remaining_balance: String(loanFormData.amount),
      });
      toast.success('Loan request submitted successfully');
      setLoanOpen(false);
      setLoanFormData({ amount: '', installment: '' });
      // Refresh loans data
      const data = await apiGet('/payroll/loans/');
      const normalized = (Array.isArray(data) ? data : []).map((l: any) => ({
        ...l,
        amount: Number(l.amount),
        installment: Number(l.installment),
        remaining_amount: l.remaining_balance != null ? Number(l.remaining_balance) : undefined,
      }));
      setLoans(normalized);
    } catch (error) {
      toast.error('Failed to submit loan request');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = getUserId();
    if (!employee) {
      toast.error('User not identified. Please log in again.');
      return;
    }
    try {
      await apiPost('/payroll/expenses/', {
        employee,
        title: expenseFormData.title,
        amount: String(expenseFormData.amount),
        category: expenseFormData.category,
      });
      toast.success('Expense submitted successfully');
      setExpenseOpen(false);
      setExpenseFormData({ title: '', amount: '', category: '' });
      // Refresh expenses data
      const data = await apiGet('/payroll/expenses/');
      const normalized = (Array.isArray(data) ? data : []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
      }));
      setExpenses(normalized);
    } catch (error) {
      toast.error('Failed to submit expense');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loan & Expense</h1>
          <p className="text-muted-foreground">Manage your loan requests and expense submissions</p>
        </div>

        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="loans" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Loans
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Loan Management</h2>
                <p className="text-muted-foreground">Request salary advances and track loan status</p>
              </div>
              <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Request Loan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Loan</DialogTitle>
                    <DialogDescription>Submit a new loan or advance request</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLoanSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Loan Amount (₨)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50000"
                        value={loanFormData.amount}
                        onChange={(e) => setLoanFormData({ ...loanFormData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installment">Monthly Installment (₨)</Label>
                      <Input
                        id="installment"
                        type="number"
                        placeholder="5000"
                        value={loanFormData.installment}
                        onChange={(e) => setLoanFormData({ ...loanFormData, installment: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                      Submit Request
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loansLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {loans.map((loan) => {
                  const totalMonths = Math.ceil(loan.amount / loan.installment);
                  const progress = loan.remaining_amount != null
                    ? ((loan.amount - loan.remaining_amount) / loan.amount) * 100
                    : 0;

                  return (
                    <Card key={loan.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Banknote className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg">Loan - ₨{loan.amount.toLocaleString()}</CardTitle>
                              <CardDescription>
                                Monthly: ₨{loan.installment.toLocaleString()} × {totalMonths} months
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-xl font-bold text-foreground">
                              ₨{(loan.remaining_amount ?? loan.amount).toLocaleString()}
                            </p>
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
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                      Submit Expense
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {expensesLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {expenses.map((expense) => (
                  <Card key={expense.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{expense.title}</CardTitle>
                            <CardDescription>
                              {expense.category} • {new Date(expense.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">₨{expense.amount.toLocaleString()}</p>
                          {expense.status && (
                            <p className="text-sm text-muted-foreground capitalize">{expense.status}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}

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
