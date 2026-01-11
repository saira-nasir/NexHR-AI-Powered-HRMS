import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import payrollService, { Payroll } from '@/services/payrollService';

interface PayrollSelectionTableProps {
    onProceed: (selectedIds: number[]) => void;
}

const PayrollSelectionTable: React.FC<PayrollSelectionTableProps> = ({ onProceed }) => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingPayrolls();
    }, []);

    const loadPendingPayrolls = async () => {
        try {
            setLoading(true);
            // Fetch all payrolls and filter for PENDING (or implementation-specific pending logic)
            const all = await payrollService.listPayrollsWithEmployees();
            const pending = all.filter(p => p.payment_status === 'PENDING');
            setPayrolls(pending);
            // Auto-select all by default? Or none? Let's select none.
        } catch (error) {
            console.error('Failed to load payrolls', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(payrolls.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const totalAmount = payrolls
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);

    return (
        <Card className="border-l-4 border-l-purple-500 h-full flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">Select Payrolls for Payment</CardTitle>
                        <CardDescription>Choose pending payrolls to process in bulk</CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                        <Button
                            onClick={() => onProceed(selectedIds)}
                            disabled={selectedIds.length === 0}
                            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                            size="lg"
                        >
                            Proceed ({selectedIds.length})
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {selectedIds.length > 0 && (
                    <div className="mb-6 p-4 bg-purple-50 text-purple-800 rounded-lg border border-purple-100 flex justify-between items-center shadow-sm">
                        <span className="font-semibold flex items-center gap-2">
                            <span className="bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
                            Payrolls Selected
                        </span>
                        <span className="font-bold text-xl">Total: ${totalAmount.toLocaleString()}</span>
                    </div>
                )}

                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="p-4 w-16 text-center">
                                    <Checkbox
                                        checked={selectedIds.length === payrolls.length && payrolls.length > 0}
                                        onCheckedChange={(c) => handleSelectAll(c as boolean)}
                                    />
                                </th>
                                <th className="p-4 text-left font-semibold text-muted-foreground">Period</th>
                                <th className="p-4 text-left font-semibold text-muted-foreground">Employee</th>
                                <th className="p-4 text-left font-semibold text-muted-foreground">Net Salary</th>
                                <th className="p-4 text-center font-semibold text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-muted-foreground">Loading pending payrolls...</td>
                                </tr>
                            ) : payrolls.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-muted-foreground">No pending payrolls found. Calculate some payrolls first.</td>
                                </tr>
                            ) : (
                                payrolls.map(payroll => (
                                    <tr key={payroll.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(payroll.id)}
                                                onCheckedChange={(c) => handleSelectOne(payroll.id, c as boolean)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{payroll.period_start}</div>
                                            <div className="text-xs text-muted-foreground">to {payroll.period_end}</div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            {(payroll as any).employee_name || `Employee #${payroll.employee}`}
                                        </td>
                                        <td className="p-4 font-mono font-medium">${(Number(payroll.net_salary) || 0).toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 px-3 py-1">
                                                {payroll.payment_status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default PayrollSelectionTable;
