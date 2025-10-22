import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceStatus } from './StatusBadge';

interface CalendarDay {
  date: number;
  status?: AttendanceStatus;
  confidence?: number;
  isCurrentMonth: boolean;
}

interface AttendanceCalendarProps {
  year: number;
  month: number; // 0-indexed
  attendanceData: Map<string, { status: AttendanceStatus; confidence?: number }>;
  onDateClick: (date: string) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ year, month, attendanceData, onDateClick, onMonthChange }) => {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: daysInPrevMonth - i, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const attendance = attendanceData.get(dateKey);
      days.push({ date: i, status: attendance?.status, confidence: attendance?.confidence, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) days.push({ date: i, isCurrentMonth: false });
    return days;
  };

  const getStatusColor = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'late':
        return 'bg-yellow-500';
      case 'absent':
        return 'bg-red-500';
      case 'unverified':
        return 'bg-gray-400';
      case 'flagged':
        return 'bg-orange-500';
      default:
        return '';
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onMonthChange('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onMonthChange('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground p-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
            const isToday = day.isCurrentMonth && day.date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <button
                key={idx}
                onClick={() => day.isCurrentMonth && day.status && onDateClick(dateKey)}
                disabled={!day.isCurrentMonth || !day.status}
                className={`relative p-2 rounded-lg text-sm transition-all ${day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isToday ? 'ring-2 ring-blue-500' : ''} ${day.status && day.isCurrentMonth ? 'hover:bg-gray-100 cursor-pointer' : ''} ${!day.isCurrentMonth || !day.status ? 'cursor-default' : ''}`}
              >
                <div className="relative z-10">{day.date}</div>
                {day.status && day.isCurrentMonth && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getStatusColor(day.status)}`} />
                )}
                {day.confidence !== undefined && day.confidence < 85 && day.isCurrentMonth && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Present</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Late</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Absent</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />Low Confidence</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCalendar;


