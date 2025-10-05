import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface WeeklyHoursCardProps {
  weeklyHours: string;
  targetHours?: number;
  percentage?: number;
}

const WeeklyHoursCard: React.FC<WeeklyHoursCardProps> = ({ weeklyHours, targetHours = 40, percentage = 96 }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{weeklyHours}</p>
        <p className="text-sm text-muted-foreground mb-3">of {targetHours}h target</p>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{percentage}% complete</p>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursCard;


