import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, AlertCircle } from 'lucide-react';

export interface PayrollData {
  lastPayment: string;
  nextPayDate: string;
  ytdEarnings: string;
}

export interface PayrollSummaryCardProps {
  payrollData?: PayrollData | null;
  onDownloadPayslip?: () => void;
}

const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({ payrollData, onDownloadPayslip }) => {
  const hasData = payrollData && payrollData.lastPayment !== 'N/A';

  return (
    <Card className="group relative overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-purple-500" />
          <CardTitle className="text-lg text-gray-800">Payroll Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Payment</span>
              <span className="font-semibold text-green-600">{payrollData!.lastPayment}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next Pay Date</span>
              <span className="font-semibold text-gray-800">{payrollData!.nextPayDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">No payroll data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your payroll information will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollSummaryCard;



