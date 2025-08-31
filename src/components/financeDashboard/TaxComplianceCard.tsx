import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface TaxComplianceCardProps {
  percentage: number;
  pendingReview: number;
}

const TaxComplianceCard: React.FC<TaxComplianceCardProps> = ({ percentage, pendingReview }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Tax Compliance</CardTitle>
        <Calculator className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{percentage}%</div>
        <p className="text-xs text-muted-foreground">{pendingReview}% pending review</p>
      </CardContent>
    </Card>
  );
};

export default TaxComplianceCard;
