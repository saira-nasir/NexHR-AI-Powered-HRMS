import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpRight } from 'lucide-react';

interface TotalPayrollCardProps {
  amount: string;
  percentageChange: string;
}

const TotalPayrollCard: React.FC<TotalPayrollCardProps> = ({ amount, percentageChange }) => {
  return (
    <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
      <div className="flex">
        <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
        <div className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <div className="text-xl font-semibold">{amount}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span>{percentageChange} from last month</span>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default TotalPayrollCard;
