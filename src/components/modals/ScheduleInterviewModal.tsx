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
  onSave: (candidateId: string, interviewers: number[], date: Date | undefined, time: string) => Promise<void>;
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSave,
}) => {
  // Company users for interviewer dropdown
  const [companyUsers, setCompanyUsers] = useState<Array<{ id: number; fname: string; lname: string; email: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Scheduling state
  const [selectedInterviewers, setSelectedInterviewers] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState<string>("");
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

  // Pre-populate fields when candidate changes and modal opens
  useEffect(() => {
    if (!isOpen || !candidate) return;

    // Try to preselect interviewer(s) by matching names if present
    const matchedIds: number[] = [];
    if (candidate.interviewer) {
      const names = candidate.interviewer.split(/,|;/).map(s => s.trim());
      names.forEach((n) => {
        const found = companyUsers.find(u => `${u.fname} ${u.lname}` === n || `${u.lname} ${u.fname}` === n || u.email === n);
        if (found) matchedIds.push(found.id);
      });
    }
    setSelectedInterviewers(matchedIds);
    setScheduleDate(candidate.interviewDate);
    setScheduleTime(candidate.interviewTime || "");
  }, [isOpen, candidate, companyUsers]);

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
      await onSave(candidate.id, selectedInterviewers, scheduleDate, scheduleTime);
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
                Scheduling...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save & Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewModal;
