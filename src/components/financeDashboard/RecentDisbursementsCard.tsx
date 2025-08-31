import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Disbursement {
  employee: string;
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
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader>
        <CardTitle className="group-hover:text-primary transition-colors">Recent Salary Disbursements</CardTitle>
        <CardDescription>Latest salary payments via banking API</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {disbursements.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <p className="font-medium text-gray-900">{transaction.employee}</p>
                <p className="text-sm text-muted-foreground">{transaction.date}</p>
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
