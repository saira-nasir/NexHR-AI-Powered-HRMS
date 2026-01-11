import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export interface AttendanceStatusCardProps {
  status: string;
  checkInTime: string;
  workingHours: string;
}

const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({ status, checkInTime, workingHours }) => {
  const isCheckedIn = status === 'checked-in';

  return (
    <Card className="group relative overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Today's Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          {isCheckedIn ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className={`font-semibold capitalize ${isCheckedIn ? 'text-green-600' : 'text-gray-500'}`}>
            {status.replace('-', ' ')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Since {checkInTime}</p>
        <p className="text-2xl font-bold mt-2 text-gray-900">{workingHours}</p>
        <p className="text-xs text-muted-foreground">worked today</p>
      </CardContent>
    </Card>
  );
};

export default AttendanceStatusCard;



