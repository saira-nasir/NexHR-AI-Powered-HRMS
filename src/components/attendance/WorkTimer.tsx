import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface WorkTimerProps {
  startTime: Date | null;
  checkOutTime?: Date | null;
  className?: string;
}

export const WorkTimer: React.FC<WorkTimerProps> = ({ startTime, checkOutTime, className = '' }) => {
  const [elapsed, setElapsed] = useState<string>('00:00:00');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!startTime) {
      setIsRunning(false);
      setElapsed('00:00:00');
      return;
    }

    // Validate that startTime is a valid date
    if (isNaN(startTime.getTime())) {
      console.error('Invalid startTime in WorkTimer:', startTime);
      setIsRunning(false);
      setElapsed('00:00:00');
      return;
    }

    // Immediately calculate elapsed time on mount/update
    const calculateElapsed = (endTime: Date) => {
      const diff = endTime.getTime() - startTime.getTime();
      if (diff < 0) {
        console.warn('End time is before start time in WorkTimer');
        return '00:00:00';
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (checkOutTime) {
      // Validate checkOutTime
      if (isNaN(checkOutTime.getTime())) {
        console.warn('Invalid checkOutTime, keeping timer running');
        // Invalid check-out time, keep timer running
        setIsRunning(true);
        // Set initial value immediately
        setElapsed(calculateElapsed(new Date()));
        const interval = setInterval(() => {
          setElapsed(calculateElapsed(new Date()));
        }, 1000);
        return () => clearInterval(interval);
      }

      // Timer stopped - calculate final duration
      // Set initial value immediately
      setElapsed(calculateElapsed(checkOutTime));
      setIsRunning(false);
      return;
    }

    // Timer is running - update every second
    setIsRunning(true);
    // Set initial value immediately
    setElapsed(calculateElapsed(new Date()));
    
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, checkOutTime]);

  if (!startTime) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <Clock className={`w-5 h-5 text-blue-600 ${isRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">
              {isRunning ? 'Work Time' : 'Total Duration'}
            </div>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {elapsed}
            </div>
          </div>
          {isRunning && (
            <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              Active
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

