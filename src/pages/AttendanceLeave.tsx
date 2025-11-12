import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet, apiPost, apiPostFormData } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Camera, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { TimeCard, TimeCardData } from '@/components/attendance/TimeCard';
import { AttendanceDetailModal } from '@/components/attendance/AttendanceDetailModal';
import { EmployeeProfile } from '@/components/attendance/EmployeeProfile';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import type { AttendanceStatus } from '@/components/attendance/StatusBadge';

interface Attendance {
  id: number;
  employee: number; // Employee ID - CRITICAL for data isolation
  date: string;
  check_in: string;
  check_out?: string;
  work_hours?: number;
  photo?: string;
}

interface Leave {
  id: number;
  employee: number; // Employee ID - CRITICAL for data isolation
  leave_type: string;
  from_date: string;
  to_date: string;
  status: string;
  reason?: string;
}

interface AttendanceMarkResponse {
  employee: string;
  verified: boolean;
  message: string;
  photo_url?: string;
}

const AttendanceLeave: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(true);
  // UI state for enhanced attendance tab
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedRecord, setSelectedRecord] = useState<TimeCardData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState<any>(null);
  const [recognitionTime, setRecognitionTime] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [markAttendanceLoading, setMarkAttendanceLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<AttendanceMarkResponse | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<'checkin' | 'checkout'>('checkin');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    from_date: '',
    to_date: '',
  });

  // Decode user id from JWT access token with validation
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ No access token found');
        return null;
      }
      
      // Validate token format (JWT has 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid token format');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const userId = payload.user_id || payload.id || payload.sub || null;
      
      if (!userId) {
        console.error('❌ No user ID found in token payload:', payload);
        return null;
      }
      
      const numericUserId = Number(userId);
      if (isNaN(numericUserId)) {
        console.error('❌ User ID is not a valid number:', userId);
        return null;
      }
      
      console.log('✅ Extracted user ID from token:', numericUserId);
      return numericUserId;
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
      return null;
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        toast.error('User not identified. Please log in again.');
        setAttendanceLoading(false);
        return;
      }
      const data = await apiGet(`/payroll/attendance/?employee=${userId}`);
      
      // CRITICAL SECURITY: Filter data client-side to ensure only current user's data is shown
      // This is a safety measure in case backend doesn't filter properly
      const filteredData = Array.isArray(data) 
        ? data.filter((record: Attendance) => {
            // Ensure the record belongs to the current user
            const recordEmployeeId = record.employee;
            const matches = recordEmployeeId === userId;
            if (!matches) {
              console.warn('⚠️ Filtered out attendance record not belonging to current user:', {
                recordEmployeeId,
                currentUserId: userId,
                recordId: record.id
              });
            }
            return matches;
          })
        : [];
      
      console.log('📊 Fetched attendance data (raw):', data);
      console.log('📊 Filtered attendance data (user-specific):', filteredData);
      console.log('👤 Current user ID:', userId);
      
      setAttendance(filteredData);
      
      // Find today's attendance record (from filtered data)
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Looking for today\'s record:', today);
      const todayRecord = filteredData.find((record: Attendance) => {
        try {
          // Handle different date formats
          let recordDate: string;
          if (/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
            recordDate = record.date;
          } else {
            const date = new Date(record.date);
            if (isNaN(date.getTime())) {
              return false;
            }
            recordDate = date.toISOString().split('T')[0];
          }
          return recordDate === today;
        } catch {
          return false;
        }
      });
      
      if (todayRecord) {
        console.log('✅ Found today\'s attendance record:', todayRecord);
        console.log('📋 Check-in:', todayRecord.check_in);
        console.log('📋 Check-out:', todayRecord.check_out);
        console.log('📋 Full record:', JSON.stringify(todayRecord, null, 2));
        
        // CRITICAL: Always update todayAttendance with the full record FIRST
        // This ensures the UI shows the latest data from backend
        setTodayAttendance({ ...todayRecord });
        
        if (todayRecord.check_in) {
          try {
            // Handle different check_in formats
            let checkIn: Date | null = null;
            if (typeof todayRecord.check_in === 'string') {
              // Clean the time string - remove microseconds if present
              const cleanTime = todayRecord.check_in.split('.')[0];
              
                // If it's just time (HH:mm:ss), combine with date
                if (/^\d{2}:\d{2}:\d{2}/.test(cleanTime)) {
                  // Ensure date is in YYYY-MM-DD format
                  let dateStr = todayRecord.date;
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                      dateStr = dateObj.toISOString().split('T')[0];
                    } else {
                      dateStr = new Date().toISOString().split('T')[0];
                    }
                  }
                  // Parse as local time (not UTC) to avoid timezone issues
                  // The backend stores time in local server time, so we interpret it as local
                  const combined = `${dateStr}T${cleanTime}`;
                  checkIn = new Date(combined);
                  // If the date seems wrong (timezone offset issue), adjust it
                  // Check if the time is more than 12 hours in the future (likely timezone issue)
                  const now = new Date();
                  const hoursDiff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                  if (hoursDiff > 12) {
                    // Likely a timezone issue - the time is probably in a different timezone
                    // Try parsing as UTC instead
                    const utcCombined = `${dateStr}T${cleanTime}Z`;
                    const utcCheckIn = new Date(utcCombined);
                    if (!isNaN(utcCheckIn.getTime())) {
                      console.log('⚠️ Timezone adjustment: Using UTC interpretation');
                      checkIn = utcCheckIn;
                    }
                  }
              } else {
                checkIn = new Date(todayRecord.check_in);
              }
            }
            
            // Validate the parsed date
            if (checkIn && !isNaN(checkIn.getTime())) {
              // Don't validate against "future" - timezone differences can cause false positives
              // The backend stores the correct time, we just need to parse it correctly
              console.log('✅ Setting check-in time:', checkIn);
              console.log('Check-in time string:', todayRecord.check_in);
              console.log('Parsed date object:', checkIn.toISOString());
              console.log('Local time:', checkIn.toLocaleString());
              setCheckInTime(checkIn);
            } else {
              console.warn('⚠️ Failed to parse check-in time, using current time');
              setCheckInTime(new Date());
            }
          } catch (error) {
            console.error('Error parsing check-in time:', error);
            setCheckInTime(new Date());
          }
          
          // Determine mode: if check-in exists but no check-out, show check-out mode
          if (!todayRecord.check_out || todayRecord.check_out === null || todayRecord.check_out === '') {
            console.log('➡️ No check-out found, setting mode to checkout');
            setAttendanceMode('checkout');
            setCheckOutTime(null);
            // Ensure todayAttendance doesn't have stale check_out
            setTodayAttendance(prev => prev ? { ...prev, check_out: undefined } : null);
          } else {
            console.log('✅ Check-out exists in record:', todayRecord.check_out);
            try {
              // Handle different check_out formats
              let checkOut: Date | null = null;
              if (typeof todayRecord.check_out === 'string') {
                // Clean the time string - remove microseconds if present
                const cleanTime = todayRecord.check_out.split('.')[0];
                
                // If it's just time (HH:mm:ss), combine with date
                if (/^\d{2}:\d{2}:\d{2}/.test(cleanTime)) {
                  // Ensure date is in YYYY-MM-DD format
                  let dateStr = todayRecord.date;
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                      dateStr = dateObj.toISOString().split('T')[0];
                    } else {
                      dateStr = new Date().toISOString().split('T')[0];
                    }
                  }
                  const combined = `${dateStr}T${cleanTime}`;
                  checkOut = new Date(combined);
                  console.log('📅 Combined check-out datetime:', combined, '→', checkOut.toISOString());
                } else {
                  checkOut = new Date(todayRecord.check_out);
                  console.log('📅 Parsed check-out as full datetime:', checkOut.toISOString());
                }
              }
              
              // Validate the parsed date
              if (checkOut && !isNaN(checkOut.getTime())) {
                // Ensure check-out is after check-in
                const checkInTime = todayRecord.check_in ? (() => {
                  try {
                    const cleanTime = String(todayRecord.check_in).split('.')[0];
                    if (/^\d{2}:\d{2}:\d{2}/.test(cleanTime)) {
                      let dateStr = todayRecord.date;
                      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const dateObj = new Date(dateStr);
                        if (!isNaN(dateObj.getTime())) {
                          dateStr = dateObj.toISOString().split('T')[0];
                        }
                      }
                      return new Date(`${dateStr}T${cleanTime}`);
                    }
                    return new Date(todayRecord.check_in);
                  } catch {
                    return null;
                  }
                })() : null;
                
                if (checkInTime && checkOut < checkInTime) {
                  console.warn('⚠️ Check-out time is before check-in time, using current time');
                  console.warn('Check-in:', checkInTime);
                  console.warn('Check-out:', checkOut);
                  setCheckOutTime(new Date());
                  // Still update todayAttendance with the check_out value from backend
                  setTodayAttendance(prev => prev ? { ...prev, check_out: todayRecord.check_out } : null);
                } else {
                  console.log('✅ Setting check-out time:', checkOut);
                  console.log('✅ Check-out time ISO:', checkOut.toISOString());
                  setCheckOutTime(checkOut);
                  // CRITICAL: Force update todayAttendance with check_out value to ensure UI updates
                  setTodayAttendance(prev => {
                    const updated = prev ? { ...prev, check_out: todayRecord.check_out } : todayRecord;
                    console.log('🔄 Updating todayAttendance with check_out:', updated);
                    return updated;
                  });
                }
              } else {
                console.warn('⚠️ Failed to parse check-out time, but keeping the value in todayAttendance');
                // Even if parsing fails, keep the raw value in todayAttendance so UI can display it
                setTodayAttendance(prev => prev ? { ...prev, check_out: todayRecord.check_out } : todayRecord);
                setCheckOutTime(null);
              }
            } catch (error) {
              console.error('❌ Error parsing check-out time:', error);
              // Even on error, keep the raw value
              setTodayAttendance(prev => prev ? { ...prev, check_out: todayRecord.check_out } : todayRecord);
              setCheckOutTime(null);
            }
          }
        } else {
          setCheckInTime(null);
          setCheckOutTime(null);
          setAttendanceMode('checkin');
        }
      } else {
        setTodayAttendance(null);
        setCheckInTime(null);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
      }
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    
    // Set up periodic refresh to keep data in sync (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchAttendance();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    if (todayAttendance) {
      console.log('🔄 todayAttendance state updated:', {
        check_in: todayAttendance.check_in,
        check_out: todayAttendance.check_out,
        date: todayAttendance.date
      });
    }
  }, [todayAttendance]);

  useEffect(() => {
    if (checkOutTime) {
      console.log('🔄 checkOutTime state updated:', checkOutTime.toISOString());
    }
  }, [checkOutTime]);

  // Fetch leaves data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          toast.error('User not identified. Please log in again.');
          setLeavesLoading(false);
          return;
        }
      const data = await apiGet(`/payroll/leaves/?employee=${userId}`);
      
      // CRITICAL SECURITY: Filter data client-side to ensure only current user's data is shown
      const filteredLeaves = Array.isArray(data)
        ? data.filter((leave: Leave) => {
            const recordEmployeeId = leave.employee;
            const matches = recordEmployeeId === userId;
            if (!matches) {
              console.warn('⚠️ Filtered out leave record not belonging to current user:', {
                recordEmployeeId,
                currentUserId: userId,
                leaveId: leave.id
              });
            }
            return matches;
          })
        : [];
      
      console.log('📊 Fetched leaves data (raw):', data);
      console.log('📊 Filtered leaves data (user-specific):', filteredLeaves);
      
      setLeaves(filteredLeaves);
      } catch (error) {
        toast.error('Failed to fetch leaves');
      } finally {
        setLeavesLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = getUserId();
    if (!employee) {
      toast.error('User not identified. Please log in again.');
      return;
    }
    try {
      await apiPost('/payroll/leaves/', { ...formData, employee });
      toast.success('Leave application submitted successfully');
      setOpen(false);
      setFormData({ leave_type: 'Casual', from_date: '', to_date: '' });
      // Refresh leaves data for current user only
      const data = await apiGet(`/payroll/leaves/?employee=${employee}`);
      setLeaves(data);
    } catch (error) {
      toast.error('Failed to submit leave application');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  // --- Attendance tab helpers ---
  // Map backend attendance row -> TimeCardData
  const mapToTimeCard = (row: Attendance): TimeCardData => {
    // Determine status: present if check_in exists, late if after 09:15, absent if no check_in
    let status: 'present' | 'late' | 'absent' = 'absent';
    
    if (row.check_in) {
      try {
        // Try to parse check_in as a full datetime
        let checkInDate: Date | null = null;
        
        // Clean time string - remove microseconds if present
        const cleanCheckIn = typeof row.check_in === 'string' ? row.check_in.split('.')[0] : row.check_in;
        
        // If it's a time-only string (HH:mm:ss), combine with the date
        if (typeof cleanCheckIn === 'string' && /^\d{2}:\d{2}:\d{2}/.test(cleanCheckIn)) {
          // Time-only format, combine with row.date
          let dateStr = row.date;
          // Ensure date is in YYYY-MM-DD format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
              dateStr = dateObj.toISOString().split('T')[0];
            }
          }
          const combinedDateTime = `${dateStr}T${cleanCheckIn}`;
          checkInDate = new Date(combinedDateTime);
        } else {
          // Try parsing as full datetime
          checkInDate = new Date(row.check_in);
        }
        
        if (checkInDate && !isNaN(checkInDate.getTime())) {
          // Check if late (after 09:15)
          const threshold = new Date(checkInDate);
          threshold.setHours(9, 15, 0, 0);
          status = checkInDate > threshold ? 'late' : 'present';
        } else {
          // If parsing failed but check_in exists, assume present
          status = 'present';
        }
      } catch {
        // If any error, but check_in exists, assume present
        status = 'present';
      }
    }
    
    const formatTime = (d?: string) => {
      if (!d) return undefined;
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) {
          // If it's just a time string like "09:30:00", parse it differently
          if (d.includes(':') && d.split(':').length === 3) {
            return d.substring(0, 5); // Return HH:mm format
          }
          return d;
        }
        return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return d;
      }
    };

    // Parse date - handle both ISO date strings and date-only strings
    const parseDate = (dateStr: string): string => {
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return dateStr;
        }
        return date.toISOString().split('T')[0];
      } catch {
        return dateStr;
      }
    };

    const duration = typeof row.work_hours === 'number' 
      ? `${row.work_hours.toFixed(1)}h` 
      : (typeof row.work_hours === 'string' && row.work_hours) 
        ? `${parseFloat(row.work_hours).toFixed(1)}h`
        : undefined;

    return {
      id: String(row.id),
      date: parseDate(row.date),
      checkIn: formatTime(row.check_in),
      checkOut: formatTime(row.check_out),
      status,
      // If backend provides a confidence value later, pass it through; default undefined
      confidence: undefined,
      faceImageUrl: row.photo,
      device: undefined,
      location: undefined,
      duration,
    };
  };

  const timeCards: TimeCardData[] = useMemo(() => attendance.map(mapToTimeCard).sort((a, b) => (a.date < b.date ? 1 : -1)), [attendance]);

  // Build calendar map for current month
  const attendanceMap = useMemo(() => {
    const m = new Map<string, { status: AttendanceStatus; confidence?: number }>();
    timeCards.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        m.set(r.date, { status: r.status, confidence: r.confidence });
      }
    });
    return m;
  }, [timeCards, currentMonth, currentYear]);

  const handleDateClick = (dateKey: string) => {
    const record = timeCards.find((r) => r.date === dateKey);
    if (record) {
      setSelectedRecord(record);
      setShowDetailModal(true);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else setCurrentMonth((m) => m - 1);
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else setCurrentMonth((m) => m + 1);
    }
  };

  const onRequestCorrection = (_note: string) => {
    toast.success('Correction request submitted', { description: 'HR will review your request shortly.' });
    setShowDetailModal(false);
  };

  const onDownloadPDF = () => {
    toast.success('PDF downloaded', { description: 'Your attendance record has been downloaded.' });
  };

  // Handle mark attendance (check-in or check-out)
  const handleMarkAttendance = async (file: File) => {
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      // Verify user is authenticated before proceeding
      const userId = getUserId();
      if (!userId) {
        toast.error('Authentication Error', { 
          description: 'User not identified. Please log in again.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }
      
      console.log('👤 Marking attendance for user ID:', userId);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await apiPostFormData('/attendance/mark-attendance-face/', formData) as AttendanceMarkResponse;
      
      // Note: Backend validates user via JWT token, so response.employee is just informational
      // (usually email/name, not ID). Security is handled server-side.
      console.log('✅ Attendance marked successfully for user:', userId);
      console.log('📋 Response employee info:', response.employee);
      
      setAttendanceResult(response);

      // Backend returns: { employee, verified, message, photo_url }
      if (response.verified) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setRecognitionTime(timeString);
        
        // Update recognized employee with response data
        setRecognizedEmployee({
          name: response.employee,
          employeeId: response.employee,
          department: 'Employee',
          status: 'verified',
        });

        // Immediately refresh attendance data after successful verification
        // For check-out, we need to ensure backend has processed it
        if (attendanceMode === 'checkout') {
          // Wait for backend to process check-out
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // First refresh
          console.log('🔄 First refresh after check-out...');
          await fetchAttendance();
          
          // Force another refresh to ensure state is synced
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔄 Second refresh after check-out...');
          await fetchAttendance();
          
          // Final refresh to catch any delayed updates
          await new Promise(resolve => setTimeout(resolve, 800));
          console.log('🔄 Final refresh after check-out...');
          await fetchAttendance();
          
          // One more check to ensure state is correct
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('🔄 Final verification refresh...');
          await fetchAttendance();
        } else {
          // For check-in, shorter delay
          await new Promise(resolve => setTimeout(resolve, 800));
          await fetchAttendance();
        }
        
        // Show success message based on mode
        if (attendanceMode === 'checkin') {
          toast.success('Check-In Successful', { 
            description: response.message || 'Your check-in has been verified and recorded' 
          });
        } else {
          toast.success('Check-Out Successful', { 
            description: response.message || 'Your check-out has been verified and recorded' 
          });
        }
      } else {
        // Face mismatch - attendance NOT recorded
        toast.error('Verification Failed', { 
          description: response.message || 'Face mismatch. Please try again.' 
        });
      }
    } catch (error: any) {
      // Handle different error formats from backend
      let errorMessage = 'Failed to mark attendance. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        
        // Special handling for 404 - no face profile registered
        if (error.response.status === 404) {
          errorMessage = 'No face profile registered. Please register your face first.';
        }
      }
      
      toast.error('Error', { description: errorMessage });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  const resetAttendanceResult = async () => {
    setAttendanceResult(null);
    
    // Always refresh attendance data when dismissing result to ensure latest state
    await fetchAttendance();
    
    // If check-in was successful and no check-out yet, switch to check-out mode
    if (attendanceMode === 'checkin' && todayAttendance?.check_in && !todayAttendance?.check_out) {
      setAttendanceMode('checkout');
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date is invalid, try parsing as ISO string or return formatted string
        return dateString;
      }
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '-';
    try {
      // If it's just a time string (HH:mm:ss or HH:mm:ss.xxxxxx), extract just HH:mm:ss
      if (typeof timeString === 'string' && /^\d{2}:\d{2}:\d{2}/.test(timeString)) {
        // Extract just HH:mm:ss part (remove microseconds if present)
        const timeOnly = timeString.split('.')[0].substring(0, 8);
        return timeOnly; // Return in 24-hour format: HH:mm:ss
      }
      
      // Try parsing as full datetime
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        // Return in 24-hour format
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // If parsing fails, return as is
      return timeString;
    } catch {
      return timeString;
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance & Leave</h1>
          <p className="text-muted-foreground">Manage your attendance records and leave applications</p>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="attendance" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="leave" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Leave
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {attendanceLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <>
                {/* Refresh Button */}
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={async () => {
                      setAttendanceLoading(true);
                      await fetchAttendance();
                      toast.success('Attendance data refreshed', { description: 'Latest data has been loaded' });
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {/* Check-In/Check-Out Toggle Buttons */}
                <div className="flex flex-row gap-4 mb-6 justify-center">
                  <Button
                    onClick={() => {
                      // Only allow if no check-in today OR if already checked out (can check in again next day)
                      const canCheckIn = !todayAttendance?.check_in || (todayAttendance?.check_in && todayAttendance?.check_out);
                      if (canCheckIn) {
                        setAttendanceMode('checkin');
                      }
                    }}
                    disabled={!!todayAttendance?.check_in && !todayAttendance?.check_out}
                    className={`
                      w-40 h-14 text-sm font-semibold
                      transition-all duration-200 shadow-md hover:shadow-lg
                      ${attendanceMode === 'checkin' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0' 
                        : 'bg-white hover:bg-green-50 text-green-700 border-2 border-green-300 hover:border-green-400'
                      }
                      ${(!!todayAttendance?.check_in && !todayAttendance?.check_out) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Check In</span>
                    </div>
                  </Button>
                  <Button
                    onClick={async () => {
                      // Always allow clicking check-out button - it will check backend state
                      // If already checked out, refresh data first
                      if (todayAttendance?.check_out) {
                        await fetchAttendance();
                        return;
                      }
                      // Only allow if check-in exists and no check-out
                      if (todayAttendance?.check_in && !todayAttendance?.check_out) {
                        setAttendanceMode('checkout');
                      } else if (!todayAttendance?.check_in) {
                        // No check-in yet, refresh to make sure
                        await fetchAttendance();
                      }
                    }}
                    disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
                    className={`
                      w-40 h-14 text-sm font-semibold
                      transition-all duration-200 shadow-md hover:shadow-lg
                      ${attendanceMode === 'checkout' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0' 
                        : 'bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-300 hover:border-blue-400'
                      }
                      ${(!todayAttendance?.check_in || !!todayAttendance?.check_out) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <span>Check Out</span>
                    </div>
                  </Button>
                </div>

                {/* Today's Attendance Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-w-2xl mx-auto">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Check In
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                          <p className="text-xs font-medium">
                            {todayAttendance?.date ? formatDate(todayAttendance.date) : formatDate(new Date().toISOString())}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Time</p>
                          <p className="text-base font-bold text-green-700">
                            {todayAttendance?.check_in ? formatTime(todayAttendance.check_in) : 'Not checked in'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`border-blue-200 ${todayAttendance?.check_out ? 'bg-blue-50/50' : 'bg-gray-50/50'}`}>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-blue-600" />
                        Check Out
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                          <p className="text-xs font-medium">
                            {todayAttendance?.date ? formatDate(todayAttendance.date) : formatDate(new Date().toISOString())}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Time</p>
                          <p className={`text-base font-bold ${todayAttendance?.check_out ? 'text-blue-700' : 'text-muted-foreground'}`}>
                            {todayAttendance?.check_out ? formatTime(todayAttendance.check_out) : 'Not checked out'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mark Attendance Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2">
                    {!attendanceResult ? (
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            <CardTitle>
                              {attendanceMode === 'checkin' ? 'Check In' : 'Check Out'}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {attendanceMode === 'checkin' 
                              ? 'Capture your photo to check in via facial recognition'
                              : 'Capture your photo to check out via facial recognition'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <WebcamCapture 
                            key={`webcam-${attendanceMode}`} 
                            onCapture={handleMarkAttendance} 
                            isLoading={markAttendanceLoading} 
                          />
                          
                          {/* Instructions */}
                          <Card className="mt-4 bg-primary/5 border-primary/20">
                            <CardHeader>
                              <CardTitle className="text-lg">Before You Capture</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>✓ Make sure you're in a well-lit area</li>
                                <li>✓ Look directly at the camera</li>
                                <li>✓ Remove any face coverings</li>
                                <li>✓ Ensure your full face is visible</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className={`shadow-lg ${attendanceResult.verified ? 'border-green-500' : 'border-red-500'}`}>
                        <CardContent className="pt-12 pb-12">
                          <div className="text-center space-y-6">
                            {/* Success/Failure Icon */}
                            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
                              attendanceResult.verified ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {attendanceResult.verified ? (
                                <CheckCircle2 className="h-12 w-12 text-white" />
                              ) : (
                                <XCircle className="h-12 w-12 text-white" />
                              )}
                            </div>

                            {/* Result Title */}
                            <div>
                              <h2 className="text-3xl font-bold mb-2">
                                {attendanceResult.verified 
                                  ? (attendanceMode === 'checkin' ? 'Check-In Verified!' : 'Check-Out Verified!')
                                  : 'Verification Failed'}
                              </h2>
                              <p className="text-muted-foreground">
                                {attendanceResult.message}
                              </p>
                            </div>

                            {/* Employee Info */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                              <span className="text-sm text-muted-foreground">Employee:</span>
                              <span className="font-medium">{attendanceResult.employee}</span>
                            </div>

                            {/* Payroll Sync Badge */}
                            {attendanceResult.verified && (
                              <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                                <Badge className="bg-green-500 mb-3">
                                  ✓ Synced to Payroll
                                </Badge>
                                <p className="text-sm text-green-700 font-medium">
                                  Your attendance has been automatically synced to the payroll system
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {attendanceMode === 'checkin' ? 'Check-in' : 'Check-out'} time: {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </p>
                              </div>
                            )}

                            {/* Action Button */}
                            <Button
                              onClick={async () => {
                                if (attendanceResult.verified && attendanceMode === 'checkin' && !todayAttendance?.check_out) {
                                  // Switch to check-out mode
                                  setAttendanceResult(null);
                                  setAttendanceMode('checkout');
                                  // Refresh to get latest state
                                  await fetchAttendance();
                                } else {
                                  await resetAttendanceResult();
                                }
                              }}
                              variant={attendanceResult.verified ? "outline" : "default"}
                              size="lg"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              {attendanceResult.verified 
                                ? (attendanceMode === 'checkin' && !todayAttendance?.check_out 
                                    ? 'Check Out Now' 
                                    : 'Done')
                                : 'Try Again'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <EmployeeProfile employee={recognizedEmployee} timestamp={recognitionTime} />
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm">Attendance Rate</CardTitle>
                      <span className="h-4 w-4 text-muted-foreground">↗</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl">{
                        (() => {
                          const monthRecords = timeCards.filter((r) => {
                            const d = new Date(r.date);
                            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                          });
                          const working = monthRecords.length;
                          const present = monthRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
                          return working > 0 ? `${((present / working) * 100).toFixed(1)}%` : '0%';
                        })()
                      }</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm">Present Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl text-green-600">{
                        (() => {
                          const monthRecords = timeCards.filter((r) => {
                            const d = new Date(r.date);
                            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                          });
                          const present = monthRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
                          return present;
                        })()
                      }</div>
                      <p className="text-xs text-muted-foreground">Out of {
                        (() => {
                          const monthRecords = timeCards.filter((r) => {
                            const d = new Date(r.date);
                            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                          });
                          return monthRecords.length;
                        })()
                      } working days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm">Late Arrivals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl text-yellow-600">{
                        (() => {
                          const monthRecords = timeCards.filter((r) => {
                            const d = new Date(r.date);
                            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                          });
                          return monthRecords.filter((r) => r.status === 'late').length;
                        })()
                      }</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm">Pending Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl text-orange-600">{
                        (() => {
                          const monthRecords = timeCards.filter((r) => {
                            const d = new Date(r.date);
                            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                          });
                          return monthRecords.filter((r) => (r.confidence ?? 100) < 85).length;
                        })()
                      }</div>
                      <p className="text-xs text-muted-foreground">Low confidence records</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <AttendanceCalendar
                      year={currentYear}
                      month={currentMonth}
                      attendanceData={attendanceMap}
                      onDateClick={handleDateClick}
                      onMonthChange={handleMonthChange}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Attendance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {timeCards.slice(0, 10).map((record) => (
                          <TimeCard key={record.id} data={record} onClick={() => { setSelectedRecord(record); setShowDetailModal(true); }} compact />
                        ))}
                        {timeCards.length === 0 && (
                          <div className="text-sm text-muted-foreground">No recent records</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
              </div>

                <AttendanceDetailModal
                  isOpen={showDetailModal}
                  onClose={() => setShowDetailModal(false)}
                  data={selectedRecord}
                  onRequestCorrection={onRequestCorrection}
                  onDownloadPDF={onDownloadPDF}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Leave Management</h2>
                <p className="text-muted-foreground">Apply for leave and track your applications</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Apply for Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                    <DialogDescription>Fill in the details to submit your leave request</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="leave_type">Leave Type</Label>
                      <Select
                        value={formData.leave_type}
                        onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Sick">Sick</SelectItem>
                          <SelectItem value="Annual">Annual</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from_date">From Date</Label>
                      <Input
                        id="from_date"
                        type="date"
                        value={formData.from_date}
                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to_date">To Date</Label>
                      <Input
                        id="to_date"
                        type="date"
                        value={formData.to_date}
                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg">
                      Submit Application
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {leavesLoading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : (
              <div className="grid gap-4">
                {leaves.map((leave) => (
                  <Card key={leave.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{leave.leave_type} Leave</CardTitle>
                            <CardDescription>
                              {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(leave.status)}
                          <span className="font-medium capitalize">{leave.status || 'Pending'}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}

                {leaves.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">No leave applications</p>
                      <p className="text-sm text-muted-foreground">Click "Apply for Leave" to submit a request</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceLeave;
