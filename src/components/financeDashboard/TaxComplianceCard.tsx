import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface TaxComplianceCardProps {
  percentage: number;
  pendingReview: number;
}

const TaxComplianceCard: React.FC<TaxComplianceCardProps> = ({ percentage, pendingReview }) => {
  return (
    <Card className="transition-transform transform hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden border border-gray-100">
      <div className="flex">
        <div className="w-1 bg-gradient-to-b from-[#6C63FF] to-[#FF6B6B]" />
        <div className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 py-3">
            <CardTitle className="text-sm font-medium">Tax Compliance</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <div className="text-xl font-semibold">{percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingReview}% pending review</p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default TaxComplianceCard;
