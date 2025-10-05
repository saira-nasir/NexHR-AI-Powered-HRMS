import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export interface PayrollData {
  lastPayment: string;
  nextPayDate: string;
  ytdEarnings: string;
}

export interface PayrollSummaryCardProps {
  payrollData: PayrollData;
  onDownloadPayslip?: () => void;
}

const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({ payrollData, onDownloadPayslip }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payroll Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Payment</span>
            <span className="font-semibold">{payrollData.lastPayment}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Next Pay Date</span>
            <span className="font-semibold">{payrollData.nextPayDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">YTD Earnings</span>
            <span className="font-semibold">{payrollData.ytdEarnings}</span>
          </div>
          <Button className="w-full mt-4 bg-transparent" variant="outline" onClick={onDownloadPayslip}>
            <FileText className="w-4 h-4 mr-2" />
            Download Latest Payslip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollSummaryCard;


