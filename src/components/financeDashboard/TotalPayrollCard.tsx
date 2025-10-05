import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpRight } from 'lucide-react';

interface TotalPayrollCardProps {
  amount: string;
  percentageChange: string;
}

const TotalPayrollCard: React.FC<TotalPayrollCardProps> = ({ amount, percentageChange }) => {
  return (
    <Card className="relative overflow-hidden border border-gray-100 rounded-lg p-3 hover:shadow-md transition-all duration-200 group bg-white min-h-[108px]">
      {/* left accent stripe */}
      <div style={{ background: '#6C63FF' }} className="absolute left-0 top-0 h-full w-1 opacity-10 rounded-l-md pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium group-hover:text-[#6C63FF] transition-colors">Total Payroll</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-[#6C63FF] transition-colors" />
      </CardHeader>
      <CardContent className="pl-3">
        <div className="text-xl font-semibold text-gray-900 group-hover:text-[#6C63FF] transition-colors">{amount}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
          <span className="text-[11px] text-gray-500">{percentageChange} from last month</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalPayrollCard;
