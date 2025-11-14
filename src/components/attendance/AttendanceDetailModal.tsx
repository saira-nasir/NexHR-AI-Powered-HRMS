import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FaceThumbnail from './FaceThumbnail';
import StatusBadge from './StatusBadge';
import ConfidenceBadge from './ConfidenceBadge';
import { Download, MessageSquare, AlertCircle, Clock, MapPin, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TimeCardData } from './TimeCard';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TimeCardData | null;
  onRequestCorrection: (note: string) => void;
  onDownloadPDF: () => void;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({ isOpen, onClose, data, onRequestCorrection, onDownloadPDF }) => {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');

  if (!data) return null;

  const handleSubmitCorrection = () => {
    if (correctionNote.trim()) {
      onRequestCorrection(correctionNote);
      setCorrectionNote('');
      setShowCorrectionForm(false);
    }
  };

  const needsReview = data.confidence !== undefined && data.confidence < 85;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {needsReview && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                This record has low confidence. Please review the face recognition image and request a correction if needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl">{data.date}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Label>Face Recognition Capture</Label>
                <p className="text-xs text-muted-foreground mt-1">Captured at check-in</p>
              </div>
              {data.confidence !== undefined && <ConfidenceBadge confidence={data.confidence} />}
            </div>
            <div className="flex justify-center">
              <FaceThumbnail imageUrl={data.faceImageUrl} confidence={data.confidence} timestamp={data.checkIn} size="lg" showConfidence={false} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span>Check In</span>
              </div>
              <div className="text-xl">{data.checkIn || '-'}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span>Check Out</span>
              </div>
              <div className="text-xl">{data.checkOut || '-'}</div>
            </div>
          </div>

          {data.duration && (
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Duration</div>
              <div className="text-lg">{data.duration}</div>
            </div>
          )}

          <div className="space-y-3">
            {data.device && (
              <div className="flex items-center gap-3 text-sm">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div><span className="text-muted-foreground">Device: </span><span>{data.device}</span></div>
              </div>
            )}
            {data.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div><span className="text-muted-foreground">Location: </span><span>{data.location}</span></div>
              </div>
            )}
          </div>

          {!showCorrectionForm ? (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowCorrectionForm(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Correction
              </Button>
              <Button variant="outline" onClick={onDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="correction-note">Correction Request</Label>
              <Textarea id="correction-note" placeholder="Describe the issue with this attendance record..." value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} rows={4} />
              <div className="flex gap-2">
                <Button onClick={handleSubmitCorrection}>Submit Request</Button>
                <Button variant="outline" onClick={() => { setShowCorrectionForm(false); setCorrectionNote(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailModal;


