import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, User } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

interface FaceThumbnailProps {
  imageUrl?: string;
  confidence?: number;
  timestamp?: string;
  employeeName?: string;
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  clickable?: boolean;
}

export const FaceThumbnail: React.FC<FaceThumbnailProps> = ({
  imageUrl,
  confidence,
  timestamp,
  employeeName,
  size = 'md',
  showConfidence = true,
  clickable = true,
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const sizeClasses: Record<string, string> = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-24 h-24' };

  const handleClick = () => {
    if (clickable && imageUrl) setShowFullscreen(true);
  };

  return (
    <>
      <div className="relative inline-block">
        <div
          className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 relative group ${
            clickable && imageUrl ? 'cursor-pointer' : ''
          }`}
          onClick={handleClick}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="Face scan" className="w-full h-full object-cover" />
              {clickable && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {showConfidence && confidence !== undefined && (
          <div className="absolute -bottom-1 -right-1">
            <ConfidenceBadge confidence={confidence} showIcon={false} size="sm" />
          </div>
        )}
      </div>

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Face Recognition Capture</h3>
                {employeeName && <p className="text-sm text-muted-foreground mt-1">{employeeName}</p>}
              </div>
              {confidence !== undefined && <ConfidenceBadge confidence={confidence} />}
            </div>

            {imageUrl && (
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Face scan fullscreen" className="w-full h-full object-contain" />
              </div>
            )}

            {timestamp && <div className="text-sm text-muted-foreground">Captured: {timestamp}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FaceThumbnail;


