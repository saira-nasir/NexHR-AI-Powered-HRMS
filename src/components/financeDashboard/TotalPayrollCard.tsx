import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpRight } from 'lucide-react';

interface TotalPayrollCardProps {
  amount: string;
  percentageChange: string;
}

const TotalPayrollCard: React.FC<TotalPayrollCardProps> = ({ amount, percentageChange }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Total Payroll</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{amount}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
          {percentageChange} from last month
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalPayrollCard;
