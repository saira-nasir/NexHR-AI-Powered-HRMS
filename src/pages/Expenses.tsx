import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import payrollService from '@/services/payrollService';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Receipt, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface ExpenseItem {
  id: number;
  employee: number;
  employee_name?: string;
  title: string;
  amount: number | string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_on?: string;
  reviewed_on?: string | null;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Transport: 'bg-blue-100 text-blue-800',
    Food: 'bg-green-100 text-green-800',
    Office: 'bg-purple-100 text-purple-800',
    Travel: 'bg-orange-100 text-orange-800',
    Equipment: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: '', employee: '' });

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await payrollService.listExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load expenses', err);
      toast({ title: 'Error', description: 'Failed to load expense claims', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await payrollService.approveExpense(id);
      toast({ title: 'Expense approved' });
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to approve expense', variant: 'destructive' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await payrollService.rejectExpense(id);
      toast({ title: 'Expense rejected' });
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to reject expense', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    const payload: any = {
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
    };
    if (form.employee) payload.employee = Number(form.employee);

    try {
      await payrollService.createExpense(payload);
      toast({ title: 'Expense created' });
      setCreateOpen(false);
      setForm({ title: '', amount: '', category: '', employee: '' });
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create expense', variant: 'destructive' });
    }
  };

  const openDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      setSelectedExpense(null);
      setDetailsOpen(true);
      const data = await payrollService.getExpense(id);
      setSelectedExpense(data || null);
    } catch (err) {
      console.error('Failed to load expense details', err);
      toast({ title: 'Error', description: 'Failed to load expense details', variant: 'destructive' });
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedExpense(null);
  };

  // Small helper to style status badge according to project palette
  const getStatusBadgeStyles = (status?: string) => {
    const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';
    switch ((status || '').toUpperCase()) {
      case 'APPROVED':
        return `${base} bg-[#28A745] text-white`;
      case 'REJECTED':
        return `${base} bg-[#DC3545] text-white`;
      case 'PENDING':
        return `${base} bg-[#FFC107] text-[#333333]`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const user = useSelector((s: RootState) => s.auth.user as any);
  const userRole = user?.role || (user?.roles && user.roles[0]) || 'Unknown';

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground">Review and approve employee expense claims</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <div>Signed in as: <span className="font-medium">{user?.email || '—'}</span></div>
          <div>Role: <span className="font-medium">{userRole}</span></div>
          {userRole !== 'Finance Manager' && (
            <div className="text-xs text-red-600 mt-1">Note: This page requires Finance Manager role to manage approvals. You may be redirected.</div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
        </div>
      </div>

      {pendingCount > 0 && (
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-warning" />
              Pending Expense Claims
            </CardTitle>
            <CardDescription>Review and approve or reject employee expense claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.filter(e => e.status === 'PENDING').map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold">{expense.employee_name || `Employee #${expense.employee}`}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>{expense.category}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Title</p>
                        <p className="font-medium">{expense.title}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{Number(expense.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted On</p>
                        <p className="font-medium">{expense.submitted_on ? new Date(expense.submitted_on).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" onClick={() => handleApprove(expense.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(expense.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDetails(expense.id)}><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Expense Claims</CardTitle>
          <CardDescription>Complete history of employee expense claims</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4">Employee</th>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Submitted Date</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 font-medium">{expense.employee_name || `Employee #${expense.employee}`}</td>
                    <td className="p-4">{expense.title}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>{expense.category}</span></td>
                    <td className="p-4">₹{Number(expense.amount).toLocaleString()}</td>
                    <td className="p-4">
                      {expense.status === 'PENDING' ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      ) : expense.status === 'APPROVED' ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
                      )}
                    </td>
                    <td className="p-4">{expense.submitted_on ? new Date(expense.submitted_on).toLocaleDateString() : '—'}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {expense.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApprove(expense.id)}><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(expense.id)}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openDetails(expense.id)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="Amount" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input placeholder="Employee ID (optional)" value={form.employee} onChange={(e) => setForm(f => ({ ...f, employee: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-lg font-semibold" style={{ color: '#333333' }}>Expense Details</DialogTitle>
            </div>
          </DialogHeader>

          <Card className="mt-2 rounded-lg shadow-sm" style={{ background: '#F8F9FA' }}>
            <CardContent className="p-4">
              {detailsLoading && <div className="py-6 text-center text-sm" style={{ color: '#6c757d' }}>Loading details…</div>}
              {!detailsLoading && !selectedExpense && <div className="py-6 text-center text-sm" style={{ color: '#6c757d' }}>No details available.</div>}

              {!detailsLoading && selectedExpense && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <div className="text-sm" style={{ color: '#6c757d' }}>Title</div>
                      <div className="text-lg font-semibold" style={{ color: '#333333' }}>{selectedExpense.title}</div>
                      <div className="text-sm mt-1" style={{ color: '#6c757d' }}>{selectedExpense.employee_name || `Employee #${selectedExpense.employee}`}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs" style={{ color: '#6c757d' }}>Category</div>
                        <div className="font-medium" style={{ color: '#333333' }}>{selectedExpense.category}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#6c757d' }}>Submitted On</div>
                        <div className="font-medium" style={{ color: '#333333' }}>{selectedExpense.submitted_on ? new Date(selectedExpense.submitted_on).toLocaleString() : '—'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs" style={{ color: '#6c757d' }}>Reviewed On</div>
                      <div className="font-medium" style={{ color: '#333333' }}>{selectedExpense.reviewed_on ? new Date(selectedExpense.reviewed_on).toLocaleDateString() : '—'}</div>
                    </div>

                    <div>
                      <div className="text-xs" style={{ color: '#6c757d' }}>Notes / Description</div>
                      <div className="mt-2 p-3 rounded" style={{ background: '#FFFFFF', color: '#333333', border: '1px solid #e9ecef' }}>
                        {(selectedExpense as any).notes || (selectedExpense as any).description || '—'}
                      </div>
                    </div>

                    {/* Attachments */}
                    {((selectedExpense as any).attachments || (selectedExpense as any).files) && (
                      <div>
                        <div className="text-xs" style={{ color: '#6c757d' }}>Attachments</div>
                        <div className="mt-2 space-y-2">
                          {(((selectedExpense as any).attachments || (selectedExpense as any).files) as any[]).length === 0 && (
                            <div className="text-sm" style={{ color: '#6c757d' }}>No attachments</div>
                          )}
                          {(((selectedExpense as any).attachments || (selectedExpense as any).files) as any[]).map((file: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: '#FFFFFF', border: '1px solid #e9ecef' }}>
                              <div className="text-sm" style={{ color: '#333333' }}>{file.name || file.filename || `File ${i + 1}`}</div>
                              {file.url ? (
                                <a className="text-sm" href={file.url} target="_blank" rel="noreferrer" style={{ color: '#4A90E2' }}>Open</a>
                              ) : (
                                <div className="text-sm" style={{ color: '#6c757d' }}>No URL</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className="flex flex-col items-start md:items-end gap-3">
                    <div className="text-sm" style={{ color: '#6c757d' }}>Amount</div>
                    <div className="text-2xl font-extrabold" style={{ color: '#333333' }}>₹{Number(selectedExpense.amount).toLocaleString()}</div>

                    <div className={getStatusBadgeStyles(selectedExpense.status)}>{(selectedExpense.status || '').toUpperCase()}</div>

                    <div className="w-full md:w-auto mt-2 flex flex-col gap-2">
                      <Button onClick={closeDetails} variant="outline" className="w-full md:w-auto">Close</Button>
                      {selectedExpense && selectedExpense.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleApprove(selectedExpense.id)} className="bg-[#28A745] hover:bg-[#228B3B]"><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                          <Button variant="destructive" onClick={() => handleReject(selectedExpense.id)} className="bg-[#DC3545] hover:bg-[#c82333]"><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
