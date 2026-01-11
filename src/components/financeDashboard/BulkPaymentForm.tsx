import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import payrollService, { Payroll } from '@/services/payrollService';

interface BulkPaymentFormProps {
    selectedPayrollIds: number[];
    onSuccess?: () => void;
    onError?: (message: string) => void;
    onResult?: (result: any) => void;
    onBack?: () => void;
}

const BulkPaymentForm: React.FC<BulkPaymentFormProps> = ({ selectedPayrollIds, onSuccess, onError, onResult, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [useStripe, setUseStripe] = useState(true);
    const [period, setPeriod] = useState({ start: '', end: '' });

    const [calculating, setCalculating] = useState(true);

    useEffect(() => {
        calculateTotal();
    }, [selectedPayrollIds]);

    const calculateTotal = async () => {
        try {
            setCalculating(true);
            const all = await payrollService.listPayrolls();
            const selected = all.filter(p => selectedPayrollIds.includes(p.id));
            const sum = selected.reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
            setTotalAmount(sum);

            if (selected.length > 0) {
                const starts = selected.map(p => p.period_start).sort();
                const ends = selected.map(p => p.period_end).sort();
                setPeriod({
                    start: starts[0] || '',
                    end: ends[ends.length - 1] || ''
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async () => {
        if (selectedPayrollIds.length === 0) {
            onError?.("No payrolls selected");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                period_start: period.start,
                period_end: period.end,
                total_amount: totalAmount,
                payrolls: selectedPayrollIds,
                use_stripe: useStripe // Critical flag for backend
            };

            const result = await payrollService.createBulkPayment(payload);

            if (onResult) {
                onResult(result);
            } else {
                onSuccess?.();
            }
        } catch (err: any) {
            console.error("Payment failed", err);
            const msg = err.response?.data?.detail || err.message || "Payment processing failed";
            onError?.(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-l-4 border-l-blue-600 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="mr-1 h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Confirm Payment
                </CardTitle>
                <CardDescription>Review the total amount and process payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Selected Payrolls:</span>
                        <span className="font-medium">{selectedPayrollIds.length}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        {calculating ? (
                            <span className="flex items-center text-muted-foreground text-base font-normal">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...
                            </span>
                        ) : (
                            <span className="text-blue-700">${totalAmount.toLocaleString()}</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Lock className="w-3 h-3" /> Secure transaction via Stripe
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setUseStripe(!useStripe)}>
                        <Checkbox id="use_stripe" checked={useStripe} onCheckedChange={(c) => setUseStripe(c as boolean)} />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="use_stripe"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Process via Stripe
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Mock payment processing for demonstration
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-lg" onClick={handleSubmit} disabled={loading || calculating}>
                    {loading ? 'Processing...' : calculating ? 'Calculating...' : `Pay $${totalAmount.toLocaleString()}`}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default BulkPaymentForm;
