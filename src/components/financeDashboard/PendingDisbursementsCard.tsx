import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface PendingDisbursementsCardProps {
  count: number;
  totalAmount: string;
}

const PendingDisbursementsCard: React.FC<PendingDisbursementsCardProps> = ({ count, totalAmount }) => {
  return (
    <Card className="relative overflow-hidden border border-gray-100 rounded-lg p-3 hover:shadow-md transition-all duration-200 group bg-white min-h-[108px]">
      <div style={{ background: '#6C63FF' }} className="absolute left-0 top-0 h-full w-1 opacity-10 rounded-l-md pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium group-hover:text-[#6C63FF] transition-colors">Pending Disbursements</CardTitle>
        <Send className="h-4 w-4 text-muted-foreground group-hover:text-[#6C63FF] transition-colors" />
      </CardHeader>
      <CardContent className="pl-3">
        <div className="text-xl font-semibold text-gray-900 group-hover:text-[#6C63FF] transition-colors">{count}</div>
        <p className="text-[11px] text-gray-500 mt-1">{totalAmount} total amount</p>
      </CardContent>
    </Card>
  );
};

export default PendingDisbursementsCard;
