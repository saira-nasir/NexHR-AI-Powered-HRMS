import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FaceThumbnail } from '../attendance/FaceThumbnail';
import { StatusBadge, AttendanceStatus } from '../attendance/StatusBadge';
import { ConfidenceBadge } from '../attendance/ConfidenceBadge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Clock, MapPin, Smartphone, User, Mail, Briefcase, Save, History } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';

export interface EmployeeAttendanceDetail {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  confidence?: number;
  faceImageUrl?: string;
  employeePhotoUrl?: string;
  device?: string;
  location?: string;
  email?: string;
  position?: string;
  auditTrail?: AuditEntry[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  note?: string;
}

interface HRAttendanceDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: EmployeeAttendanceDetail | null;
  onSave: (updatedData: Partial<EmployeeAttendanceDetail>, hrNote: string) => void;
}

export function HRAttendanceDetailPanel({ isOpen, onClose, data, onSave }: HRAttendanceDetailPanelProps) {
  const [editedStatus, setEditedStatus] = useState<AttendanceStatus>(data?.status || 'present');
  const [hrNote, setHrNote] = useState('');

  if (!data) return null;

  const handleSave = () => {
    onSave({ status: editedStatus }, hrNote);
    setHrNote('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Attendance Record Audit</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Employee Info */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={data.employeePhotoUrl} alt={data.employeeName} />
                <AvatarFallback>
                  {data.employeeName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg">{data.employeeName}</h3>
                <p className="text-sm text-muted-foreground">{data.employeeId}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    <span>{data.department}</span>
                  </div>
                  {data.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{data.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Status */}
            <div>
              <Label>Date</Label>
              <div className="mt-2 text-lg">{new Date(data.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>

            <Separator />

            {/* Face Recognition Comparison */}
            <div>
              <Label className="mb-3 block">Face Recognition Verification</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Captured Face Scan</p>
                  <FaceThumbnail 
                    imageUrl={data.faceImageUrl}
                    confidence={data.confidence}
                    timestamp={data.checkIn}
                    employeeName={data.employeeName}
                    size="lg"
                  />
                  {data.confidence !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Match:</span>
                      <ConfidenceBadge confidence={data.confidence} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Employee Profile Photo</p>
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={data.employeePhotoUrl} alt={data.employeeName} />
                      <AvatarFallback>
                        {data.employeeName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check In</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{data.checkIn || '-'}</span>
                </div>
              </div>
              <div>
                <Label>Check Out</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{data.checkOut || '-'}</span>
                </div>
              </div>
            </div>

            {/* Device and Location */}
            <div className="space-y-3">
              {data.device && (
                <div>
                  <Label>Device</Label>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span>{data.device}</span>
                  </div>
                </div>
              )}
              {data.location && (
                <div>
                  <Label>Location</Label>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{data.location}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Editor */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="status-edit">Update Status</Label>
              <div className="flex items-center gap-3">
                <Select value={editedStatus} onValueChange={(value) => setEditedStatus(value as AttendanceStatus)}>
                  <SelectTrigger id="status-edit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
                <StatusBadge status={editedStatus} />
              </div>
            </div>

            {/* HR Note */}
            <div className="space-y-2">
              <Label htmlFor="hr-note">HR Note (required for status changes)</Label>
              <Textarea 
                id="hr-note"
                placeholder="Add note explaining the audit decision..."
                value={hrNote}
                onChange={(e) => setHrNote(e.target.value)}
                rows={4}
              />
            </div>

            {/* Audit Trail */}
            {data.auditTrail && data.auditTrail.length > 0 && (
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4" />
                  Audit Trail
                </Label>
                <div className="space-y-2">
                  {data.auditTrail.map(entry => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span>{entry.action}</span>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        By: {entry.performedBy}
                      </div>
                      {entry.note && (
                        <div className="mt-2 text-xs">{entry.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
