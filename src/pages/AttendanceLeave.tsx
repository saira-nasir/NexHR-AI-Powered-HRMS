import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet, apiPost, apiPostFormData, apiPatch, apiDelete } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Camera, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
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
  employee?: string;
  verified: boolean;
  similarity?: number;
  message: string;
  photo_url?: string;
}

interface CheckoutResponse {
  message: string;
  checkout_time?: string;
  error?: string;
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
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    from_date: '',
    to_date: '',
  });

  const normalizeDate = (value?: string | null): string | null => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toISOString().split('T')[0];
  };

  const sameDate = (a?: string | null, b?: string | null): boolean => {
    const normA = normalizeDate(a);
    const normB = normalizeDate(b);
    if (!normA || !normB) return false;
    return normA === normB;
  };

  const dateValue = (value?: string | null): number => {
    const norm = normalizeDate(value);
    if (!norm) return 0;
    const parsed = new Date(norm);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
    const fallback = Date.parse(norm);
    return isNaN(fallback) ? 0 : fallback;
  };

  const mergeAttendanceRecords = (incoming: Attendance[], existing: Attendance[], userId: number): Attendance[] => {
    // CRITICAL: Filter existing records to only include those belonging to current user
    const userExisting = existing.filter((record) => record.employee === userId);
    
    const existingByDate = new Map<string, Attendance>();
    userExisting.forEach((record) => {
      const key = normalizeDate(record.date) ?? record.date;
      // Preserve the latest optimistic data for merging
      if (!existingByDate.has(key)) {
        existingByDate.set(key, record);
      }
    });

    const mergedByDate = new Map<string, Attendance>();

    incoming.forEach((record) => {
      // CRITICAL: Only process records belonging to current user
      if (record.employee !== userId) {
        console.warn('⚠️ Skipping record not belonging to current user during merge:', {
          recordEmployeeId: record.employee,
          currentUserId: userId,
          recordId: record.id
        });
        return;
      }
      
      const key = normalizeDate(record.date) ?? record.date;
      const previous = existingByDate.get(key);
      const merged: Attendance = {
        ...(previous ?? {}),
        ...record,
      };

      if ((!merged.check_in || merged.check_in === '') && previous?.check_in) {
        merged.check_in = previous.check_in;
      }
      if ((!merged.check_out || merged.check_out === '') && previous?.check_out) {
        merged.check_out = previous.check_out;
      }
      if (merged.work_hours === undefined && previous?.work_hours !== undefined) {
        merged.work_hours = previous.work_hours;
      }
      if (!merged.photo && previous?.photo) {
        merged.photo = previous.photo;
      }

      mergedByDate.set(key, merged);
    });

    // Carry over optimistic records that backend hasn't confirmed yet (only for current user)
    userExisting.forEach((record) => {
      const key = normalizeDate(record.date) ?? record.date;
      if (!mergedByDate.has(key)) {
        mergedByDate.set(key, record);
      }
    });

    return Array.from(mergedByDate.values()).sort((a, b) => dateValue(b.date) - dateValue(a.date));
  };

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
  const fetchAttendance = async (skipMerge: boolean = false) => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.warn('⚠️ No user ID found, skipping attendance fetch');
        setAttendanceLoading(false);
        return;
      }
      
      try {
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
        
        const todayKey = normalizeDate(new Date().toISOString());
        let mergedRecords: Attendance[] = [];
        let todayRecord: Attendance | null = null;

        setAttendance((prevRecords) => {
          try {
            // Skip merging if explicitly requested (e.g., after clearing)
            const merged = skipMerge 
              ? filteredData.sort((a, b) => dateValue(b.date) - dateValue(a.date))
              : mergeAttendanceRecords(filteredData, prevRecords, userId);
            mergedRecords = merged;
            // CRITICAL: Only find today's record if it belongs to current user
            todayRecord = merged.find((record) => sameDate(record.date, todayKey) && record.employee === userId) ?? null;
            return merged;
          } catch (mergeError) {
            console.error('❌ Error merging attendance records:', mergeError);
            // Return filtered data as fallback
            return filteredData.sort((a, b) => dateValue(b.date) - dateValue(a.date));
          }
        });
        
        // CRITICAL: Only set todayAttendance if record belongs to current user
        if (todayRecord && todayRecord.employee === userId) {
          try {
            console.log('✅ Found today\'s attendance record:', todayRecord);
            console.log('📋 Check-in:', todayRecord.check_in);
            console.log('📋 Check-out:', todayRecord.check_out);
            console.log('📋 Full record:', JSON.stringify(todayRecord, null, 2));
            
            const sanitizedRecord: Attendance = {
              ...todayRecord,
              check_out: todayRecord.check_out || undefined,
            };

            setTodayAttendance({ ...sanitizedRecord });

            if (sanitizedRecord.check_in) {
              try {
                let checkIn: Date | null = null;
                const rawCheckIn = sanitizedRecord.check_in;
                const cleanTime = String(rawCheckIn).split('.')[0];
                  
                    if (/^\d{2}:\d{2}:\d{2}/.test(cleanTime)) {
                  let dateStr = normalizeDate(sanitizedRecord.date) ?? new Date().toISOString().split('T')[0];
                      const combined = `${dateStr}T${cleanTime}`;
                      checkIn = new Date(combined);
                      const now = new Date();
                      const hoursDiff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                      if (hoursDiff > 12) {
                        const utcCombined = `${dateStr}T${cleanTime}Z`;
                        const utcCheckIn = new Date(utcCombined);
                        if (!isNaN(utcCheckIn.getTime())) {
                    console.log('⚠️ Timezone adjustment: Using UTC interpretation for check-in');
                        checkIn = utcCheckIn;
                      }
                    }
                  } else {
                  checkIn = new Date(rawCheckIn);
                }
                
                if (checkIn && !isNaN(checkIn.getTime())) {
                  console.log('✅ Setting check-in time:', checkIn);
                  setCheckInTime(checkIn);
                } else {
                  console.warn('⚠️ Failed to parse check-in time, using current time');
                  setCheckInTime(new Date());
                }
              } catch (error) {
                console.error('Error parsing check-in time:', error);
                setCheckInTime(new Date());
              }
            } else {
              setCheckInTime(null);
            }
              
            if (!sanitizedRecord.check_out) {
              console.log('➡️ No check-out found');
              setCheckOutTime(null);
            } else {
              console.log('✅ Check-out exists in record:', sanitizedRecord.check_out);
              try {
                let checkOut: Date | null = null;
                const rawCheckOut = sanitizedRecord.check_out;
                const cleanOut = String(rawCheckOut).split('.')[0];

                if (/^\d{2}:\d{2}:\d{2}/.test(cleanOut)) {
                  let dateStr = normalizeDate(sanitizedRecord.date) ?? new Date().toISOString().split('T')[0];
                  const combined = `${dateStr}T${cleanOut}`;
                      checkOut = new Date(combined);
                    } else {
                  checkOut = new Date(rawCheckOut);
                }
                
                if (checkOut && !isNaN(checkOut.getTime())) {
                  const parsedCheckIn = sanitizedRecord.check_in ? new Date(sanitizedRecord.check_in) : null;
                  if (parsedCheckIn && !isNaN(parsedCheckIn.getTime()) && checkOut < parsedCheckIn) {
                    console.warn('⚠️ Check-out time is before check-in time, using current time instead');
                    setCheckOutTime(new Date());
                  } else {
                    console.log('✅ Setting check-out time:', checkOut);
                    setCheckOutTime(checkOut);
                  }
                } else {
                  console.warn('⚠️ Failed to parse check-out time, clearing local state');
                  setCheckOutTime(null);
                }
              } catch (error) {
                console.error('❌ Error parsing check-out time:', error);
                setCheckOutTime(null);
              }

              setAttendanceMode('checkin');
            }
          } catch (stateError) {
            console.error('❌ Error setting today attendance state:', stateError);
            // Don't throw - just log and continue
          }
        } else {
          setTodayAttendance(null);
          setCheckInTime(null);
          setCheckOutTime(null);
          setAttendanceMode('checkin');
        }
      } catch (apiError: any) {
        console.error('❌ Error fetching attendance from API:', apiError);
        // Don't show error toast if it's a network error during check-in (might be temporary)
        // Only show if it's a critical error
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          toast.error('Authentication Error', { 
            description: 'Your session may have expired. Please refresh the page.' 
          });
        } else if (apiError.response?.status !== 404) {
          // 404 is okay - just means no records yet
          console.warn('⚠️ Attendance fetch failed, but continuing:', apiError.message);
        }
        // Don't throw - allow component to continue rendering
      }
    } catch (error: any) {
      console.error('❌ Unexpected error in fetchAttendance:', error);
      // Don't show toast for unexpected errors during check-in flow
      // Just log and continue
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Track user changes and clear state when user switches
  useEffect(() => {
    const checkUserChange = () => {
      const userId = getUserId();
      
      // If user changed, clear all attendance-related state
      if (currentUserId !== null && currentUserId !== userId && userId !== null) {
        console.log('🔄 User changed detected. Clearing attendance state...', {
          previousUserId: currentUserId,
          newUserId: userId
        });
        
        // Clear all state
        setAttendance([]);
        setTodayAttendance(null);
        setCheckInTime(null);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
        setAttendanceResult(null);
        setRecognizedEmployee(null);
        setRecognitionTime('');
        setShowCheckoutConfirm(false);
      }
      
      // Update current user ID
      if (userId !== currentUserId) {
        setCurrentUserId(userId);
      }
    };
    
    // Check on mount and set initial user ID
    checkUserChange();
    
    // Set up interval to periodically check for user changes (every 5 seconds)
    const userCheckInterval = setInterval(checkUserChange, 5000);
    
    return () => clearInterval(userCheckInterval);
  }, [currentUserId]);

  useEffect(() => {
    // Initial fetch with error handling to prevent blank screen
    const loadData = async () => {
      try {
        await fetchAttendance();
      } catch (error) {
        console.error('❌ Error in initial attendance fetch:', error);
        // Don't show error toast on initial load - just set loading to false
        // This prevents blank screen if there's an error
        setAttendanceLoading(false);
      }
    };
    
    loadData();
    
    // Set up periodic refresh to keep data in sync (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchAttendance().catch((error) => {
        console.error('❌ Error in periodic attendance fetch:', error);
        // Silently fail - don't disrupt user experience
      });
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

    let duration = typeof row.work_hours === 'number' 
      ? `${row.work_hours.toFixed(1)}h` 
      : (typeof row.work_hours === 'string' && row.work_hours) 
        ? `${parseFloat(row.work_hours).toFixed(1)}h`
        : undefined;

    if (!duration && row.check_in && row.check_out) {
      try {
        const checkInDate = new Date(row.check_in);
        const checkOutDate = new Date(row.check_out);
        if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate) {
          const diffHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
          duration = `${diffHours.toFixed(1)}h`;
        }
      } catch {
        // Ignore parsing errors; duration will remain undefined
      }
    }

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

  // Handle check-in with face recognition
  const handleCheckIn = async (file: File) => {
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
      
      // CRITICAL: Verify user hasn't changed
      if (currentUserId !== null && currentUserId !== userId) {
        toast.error('User Changed', { 
          description: 'User session changed. Please refresh the page.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }
      
      console.log('👤 Checking in for user ID:', userId);
      
      const formData = new FormData();
      formData.append('captured_image', file); // ⚠️ Field name: captured_image (NOT photo)
      
      const response = await apiPostFormData('/attendance/mark-attendance-face/', formData) as AttendanceMarkResponse;
      
      // Note: Backend validates user via JWT token, so response.employee is just informational
      // (usually email/name, not ID). Security is handled server-side.
      console.log('✅ Attendance marked successfully for user:', userId);
      console.log('📋 Response employee info:', response.employee);
      
      setAttendanceResult(response);

      // Backend returns: { verified, similarity, message, photo_url }
      // Handle response based on API guide
      if (response.verified) {
        // Check-in successful
        const now = new Date();
        const nowIso = now.toISOString();
        const nowDateKey = normalizeDate(nowIso) ?? nowIso.split('T')[0];
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setRecognitionTime(timeString);
        
        // Update recognized employee with response data
        setRecognizedEmployee({
          name: response.employee || 'Employee',
          employeeId: response.employee || String(userId),
          department: 'Employee',
          status: 'verified',
        });

        // Optimistically update today's attendance and list
        setTodayAttendance((prev) => {
          const optimisticId = prev?.id ?? -Math.abs(now.getTime());
          return {
            id: optimisticId,
            employee: prev?.employee ?? userId,
            date: nowDateKey,
            check_in: nowIso,
            work_hours: undefined,
            photo: response.photo_url ?? prev?.photo,
          };
        });

        setAttendance((prevRecords) => {
          // CRITICAL: Filter to only include records belonging to current user
          const userRecords = prevRecords.filter((record) => record.employee === userId);
          const records = [...userRecords];
          const existingIndex = records.findIndex((record) => sameDate(record.date, nowDateKey));
          const optimisticId = existingIndex >= 0 ? records[existingIndex].id : -Math.abs(now.getTime());

          const updatedRecord: Attendance = {
            id: optimisticId,
            employee: userId,
            date: nowDateKey,
            check_in: nowIso,
            photo: response.photo_url,
          };

          if (existingIndex >= 0) {
            records[existingIndex] = updatedRecord;
            return records.sort((a, b) => dateValue(b.date) - dateValue(a.date));
          }
          return [updatedRecord, ...records].sort((a, b) => dateValue(b.date) - dateValue(a.date));
        });

        setCheckInTime(now);
        setCheckOutTime(null);
        
        // Stay in checkin mode - checkout happens via button
        setAttendanceMode('checkin');

        // Allow backend a moment to persist, then refresh
        // Use setTimeout to avoid blocking the UI
        setTimeout(async () => {
          try {
            await fetchAttendance(true);
          } catch (refreshError) {
            console.error('❌ Error refreshing attendance after check-in:', refreshError);
            // Don't show error - just log it
          }
        }, 500);
        
        toast.success('Check-In Successful', { 
          description: response.message || `Face verified (${((response.similarity || 0) * 100).toFixed(1)}% match). Check-in recorded.` 
        });
      } else {
        // Already checked in or face not recognized
        if (response.message?.includes('already checked in')) {
          toast.info('Already Checked In', { description: response.message });
        } else {
          toast.error('Verification Failed', { 
            description: response.message || `Face not recognized (${((response.similarity || 0) * 100).toFixed(1)}% match). Please try again.` 
          });
        }
      }
    } catch (error: any) {
      // Handle different error formats from backend
      let errorMessage = 'Failed to check in. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific status codes from API guide
        if (error.response.status === 404) {
          errorMessage = 'No face profile registered. Please register your face first.';
        } else if (error.response.status === 403) {
          errorMessage = errorData.message || `Face not recognized (${((errorData.similarity || 0) * 100).toFixed(1)}% match).`;
        } else if (error.response.status === 400) {
          errorMessage = errorData.message || 'No face detected in image. Please ensure your face is clearly visible.';
        } else {
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        }
      }
      
      toast.error('Error', { description: errorMessage });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  // Handle check-out (no face recognition required)
  const handleCheckOut = async () => {
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      const userId = getUserId();
      if (!userId) {
        toast.error('Authentication Error', { 
          description: 'User not identified. Please log in again.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }
      
      // CRITICAL: Verify user hasn't changed
      if (currentUserId !== null && currentUserId !== userId) {
        toast.error('User Changed', { 
          description: 'User session changed. Please refresh the page.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }

      // CRITICAL: Verify todayAttendance belongs to current user
      if (todayAttendance && todayAttendance.employee !== userId) {
        console.error('❌ Security: Attempted checkout with attendance record belonging to different user', {
          recordEmployeeId: todayAttendance.employee,
          currentUserId: userId
        });
        toast.error('Security Error', { 
          description: 'Attendance record does not belong to current user. Please refresh the page.' 
        });
        setMarkAttendanceLoading(false);
        // Clear invalid state
        setTodayAttendance(null);
        await fetchAttendance(true);
        return;
      }

      // Verify check-in exists
      if (!todayAttendance?.check_in) {
        toast.error('No Check-In Found', { 
          description: 'Please check in first before checking out.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }

      // Check if already checked out
      if (todayAttendance?.check_out) {
        toast.info('Already Checked Out', { 
          description: 'You have already checked out today.' 
        });
        setMarkAttendanceLoading(false);
        return;
      }

      console.log('👤 Checking out for user ID:', userId);
      
      // Simple checkout API call (no face recognition needed)
      const checkoutResponse = await apiPatch('/attendance/checkout/', {}) as CheckoutResponse;
      
      if (checkoutResponse.message && (checkoutResponse.message.includes('successfully') || checkoutResponse.message.includes('checked out'))) {
        const checkoutTime = checkoutResponse.checkout_time ? new Date(checkoutResponse.checkout_time) : new Date();
        const checkoutIso = checkoutTime.toISOString();
        const checkInIso = todayAttendance.check_in;
        
        // Calculate duration
        const durationMs = checkoutTime.getTime() - new Date(checkInIso).getTime();
        const workHours = durationMs > 0 ? parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2)) : 0;

        // Set success result
        setAttendanceResult({
          verified: true,
          message: checkoutResponse.message || 'Check-out successful. Work duration: ' + workHours.toFixed(1) + ' hours.',
        });

        // Optimistically update today's attendance
        setTodayAttendance((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            check_out: checkoutIso,
            work_hours: workHours,
          };
        });

        // Update attendance list
        setAttendance((prevRecords) => {
          // CRITICAL: Filter to only include records belonging to current user
          const userRecords = prevRecords.filter((record) => record.employee === userId);
          const records = [...userRecords];
          const todayKey = normalizeDate(todayAttendance.date) ?? new Date().toISOString().split('T')[0];
          const existingIndex = records.findIndex((record) => sameDate(record.date, todayKey) && record.employee === userId);
          
          if (existingIndex >= 0) {
            records[existingIndex] = {
              ...records[existingIndex],
              check_out: checkoutIso,
              work_hours: workHours,
            };
            return records.sort((a, b) => dateValue(b.date) - dateValue(a.date));
          }
          return records;
        });

        setCheckOutTime(checkoutTime);
        setAttendanceMode('checkin'); // Stay in checkin mode
        
        // Show success result
        setAttendanceResult({
          verified: true,
          message: checkoutResponse.message || `Checked out successfully. Work duration: ${workHours.toFixed(1)} hours.`,
        });

        // Refresh to get final data from backend
        // Use setTimeout to avoid blocking the UI
        setTimeout(async () => {
          try {
            await fetchAttendance(true);
          } catch (refreshError) {
            console.error('❌ Error refreshing attendance after checkout:', refreshError);
            // Don't show error - just log it
          }
        }, 500);
        
        toast.success('Check-Out Successful', { 
          description: checkoutResponse.message || `Checked out successfully. Work duration: ${workHours.toFixed(1)} hours.` 
        });
      } else {
        // Checkout failed or already checked out
        if (checkoutResponse.message?.includes('already')) {
          toast.info('Already Checked Out', { description: checkoutResponse.message });
          setAttendanceMode('checkin');
          await fetchAttendance(true);
        } else {
          toast.error('Checkout Failed', { description: checkoutResponse.message || checkoutResponse.error || 'Failed to check out. Please try again.' });
        }
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      let errorMessage = 'Failed to check out. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (error.response.status === 404) {
          errorMessage = 'No check-in record found for today. Please check in first.';
        } else {
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        }
      }
      
      setAttendanceResult({
        verified: false,
        message: errorMessage,
      });
      
      toast.error('Error', { description: errorMessage });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  const resetAttendanceResult = async (nextMode?: 'checkin' | 'checkout') => {
    setAttendanceResult(null);
    
    // Always refresh attendance data when dismissing result to ensure latest state
    // Use setTimeout to avoid blocking UI
    setTimeout(async () => {
      try {
        await fetchAttendance(true);
      } catch (refreshError) {
        console.error('❌ Error refreshing attendance after reset:', refreshError);
        // Don't show error - just log it
      }
    }, 100);
    
    // Set the next mode if specified
    if (nextMode) {
      setAttendanceMode(nextMode);
      return;
    }

    // Always stay in checkin mode - checkout happens via button
    setAttendanceMode('checkin');
  };

  // Clear today's attendance record (for testing purposes)
  const clearTodayAttendance = async () => {
    // If there's no attendance record but cards might still show data, force clear all state
    if (!todayAttendance) {
      // Force clear all related state in case cards are showing stale data
      setTodayAttendance(null);
      setCheckInTime(null);
      setCheckOutTime(null);
      setAttendanceMode('checkin');
      setAttendanceResult(null);
      toast.info('State cleared', { description: 'All local attendance state has been reset' });
      return;
    }

    // Only allow clearing if ID is positive (real backend record, not optimistic)
    if (todayAttendance.id < 0) {
      // Optimistic record - just reset local state immediately
      setTodayAttendance(null);
      setCheckInTime(null);
      setCheckOutTime(null);
      setAttendanceMode('checkin');
      setAttendanceResult(null);
      setAttendance((prev) => prev.filter((record) => record.id !== todayAttendance.id));
      toast.success('Local attendance cleared', { description: 'Optimistic record removed' });
      return;
    }

    // Clear UI state immediately for instant feedback
    const recordId = todayAttendance.id;
    setTodayAttendance(null);
    setCheckInTime(null);
    setCheckOutTime(null);
    setAttendanceMode('checkin');
    setAttendanceResult(null);
    setAttendance((prev) => prev.filter((record) => record.id !== recordId));

    try {
      await apiDelete(`/payroll/attendance/${recordId}/`);
      toast.success('Attendance cleared', { description: 'Today\'s attendance record has been deleted' });
      
      // Refresh attendance list to confirm deletion (skip merge to avoid restoring old data)
      await fetchAttendance(true);
    } catch (error: any) {
      let errorMessage = 'Failed to clear attendance record';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
      toast.error('Error', { description: errorMessage });
      // Re-fetch to restore state if deletion failed
      await fetchAttendance(true);
    }
  };

  // Clear ALL attendance records for the current user (for testing purposes)
  const clearAllAttendance = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error('User not identified', { description: 'Please log in again' });
      return;
    }

    // Filter out optimistic records (negative IDs) and get only real backend records
    const realRecords = attendance.filter((record) => record.id > 0 && record.employee === userId);
    
    if (realRecords.length === 0) {
      toast.info('No records to delete', { description: 'No attendance records found' });
      return;
    }

    // Confirm before deleting all records
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${realRecords.length} attendance record(s)?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    // Clear UI state immediately for instant feedback
    setTodayAttendance(null);
    setCheckInTime(null);
    setCheckOutTime(null);
    setAttendanceMode('checkin');
    setAttendanceResult(null);
    setAttendance([]);

    try {
      setAttendanceLoading(true);
      
      // Delete all records from backend
      const deletePromises = realRecords.map((record) => 
        apiDelete(`/payroll/attendance/${record.id}/`).catch((error) => {
          console.error(`Failed to delete record ${record.id}:`, error);
          return null; // Continue with other deletions even if one fails
        })
      );

      await Promise.all(deletePromises);
      
      toast.success('All attendance cleared', { 
        description: `Successfully deleted ${realRecords.length} attendance record(s)` 
      });
      
      // Refresh to confirm deletion (should return empty array, skip merge to avoid restoring old data)
      await fetchAttendance(true);
    } catch (error: any) {
      let errorMessage = 'Failed to clear attendance records';
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
      toast.error('Error', { description: errorMessage });
      // Re-fetch to restore state if deletion failed
      await fetchAttendance(true);
    } finally {
      setAttendanceLoading(false);
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
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading attendance data...</p>
              </div>
            ) : (
              <>
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
                    onClick={() => {
                      // Direct checkout - no separate mode needed
                      if (todayAttendance?.check_out) {
                        toast.info('Already Checked Out', { description: 'You have already checked out today.' });
                        return;
                      }
                      if (!todayAttendance?.check_in) {
                        toast.error('No Check-In Found', { description: 'Please check in first before checking out.' });
                        return;
                      }
                      // Show confirmation dialog and checkout
                      setShowCheckoutConfirm(true);
                    }}
                    disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
                    className={`
                      w-40 h-14 text-sm font-semibold
                      transition-all duration-200 shadow-md hover:shadow-lg
                      bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-300 hover:border-blue-400
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

                {/* Mark Attendance Section - Show webcam for check-in only */}
                {attendanceMode === 'checkin' && !todayAttendance?.check_out && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                      {!attendanceResult || (attendanceResult && todayAttendance?.check_out) ? (
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-5 h-5 text-blue-600" />
                              <CardTitle>Check In</CardTitle>
                            </div>
                            <CardDescription>
                              Capture your photo to check in via facial recognition
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <WebcamCapture 
                              key="webcam-checkin" 
                              onCapture={handleCheckIn} 
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

                            {/* Result Title - Only show for check-in (not checkout) */}
                            {!todayAttendance?.check_out && (
                              <div>
                                <h2 className="text-3xl font-bold mb-2">
                                  {attendanceResult.verified ? 'Check-In Successful!' : 'Verification Failed'}
                                </h2>
                                <p className="text-muted-foreground">
                                  {attendanceResult.verified 
                                    ? `Face verified. Check-in recorded.${attendanceResult.similarity ? ` (${((attendanceResult.similarity || 0) * 100).toFixed(1)}% match)` : ''}`
                                    : attendanceResult.message}
                                </p>
                              </div>
                            )}

                            {/* Employee Info */}
                            {attendanceResult.employee && (
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                                <span className="text-sm text-muted-foreground">Employee:</span>
                                <span className="font-medium">{attendanceResult.employee}</span>
                              </div>
                            )}

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
                                  Check-in time: {new Date().toLocaleTimeString('en-US', {
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
                                if (!attendanceResult.verified) {
                                  await resetAttendanceResult();
                                  return;
                                }
                                // After successful check-in, just reset to show normal view
                                await resetAttendanceResult('checkin');
                              }}
                              variant={attendanceResult.verified ? "outline" : "default"}
                              size="lg"
                            >
                              {attendanceResult.verified ? 'Done' : 'Try Again'}
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
                )}

                {/* Checkout Success/Error Display - Show only after checkout */}
                {attendanceResult && attendanceMode === 'checkin' && todayAttendance?.check_out && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
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
                                {attendanceResult.verified ? 'Check-Out Successful!' : 'Check-Out Failed'}
                              </h2>
                              <p className="text-muted-foreground">
                                {attendanceResult.verified 
                                  ? (attendanceResult.message || 'Check-out recorded successfully.')
                                  : attendanceResult.message}
                              </p>
                            </div>

                            {/* Work Hours Info */}
                            {attendanceResult.verified && todayAttendance?.work_hours && (
                              <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
                                <p className="text-sm text-muted-foreground mb-1">Total Work Hours</p>
                                <p className="text-3xl font-bold text-blue-700">
                                  {todayAttendance.work_hours.toFixed(1)} hours
                                </p>
                              </div>
                            )}

                            {/* Action Button */}
                            <Button
                              onClick={async () => {
                                await resetAttendanceResult('checkin');
                              }}
                              variant="outline"
                              size="lg"
                            >
                              Done
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-1">
                      {todayAttendance?.check_in && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Today's Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Check-in</p>
                              <p className="text-lg font-semibold">
                                {checkInTime ? checkInTime.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : 'N/A'}
                              </p>
                            </div>
                            {todayAttendance?.check_out && checkOutTime && (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Check-out</p>
                                  <p className="text-lg font-semibold">
                                    {checkOutTime.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {todayAttendance.work_hours && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Work Hours</p>
                                    <p className="text-lg font-semibold text-green-600">
                                      {todayAttendance.work_hours.toFixed(1)} hours
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Checkout Confirmation Dialog */}
                <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Check-Out</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to check out? This will complete your work day.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowCheckoutConfirm(false)}
                        disabled={markAttendanceLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          setShowCheckoutConfirm(false);
                          await handleCheckOut();
                        }}
                        disabled={markAttendanceLoading}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {markAttendanceLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Checking Out...
                          </>
                        ) : (
                          'Confirm Check-Out'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

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
