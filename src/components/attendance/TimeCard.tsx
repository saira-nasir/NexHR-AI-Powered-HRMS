import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Smartphone } from 'lucide-react';
import FaceThumbnail from './FaceThumbnail';
import StatusBadge, { AttendanceStatus } from './StatusBadge';
import ConfidenceBadge from './ConfidenceBadge';

export interface TimeCardData {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  confidence?: number;
  faceImageUrl?: string;
  device?: string;
  location?: string;
  duration?: string;
}

interface TimeCardProps {
  data: TimeCardData;
  onClick?: () => void;
  compact?: boolean;
}

export const TimeCard: React.FC<TimeCardProps> = ({ data, onClick, compact = false }) => {
  return (
    <Card className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${compact ? 'p-3' : ''}`} onClick={onClick}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <FaceThumbnail imageUrl={data.faceImageUrl} confidence={data.confidence} size={compact ? 'sm' : 'md'} clickable={!compact} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={compact ? 'text-sm' : ''}>{data.date}</span>
                <StatusBadge status={data.status} size={compact ? 'sm' : 'md'} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>In: {data.checkIn || '-'}</span>
                  {data.checkOut && <span className="ml-2">Out: {data.checkOut}</span>}
                </div>

                {data.duration && <div className="text-sm text-muted-foreground">Duration: {data.duration}</div>}

                {!compact && (
                  <>
                    {data.device && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Smartphone className="w-3 h-3" />
                        <span>{data.device}</span>
                      </div>
                    )}

                    {data.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{data.location}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {data.confidence !== undefined && !compact && (
            <div>
              <ConfidenceBadge confidence={data.confidence} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeCard;


