import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ActiveEmployeesCardProps {
  count: number;
  newHires: number;
}

const ActiveEmployeesCard: React.FC<ActiveEmployeesCardProps> = ({ count, newHires }) => {
  return (
    <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
      <div className="flex">
        <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
        <div className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <div className="text-xl font-semibold">{count}</div>
            <p className="text-xs text-muted-foreground mt-1">+{newHires} new hires this month</p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default ActiveEmployeesCard;
