import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unverified' | 'flagged' | 'pending';

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (v: AttendanceStatus) => {
    switch (v) {
      case 'present':
        return { label: 'Present', className: 'bg-green-500 hover:bg-green-600', Icon: CheckCircle };
      case 'absent':
        return { label: 'Absent', className: 'bg-red-500 hover:bg-red-600', Icon: XCircle };
      case 'late':
        return { label: 'Late', className: 'bg-yellow-500 hover:bg-yellow-600', Icon: Clock };
      case 'unverified':
        return { label: 'Unverified', className: 'bg-gray-500 hover:bg-gray-600', Icon: AlertCircle };
      case 'flagged':
        return { label: 'Flagged', className: 'bg-orange-500 hover:bg-orange-600', Icon: AlertCircle };
      case 'pending':
      default:
        return { label: 'Pending', className: 'bg-blue-500 hover:bg-blue-600', Icon: Clock };
    }
  };

  const { label, className, Icon } = getStatusConfig(status);
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge className={className}>
      <Icon className={`${iconSize} mr-1`} />
      {label}
    </Badge>
  );
};

export default StatusBadge;


