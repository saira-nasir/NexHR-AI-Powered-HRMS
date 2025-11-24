import type React from "react";
import { useState, useEffect, useRef } from "react";
import { applicationService } from "@/services/jobPortalservice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  CalendarIcon,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  similarityScore: number;
  resumeUrl?: string;
  interviewer?: string;
  interviewDate?: Date;
  interviewTime?: string;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSave: (candidateId: string, interviewers: number[], date: Date | undefined, time: string, roundMeta?: { id?: number | string; name?: string; type?: string; mode?: string; meeting_link?: string | null }) => Promise<void>;
  // optional round metadata (name/description) to prefill modal when scheduling a specific round
  round?: {
    id?: number | string;
    name?: string;
    description?: string;
  } | null;
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSave,
  round = null,
}) => {
  // Company users for interviewer dropdown
  const [companyUsers, setCompanyUsers] = useState<Array<{ id: number; fname: string; lname: string; email: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Scheduling state
  const [selectedInterviewers, setSelectedInterviewers] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [roundName, setRoundName] = useState<string>(round?.name || "");
  const [roundType, setRoundType] = useState<string>("Technical");
  const [roundMode, setRoundMode] = useState<string>((round && (round as any).type) ? 'online' : 'online');
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  
  const lottieContainer = useRef<HTMLDivElement | null>(null);
  const lottieAnimRef = useRef<any | null>(null);

  // Fetch company users only when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchCompanyUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await applicationService.getCompanyUsers();
        if (response.success && response.data) {
          setCompanyUsers(response.data.map(u => ({ ...u, __visible: true })));
        } else {
          console.error("Failed to fetch company users:", response.message);
        }
      } catch (err) {
        console.error("Error fetching company users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchCompanyUsers();
  }, [isOpen]);

  // Pre-populate fields when candidate or round changes and modal opens
  // NOTE: this effect intentionally does NOT depend on `companyUsers` to avoid
  // overwriting user edits (typing) if the users list is updated while the modal is open.
  useEffect(() => {
    if (!isOpen || !candidate) return;

    // When editing a round, prefill from round data
    if (round && round.id) {
      // Prefill round metadata
      setRoundName((round as any).round_name || round.name || '');
      setRoundType((round as any).round_type || (round as any).type || 'Technical');
      setRoundMode((round as any).round_mode || (round as any).mode || 'online');
      setMeetingLink((round as any).meeting_link || '');

      // Prefill date and time from round
      if ((round as any).scheduledDate) {
        const date = (round as any).scheduledDate;
        setScheduleDate(date instanceof Date ? date : new Date(date));
      } else if ((round as any).date) {
        setScheduleDate(new Date((round as any).date));
      }

      if ((round as any).scheduledTime) {
        // scheduledTime may be "14:30:00" or "14:30", normalize to HH:mm for input[type=time]
        const time = (round as any).scheduledTime;
        setScheduleTime(time.length > 5 ? time.slice(0, 5) : time);
      } else if ((round as any).time) {
        const time = (round as any).time;
        setScheduleTime(time.length > 5 ? time.slice(0, 5) : time);
      }

      // Prefill interviewers from round.interviewers array
      if ((round as any).interviewers && Array.isArray((round as any).interviewers)) {
        const interviewerIds = (round as any).interviewers.map((iv: any) => {
          // interviewer object may have { id, user, user_name } or just be a number
          if (typeof iv === 'number') return iv;
          if (iv.id) return iv.id;
          if (iv.user) return iv.user;
          return null;
        }).filter((id: any) => id !== null);
        setSelectedInterviewers(interviewerIds);
      }
    } else {
      // Creating a new round: initialize fields from candidate where available.
      // We do NOT attempt to match interviewer names to company users here because
      // that requires `companyUsers` which may load async; a separate effect will
      // run when `companyUsers` loads to preselect interviewers when appropriate.
      setSelectedInterviewers([]);
      setScheduleDate(candidate.interviewDate);
      setScheduleTime(candidate.interviewTime || "");
      setRoundName('');
      setRoundType('Technical');
      setRoundMode('online');
      setMeetingLink('');
    }
  }, [isOpen, candidate, round]);

  // When companyUsers finish loading (or change), if we are creating a new round
  // and the candidate has interviewer names, try to match them to company user ids
  // and preselect them. This runs separately so updates to companyUsers don't
  // reset other form inputs like roundName while the user is typing.
  useEffect(() => {
    if (!isOpen || round || !candidate) return;
    if (!companyUsers || companyUsers.length === 0) return;

    const matchedIds: number[] = [];
    if (candidate.interviewer) {
      const names = candidate.interviewer.split(/,|;/).map(s => s.trim());
      names.forEach((n) => {
        const found = companyUsers.find(u => `${u.fname} ${u.lname}` === n || `${u.lname} ${u.fname}` === n || u.email === n);
        if (found) matchedIds.push(found.id);
      });
    }

    if (matchedIds.length > 0) {
      setSelectedInterviewers(matchedIds);
    }
  }, [companyUsers, isOpen, candidate, round]);

  // Load lottie when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadLottie = async () => {
      try {
        console.log('Loading lottie...');
        const lottieModule = await import('lottie-web');
        const lottie = (lottieModule as any).default || lottieModule;
        console.log('Lottie imported:', lottie);

        if (lottieContainer.current) {
          console.log('Container found:', lottieContainer.current);
          const anim = lottie.loadAnimation({
            container: lottieContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/lottieFiles/calendar-red.json',
          });

          lottieAnimRef.current = anim;
          console.log('Animation loaded successfully:', anim);

          return () => anim.destroy();
        } else {
          console.warn('Container not found');
        }
      } catch (error) {
        console.error('Error loading lottie:', error);
      }
    };

    loadLottie();

    return () => {
      if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    setSelectedInterviewers([]);
    setScheduleDate(undefined);
    setScheduleTime("");
    setRoundName("");
    setRoundType("Technical");
    setRoundMode("online");
    setMeetingLink("");
    setSchedulingInProgress(false);
    if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
      lottieAnimRef.current.destroy();
      lottieAnimRef.current = null;
    }
    onClose();
  };

  const handleScheduleSave = async () => {
    if (!candidate) return;
    setSchedulingInProgress(true);

    try {
  await onSave(candidate.id, selectedInterviewers, scheduleDate, scheduleTime, { id: round?.id, name: roundName, type: roundType, mode: roundMode, meeting_link: meetingLink || null });
      // Brief success delay then close
      await new Promise((res) => setTimeout(res, 400));
      handleClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setSchedulingInProgress(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto z-[80]" 
        overlayClassName="z-[75]"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Schedule Interview</DialogTitle>
          <DialogDescription className="text-gray-600">
            {candidate ? `Schedule interview for ${candidate.name}` : 'Select interviewers, pick a date & time'}
          </DialogDescription>
        </DialogHeader>

        {/* Lottie Animation */}
        <div className="flex justify-center py-4">
          <div 
            ref={lottieContainer} 
            className="w-full h-full"
            style={{ 
              minHeight: '200px', 
              maxHeight: '200px',
              minWidth: '200px',
              maxWidth: '400px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          />
        </div>

        <div className="border-t pt-6 space-y-6">
          {/* Round name, type, mode & meeting link (new fields) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roundName" className="text-sm font-semibold text-gray-700">Round Name</Label>
              <Input id="roundName" value={roundName} onChange={(e) => setRoundName(e.target.value)} placeholder="e.g. Technical Round 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roundType" className="text-sm font-semibold text-gray-700">Round Type</Label>
              <select id="roundType" value={roundType} onChange={(e) => setRoundType(e.target.value)} className="w-full h-10 rounded-md border border-gray-200 px-3">
                <option>Technical</option>
                <option>HR</option>
                <option>Managerial</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="roundMode" className="text-sm font-semibold text-gray-700">Round Mode</Label>
              <select id="roundMode" value={roundMode} onChange={(e) => setRoundMode(e.target.value)} className="w-full h-10 rounded-md border border-gray-200 px-3">
                <option value="online">Online</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingLink" className="text-sm font-semibold text-gray-700">Meeting Link (optional)</Label>
              <Input id="meetingLink" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/..." />
            </div>
          </div>
          {/* Interviewer Selection */}
          <div className="space-y-2">
            <Label htmlFor="interviewers" className="text-sm font-semibold text-gray-700">
              Select Interviewers *
            </Label>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading interviewers...</span>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    id="interviewers"
                    variant="outline" 
                    className="w-full justify-start min-h-[2.5rem] h-auto text-left"
                  >
                    {selectedInterviewers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedInterviewers.map(id => {
                          const u = companyUsers.find(x => x.id === id);
                          return u ? (
                            <span 
                              key={id} 
                              className="inline-flex items-center bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                              {u.fname} {u.lname}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-500">Choose one or more interviewers</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0 z-[90]" align="start">
                  <div className="p-3 border-b">
                    <Input 
                      placeholder="Search by name or email..." 
                      className="h-9"
                      onChange={(e) => {
                        const q = e.target.value.toLowerCase();
                        setCompanyUsers(prev => prev.map(u => ({
                          ...u, 
                          __visible: q === '' || (u.fname + ' ' + u.lname + ' ' + u.email).toLowerCase().includes(q)
                        })));
                      }} 
                    />
                  </div>
                  <div className="max-h-64 overflow-auto p-2">
                    {companyUsers.filter(u => (u as any).__visible !== false).length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-500">
                        No interviewers found
                      </div>
                    ) : (
                      companyUsers.map((user) => (
                        (user as any).__visible === false ? null : (
                          <label 
                            key={user.id} 
                            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={selectedInterviewers.includes(user.id)}
                              onCheckedChange={(val) => {
                                const checked = Boolean(val);
                                setSelectedInterviewers(prev => 
                                  checked 
                                    ? Array.from(new Set([...prev, user.id])) 
                                    : prev.filter(id => id !== user.id)
                                );
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">
                                {user.fname} {user.lname}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                            </div>
                          </label>
                        )
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {selectedInterviewers.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedInterviewers.length} interviewer{selectedInterviewers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                Interview Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : <span className="text-gray-500">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[90]" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-semibold text-gray-700">
                Interview Time *
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {(selectedInterviewers.length > 0 || scheduleDate || scheduleTime) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Interview Summary</h4>
              <div className="space-y-1.5 text-sm text-gray-700">
                {selectedInterviewers.length > 0 && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                    <span>
                      {selectedInterviewers.map(id => {
                        const u = companyUsers.find(x => x.id === id);
                        return u ? `${u.fname} ${u.lname}` : null;
                      }).filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {scheduleDate && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-indigo-600" />
                    <span>{format(scheduleDate, "PPPP")}</span>
                  </div>
                )}
                {scheduleTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>{scheduleTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={schedulingInProgress}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleSave} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-1 sm:flex-none"
            disabled={schedulingInProgress || selectedInterviewers.length === 0 || !scheduleDate || !scheduleTime}
          >
            {schedulingInProgress ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {round && round.id ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {round && round.id ? 'Update Round' : 'Save & Schedule'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewModal;
