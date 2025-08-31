import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ActiveEmployeesCardProps {
  count: number;
  newHires: number;
}

const ActiveEmployeesCard: React.FC<ActiveEmployeesCardProps> = ({ count, newHires }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Active Employees</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{count}</div>
        <p className="text-xs text-muted-foreground">+{newHires} new hires this month</p>
      </CardContent>
    </Card>
  );
};

export default ActiveEmployeesCard;
