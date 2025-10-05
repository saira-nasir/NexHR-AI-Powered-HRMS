import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export interface AttendanceStatusCardProps {
  status: string;
  checkInTime: string;
  workingHours: string;
}

const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({ status, checkInTime, workingHours }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold capitalize">{status.replace('-', ' ')}</span>
        </div>
        <p className="text-sm text-muted-foreground">Since {checkInTime}</p>
        <p className="text-lg font-bold mt-2">{workingHours}</p>
        <p className="text-xs text-muted-foreground">worked today</p>
      </CardContent>
    </Card>
  );
};

export default AttendanceStatusCard;


