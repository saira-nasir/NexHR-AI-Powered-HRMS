import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface WeeklyHoursCardProps {
  weeklyHours: string;
  targetHours?: number;
  percentage?: number;
}

const WeeklyHoursCard: React.FC<WeeklyHoursCardProps> = ({ weeklyHours, targetHours = 40, percentage = 0 }) => {
  return (
    <Card className="group relative overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-900">{weeklyHours}</p>
        <p className="text-sm text-purple-600 mb-3">of {targetHours}h target</p>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{percentage}% complete</p>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursCard;



