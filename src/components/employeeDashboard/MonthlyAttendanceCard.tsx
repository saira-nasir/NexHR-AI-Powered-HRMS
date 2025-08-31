import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface MonthlyAttendanceCardProps {
  attendanceRate: number;
}

const MonthlyAttendanceCard: React.FC<MonthlyAttendanceCardProps> = ({ attendanceRate }) => {
  const getPerformanceMessage = (rate: number) => {
    if (rate >= 95) return 'Excellent performance!';
    if (rate >= 85) return 'Good performance';
    if (rate >= 75) return 'Average performance';
    return 'Needs improvement';
  };

  const getMessageColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Monthly Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{attendanceRate}%</p>
        <p className="text-sm text-muted-foreground mb-3">attendance rate</p>
        <Progress value={attendanceRate} className="h-2" />
        <p className={`text-xs mt-2 ${getMessageColor(attendanceRate)}`}>{getPerformanceMessage(attendanceRate)}</p>
      </CardContent>
    </Card>
  );
};

export default MonthlyAttendanceCard;


