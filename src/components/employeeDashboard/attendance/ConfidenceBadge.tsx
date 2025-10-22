import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, showIcon = true, size = 'md' }) => {
  const getConfidenceConfig = (c: number) => {
    if (c >= 95) return { color: 'bg-green-500 hover:bg-green-600', Icon: CheckCircle };
    if (c >= 85) return { color: 'bg-yellow-500 hover:bg-yellow-600', Icon: AlertTriangle };
    return { color: 'bg-red-500 hover:bg-red-600', Icon: ShieldAlert };
  };

  const { color, Icon } = getConfidenceConfig(confidence);
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge className={color}>
      {showIcon && <Icon className={`${iconSize} mr-1`} />}
      {confidence}%
    </Badge>
  );
};

export default ConfidenceBadge;


