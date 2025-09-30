import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Disbursement {
  employee: string;
  employeeId?: number;
  amount: number;
  status: 'Completed' | 'Pending' | 'Processing';
  date: string;
}

interface RecentDisbursementsCardProps {
  disbursements: Disbursement[];
}

const RecentDisbursementsCard: React.FC<RecentDisbursementsCardProps> = ({ disbursements }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Processing':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="rounded-lg border border-gray-100 bg-white hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 group border-l-4 border-[#6C63FF]/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="group-hover:text-[#6C63FF] transition-colors text-lg">Recent Salary Disbursements</CardTitle>
        <CardDescription className="text-sm text-gray-500">Latest salary payments via banking API</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {disbursements.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <p className="font-medium text-gray-900">{transaction.employee}</p>
                <p className="text-xs text-gray-500">
                  {transaction.employeeId && `ID: ${transaction.employeeId} \u2022 `}{transaction.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusVariant(transaction.status)}>
                  {transaction.status}
                </Badge>
                <span className="font-semibold text-gray-900">${transaction.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentDisbursementsCard;
