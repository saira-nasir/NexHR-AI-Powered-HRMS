import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export interface LeaveBalanceCardProps {
  available: number;
  used: number;
  pending: number;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ available, used, pending }) => {
  return (
    <Card className="group relative overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500" />
          <CardTitle className="text-sm font-medium text-gray-600">Leave Balance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-green-600">{available}</p>
        <p className="text-sm text-muted-foreground">days available</p>
        <div className="flex gap-4 mt-3 text-xs font-medium">
          <span className="text-gray-600">Used: <span className="text-orange-500">{used}</span></span>
          <span className="text-gray-600">Pending: <span className="text-purple-500">{pending}</span></span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;



