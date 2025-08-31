import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, FileText, MessageCircle } from 'lucide-react';

export interface QuickActionsCardProps {
  onCheckInOut?: () => void;
  onRequestLeave?: () => void;
  onViewPayslip?: () => void;
  onHRSupport?: () => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ onCheckInOut, onRequestLeave, onViewPayslip, onHRSupport }) => {
  const actions = [
    { icon: <Clock className="w-6 h-6" />, label: 'Check In/Out', onClick: onCheckInOut },
    { icon: <Calendar className="w-6 h-6" />, label: 'Request Leave', onClick: onRequestLeave },
    { icon: <FileText className="w-6 h-6" />, label: 'View Payslip', onClick: onViewPayslip },
    { icon: <MessageCircle className="w-6 h-6" />, label: 'HR Support', onClick: onHRSupport },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              className="h-20 flex-col gap-2 bg-transparent"
              variant="outline"
              onClick={action.onClick}
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;


