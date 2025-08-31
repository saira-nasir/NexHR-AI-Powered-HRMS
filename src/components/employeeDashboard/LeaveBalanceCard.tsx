import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LeaveBalanceCardProps {
  available: number;
  used: number;
  pending: number;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ available, used, pending }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-green-600">{available}</p>
        <p className="text-sm text-muted-foreground">days available</p>
        <div className="flex gap-4 mt-3 text-xs">
          <span>Used: {used}</span>
          <span>Pending: {pending}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;


