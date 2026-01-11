import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkPaymentResultsProps {
    result: any;
    onClose: () => void;
}

const BulkPaymentResults: React.FC<BulkPaymentResultsProps> = ({ result, onClose }) => {
    const status = result?.status || 'UNKNOWN';
    const isSuccess = status === 'COMPLETED';
    const isPartial = status === 'PARTIAL';
    const isFailed = status === 'FAILED';

    // Try to parse stripe result if available (it might be nested)
    const stripeResult = result?.stripe_result || result?.stripe_response || {};
    const items = result?.items || result?.results || [];

    return (
        <Card className="w-full border-t-4 border-t-green-500 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    {isSuccess ? (
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    ) : isFailed ? (
                        <XCircle className="h-10 w-10 text-red-600" />
                    ) : (
                        <AlertTriangle className="h-10 w-10 text-yellow-600" />
                    )}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {isSuccess ? 'Payment Successful!' : isFailed ? 'Payment Failed' : 'Payment Processed'}
                </CardTitle>
                <p className="text-muted-foreground">
                    Transaction ID: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{result?.id || 'N/A'}</span>
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Amount Processed</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">${Number(result?.total_amount || 0).toLocaleString()}</p>
                </div>

                {stripeResult && stripeResult.id && (
                    <div className="text-xs text-center text-muted-foreground border-t pt-2">
                        Stripe Payment Intent: {stripeResult.id}
                    </div>
                )}

                {items.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Payment Breakdown</p>
                        <ScrollArea className="h-48 rounded-md border p-2">
                            <div className="space-y-2">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white rounded shadow-sm">
                                        <div>
                                            <p className="font-medium">{item.employee_name || `Employee ${item.employee}`}</p>
                                            <p className="text-xs text-muted-foreground">{item.status}</p>
                                        </div>
                                        <div className="font-mono">
                                            ${Number(item.net_amount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>

            <CardFooter>
                <Button className="w-full" size="lg" onClick={onClose}>
                    Return to Dashboard
                </Button>
            </CardFooter>
        </Card>
    );
};

export default BulkPaymentResults;
