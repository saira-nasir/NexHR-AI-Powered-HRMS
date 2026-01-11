import React, { useEffect, useMemo, useState, useRef } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet, apiPost, apiPostFormData, apiDelete } from '@/lib/api'; // Removed unused apiPatch
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Camera, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react'; // Removed unused icons
import { toast } from 'sonner';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { TimeCard, TimeCardData } from '@/components/attendance/TimeCard';
import { AttendanceDetailModal } from '@/components/attendance/AttendanceDetailModal';
import { EmployeeProfile } from '@/components/attendance/EmployeeProfile';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import type { AttendanceStatus } from '@/components/attendance/StatusBadge';
import payrollService, { LeaveRecord } from '@/services/payrollService';
import { employeeService, Employee } from '@/services/employeeService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getUserRole, ROLES } from '@/utils/roleUtils';

// --- Interfaces ---
interface Attendance {
  id: number;
  employee: number;
  date: string;
  check_in: string;
  check_out?: string;
  work_hours?: number | string;
  photo?: string;
}

interface Leave {
  id: number;
  employee: number;
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

interface CheckInResponse {
  message: string;
  checkin_time?: string;
  error?: string;
}

const AttendanceLeave: React.FC = () => {
  // --- State ---
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(true);

  // Get current user from Redux store to check role
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = getUserRole(user);
  const isHR = userRole === ROLES.HR;
  const permissions = useSelector((state: RootState) => state.auth.permissions) || [];
  const hasLeaveApproval = permissions.includes('leave_approval');

  // UI State
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedRecord, setSelectedRecord] = useState<TimeCardData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check-in/out State
  const [recognizedEmployee, setRecognizedEmployee] = useState<any>(null);
  const [recognitionTime, setRecognitionTime] = useState<string>('');
  const [markAttendanceLoading, setMarkAttendanceLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<AttendanceMarkResponse | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<'checkin' | 'checkout'>('checkin');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  // Leave Modal State
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    from_date: '',
    to_date: '',
  });

  const fetchInProgress = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const lastFetchTime = useRef<number>(0);
  const attendanceCompleteRef = useRef<boolean>(false); // Track if attendance is complete
  const POLLING_INTERVAL = 300000; // 5 minutes - only poll when needed
  const MIN_FETCH_GAP = 3000; // Minimum 3 seconds between fetches

  // Leave Approval State (for HR)
  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);
  const [allLeavesLoading, setAllLeavesLoading] = useState(false);
  const [employeesMap, setEmployeesMap] = useState<Map<number, Employee>>(new Map());
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  type TodayButtonState = {
    date: string;
    checkIn: boolean;
    checkOut: boolean;
  };

  const getTodayKey = () => new Date().toISOString().split('T')[0];
  const buttonStorageKey = (userId: number) => `attendance_state_${userId}`;
  const emptyButtonState = (date: string = getTodayKey()): TodayButtonState => ({
    date,
    checkIn: false,
    checkOut: false,
  });

  const [todayButtonState, setTodayButtonState] = useState<TodayButtonState>(emptyButtonState());

  // --- Helpers ---

  const normalizeDate = (value?: string | null): string | null => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed.toISOString().split('T')[0];
  };

  const sameDate = (a?: string | null, b?: string | null): boolean => {
    const normA = normalizeDate(a);
    const normB = normalizeDate(b);
    return !!(normA && normB && normA === normB);
  };

  const dateValue = (value?: string | null): number => {
    const norm = normalizeDate(value);
    if (!norm) return 0;
    const parsed = new Date(norm);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      const userId = payload.user_id || payload.id || payload.sub;
      return userId ? Number(userId) : null;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  };

  // --- Data Merging Logic ---

  const mergeAttendanceRecords = (incoming: Attendance[], existing: Attendance[], userId: number): Attendance[] => {
    const userExisting = existing.filter((record) => record.employee === userId);
    const existingByDate = new Map<string, Attendance>();

    userExisting.forEach((record) => {
      const key = normalizeDate(record.date) ?? record.date;
      if (!existingByDate.has(key)) existingByDate.set(key, record);
    });

    const mergedByDate = new Map<string, Attendance>();

    incoming.forEach((record) => {
      if (record.employee !== userId) return;
      const key = normalizeDate(record.date) ?? record.date;
      const previous = existingByDate.get(key);

      const merged: Attendance = { ...(previous ?? {}), ...record };

      // Preserve local optimistic data if backend data is missing fields
      if (!merged.check_in && previous?.check_in) merged.check_in = previous.check_in;
      if (!merged.check_out && previous?.check_out) merged.check_out = previous.check_out;
      if (merged.work_hours === undefined && previous?.work_hours !== undefined) merged.work_hours = previous.work_hours;
      if (!merged.photo && previous?.photo) merged.photo = previous.photo;

      mergedByDate.set(key, merged);
    });

    // Preserve purely optimistic records (negative IDs) not yet returned by backend
    userExisting.forEach((record) => {
      const key = normalizeDate(record.date) ?? record.date;
      if (!mergedByDate.has(key)) {
        mergedByDate.set(key, record);
      } else {
        // If backend returned record but we have optimistic updates (negative ID check is a proxy)
        const backendRecord = mergedByDate.get(key);
        if (backendRecord && record.id < 0) {
          const merged = {
            ...backendRecord,
            check_in: backendRecord.check_in || record.check_in,
            check_out: backendRecord.check_out || record.check_out,
            work_hours: backendRecord.work_hours !== undefined ? backendRecord.work_hours : record.work_hours,
            photo: backendRecord.photo || record.photo,
          };
          mergedByDate.set(key, merged);
        }
      }
    });

    return Array.from(mergedByDate.values()).sort((a, b) => dateValue(b.date) - dateValue(a.date));
  };

  // --- UI Button State Persistence ---

  const loadStoredButtonState = (userId: number): TodayButtonState => {
    try {
      const raw = localStorage.getItem(buttonStorageKey(userId));
      if (!raw) return emptyButtonState();
      const parsed = JSON.parse(raw) as TodayButtonState;
      if (!parsed?.date || parsed.date !== getTodayKey()) return emptyButtonState();
      return { ...emptyButtonState(parsed.date), ...parsed };
    } catch {
      return emptyButtonState();
    }
  };

  const persistButtonState = (userId: number, state: TodayButtonState) => {
    try {
      localStorage.setItem(buttonStorageKey(userId), JSON.stringify(state));
    } catch (err) {
      console.warn('Unable to persist attendance button state', err);
    }
  };

  const updateButtonState = (patch: Partial<TodayButtonState>, userIdOverride?: number) => {
    const uid = userIdOverride ?? getUserId();
    if (!uid) return;
    setTodayButtonState((prev) => {
      const currentDate = getTodayKey();
      const base = prev.date === currentDate ? prev : emptyButtonState(currentDate);
      const next: TodayButtonState = {
        date: currentDate,
        checkIn: patch.checkIn ?? base.checkIn,
        checkOut: patch.checkOut ?? base.checkOut,
      };
      // If checkout is set true, ensure checkIn flag stays true as well
      if (next.checkOut) next.checkIn = true;
      persistButtonState(uid, next);
      return next;
    });
  };

  // --- API Calls ---

  const fetchAttendance = async (skipMerge: boolean = false, force: boolean = false) => {
    // Prevent excessive polling
    const now = Date.now();
    if (!force && !skipMerge && (now - lastFetchTime.current < MIN_FETCH_GAP)) {
      return;
    }
    if (fetchInProgress.current && !force) return;

    fetchInProgress.current = true;
    lastFetchTime.current = now;

    try {
      const userId = getUserId();
      if (!userId) {
        setAttendanceLoading(false);
        fetchInProgress.current = false;
        return;
      }

      const data = await apiGet(`/payroll/attendance/?employee=${userId}`);

      // Client-side filtering for safety
      const filteredData = Array.isArray(data)
        ? data.filter((record: Attendance) => record.employee === userId)
        : [];

      // Process all state updates synchronously after getting merged records
      const todayKeyValue = normalizeDate(new Date().toISOString());

      setAttendance((prevRecords) => {
        const merged = skipMerge
          ? filteredData.sort((a, b) => dateValue(b.date) - dateValue(a.date))
          : mergeAttendanceRecords(filteredData, prevRecords, userId);

        // Find today's record from merged data
        const todayRecord = merged.find((record) => sameDate(record.date, todayKeyValue) && record.employee === userId) ?? null;

        // CRITICAL FIX: Process todayRecord inside this callback to avoid closure bug
        // This ensures we're working with the correct merged data
        if (todayRecord && todayRecord.employee === userId) {
          const rec = todayRecord;

          // Check if check_in/check_out are time strings or full dates
          const hasCheckIn = !!(rec.check_in && String(rec.check_in).trim() !== '');
          const hasCheckOut = !!(rec.check_out && String(rec.check_out).trim() !== '');

          // Track if attendance is complete (both check-in and check-out done)
          attendanceCompleteRef.current = hasCheckIn && hasCheckOut;

          // Use queueMicrotask to batch state updates after this callback
          queueMicrotask(() => {
            // Update today attendance
            setTodayAttendance({ ...rec });

            // Update button state
            updateButtonState({
              checkIn: hasCheckIn,
              checkOut: hasCheckOut,
            }, userId);

            // Parse Check-in time
            if (hasCheckIn) {
              try {
                const checkInStr = String(rec.check_in);
                let checkInDate: Date;

                if (/^\d{2}:\d{2}:\d{2}/.test(checkInStr)) {
                  const today = new Date().toISOString().split('T')[0];
                  checkInDate = new Date(`${today}T${checkInStr}`);
                } else {
                  checkInDate = new Date(rec.check_in);
                }

                setCheckInTime(!isNaN(checkInDate.getTime()) ? checkInDate : new Date());
              } catch {
                setCheckInTime(new Date());
              }
            } else {
              setCheckInTime(null);
            }

            // Parse Check-out time
            if (hasCheckOut) {
              try {
                const checkOutStr = String(rec.check_out);
                let checkOutDate: Date;

                if (/^\d{2}:\d{2}:\d{2}/.test(checkOutStr)) {
                  const today = new Date().toISOString().split('T')[0];
                  checkOutDate = new Date(`${today}T${checkOutStr}`);
                } else {
                  checkOutDate = new Date(rec.check_out);
                }

                setCheckOutTime(!isNaN(checkOutDate.getTime()) ? checkOutDate : new Date());
                setAttendanceMode('checkin');
              } catch {
                setCheckOutTime(new Date());
              }
            } else {
              setCheckOutTime(null);
            }
          });
        } else {
          // No record for today - reset everything
          attendanceCompleteRef.current = false;
          queueMicrotask(() => {
            setTodayAttendance(null);
            setCheckInTime(null);
            setCheckOutTime(null);
            setAttendanceMode('checkin');
            updateButtonState({
              checkIn: false,
              checkOut: false,
            }, userId);
          });
        }

        return merged;
      });

    } catch (error: any) {
      console.error('Error fetching attendance:', error);
    } finally {
      setAttendanceLoading(false);
      fetchInProgress.current = false;
    }
  };

  // --- Effects ---

  useEffect(() => {
    const checkUserChange = () => {
      const userId = getUserId();
      if (currentUserId !== null && currentUserId !== userId && userId !== null) {
        // Clear state on user switch
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
      if (userId !== currentUserId) setCurrentUserId(userId);
    };

    checkUserChange();
    const interval = setInterval(checkUserChange, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Load button state from localStorage ONLY on initial mount or user change
  // CRITICAL FIX: Removed todayAttendance from dependencies to prevent infinite loop
  // The API response will override localStorage state anyway via updateButtonState
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    // Only load localStorage state on initial mount before API response arrives
    // This provides immediate UI feedback while waiting for backend data
    const stored = loadStoredButtonState(userId);
    setTodayButtonState(stored);
  }, [currentUserId]); // Removed todayAttendance - API updates will call updateButtonState directly

  useEffect(() => {
    fetchAttendance(false, true); // Force initial fetch

    // Smart polling: Only poll if attendance is not complete
    // Stop polling when both check-in and check-out are done
    const interval = setInterval(() => {
      // Don't poll if attendance is complete
      if (attendanceCompleteRef.current) {
        return;
      }

      // Only poll when tab is visible and not already fetching
      if (document.visibilityState === 'visible' && !fetchInProgress.current) {
        fetchAttendance(false, false).catch(console.error);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Reset state automatically at midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getTodayKey();
      setTodayButtonState((prev) => {
        if (prev.date === current) return prev;
        const resetState = emptyButtonState(current);
        const uid = getUserId();
        if (uid) persistButtonState(uid, resetState);
        setTodayAttendance(null);
        setCheckInTime(null);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
        setAttendanceResult(null);
        return resetState;
      });
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const userId = getUserId();
        if (!userId) return;
        const data = await apiGet(`/payroll/leaves/?employee=${userId}`);
        console.log('Fetched leaves data:', data);
        const filtered = Array.isArray(data) ? data.filter((l: Leave) => l.employee === userId) : [];
        console.log('Filtered leaves:', filtered);
        setLeaves(filtered);
      } catch (error) {
        console.error('Error fetching leaves:', error);
        toast.error('Failed to fetch leaves');
      } finally {
        setLeavesLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // Fetch all leaves for HR approval tab (HR sees all leaves including their own)
  const fetchAllLeaves = async () => {
    try {
      setAllLeavesLoading(true);
      // Call without employee filter - backend should return all leaves for HR role
      const data = await payrollService.listLeaves();
      // Ensure we have an array and include ALL leaves (no filtering by employee)
      // This allows HR to see and approve leaves from all employees including themselves
      setAllLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch all leaves:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setAllLeavesLoading(false);
    }
  };

  // Fetch employees for name mapping
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employees = await employeeService.getEmployees();
        const map = new Map<number, Employee>();
        employees.forEach(emp => map.set(emp.id, emp));
        setEmployeesMap(map);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch all leaves when component mounts (for users with leave approval permission)
  useEffect(() => {
    if (hasLeaveApproval) {
      fetchAllLeaves();
    }
  }, [hasLeaveApproval]);

  // --- Handlers ---

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingLeave) return;

    const employee = getUserId();
    if (!employee) {
      toast.error('User not identified');
      return;
    }

    setIsSubmittingLeave(true);
    try {
      await apiPost('/payroll/leaves/', { ...formData, employee });
      toast.success('Leave application submitted');
      setOpen(false);
      setFormData({ leave_type: 'Casual', from_date: '', to_date: '' });
      // Fetch and properly filter leaves for current user only
      const data = await apiGet(`/payroll/leaves/?employee=${employee}`);
      const filtered = Array.isArray(data) ? data.filter((l: Leave) => l.employee === employee) : [];
      setLeaves(filtered);
      // Refresh all leaves for HR approval tab (includes HR's own leave)
      await fetchAllLeaves();
    } catch (error) {
      toast.error('Failed to submit leave application');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Handle leave approval (HR only)
  const handleApproveLeave = async (leaveId: number) => {
    if (!hasLeaveApproval) {
      toast.error('You do not have permission to approve leaves');
      return;
    }
    try {
      await payrollService.approveLeave(leaveId);
      toast.success('Leave approved successfully');
      await fetchAllLeaves();
      // Also refresh user's own leaves
      const userId = getUserId();
      if (userId) {
        const data = await apiGet(`/payroll/leaves/?employee=${userId}`);
        setLeaves(Array.isArray(data) ? data.filter((l: Leave) => l.employee === userId) : []);
      }
    } catch (error: any) {
      console.error('Approve leave failed:', error);
      toast.error('Failed to approve leave', {
        description: error.response?.data?.detail || 'Please try again'
      });
    }
  };

  // Handle leave rejection (HR only)
  const handleRejectLeave = async (leaveId: number) => {
    if (!hasLeaveApproval) {
      toast.error('You do not have permission to reject leaves');
      return;
    }
    try {
      await payrollService.rejectLeave(leaveId);
      toast.success('Leave rejected successfully');
      await fetchAllLeaves();
      // Also refresh user's own leaves
      const userId = getUserId();
      if (userId) {
        const data = await apiGet(`/payroll/leaves/?employee=${userId}`);
        setLeaves(Array.isArray(data) ? data.filter((l: Leave) => l.employee === userId) : []);
      }
    } catch (error: any) {
      console.error('Reject leave failed:', error);
      toast.error('Failed to reject leave', {
        description: error.response?.data?.detail || 'Please try again'
      });
    }
  };

  // Get employee name from ID
  const getEmployeeName = (employeeId: number): string => {
    const employee = employeesMap.get(employeeId);
    if (employee) {
      const firstName = employee.fname || employee.first_name || employee.firstName || '';
      const lastName = employee.lname || employee.last_name || employee.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || employee.name || employee.email || `Employee #${employeeId}`;
    }
    return `Employee #${employeeId}`;
  };

  // Get pending leaves for approval tab
  const pendingLeaves = useMemo(() => {
    return allLeaves.filter(leave => leave.status === 'PENDING');
  }, [allLeaves]);

  // --- Face Recognition Check-In ---
  const handleCheckIn = async (file: File | Blob) => {
    if (markAttendanceLoading || hasCheckedInToday) return;
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");

      // Get user's current geolocation
      let userLatitude: number | null = null;
      let userLongitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;
        console.log('User location captured:', { userLatitude, userLongitude });
      } catch (geoError) {
        console.warn('Geolocation error:', geoError);
        toast.warning('Location access denied', {
          description: 'Continuing without location data'
        });
      }

      // Prepare File
      let fileToSend: File;
      if (file instanceof File) {
        fileToSend = file;
      } else {
        fileToSend = new File([file], `capture-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      }

      const formData = new FormData();
      formData.append('captured_image', fileToSend);
      formData.append('photo', fileToSend);

      // Include geolocation if available
      if (userLatitude !== null && userLongitude !== null) {
        formData.append('latitude', userLatitude.toString());
        formData.append('longitude', userLongitude.toString());
      }

      const response = await apiPostFormData('/attendance/mark-attendance-face/', formData) as AttendanceMarkResponse;
      setAttendanceResult(response);

      if (response.verified) {
        const now = new Date();
        setRecognitionTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        setRecognizedEmployee({
          name: response.employee || 'Employee',
          employeeId: response.employee || String(userId),
          status: 'verified',
        });

        // Optimistic Update
        const nowIso = now.toISOString();
        setTodayAttendance({
          id: -Math.abs(now.getTime()), // Temp ID
          employee: userId,
          date: normalizeDate(nowIso) ?? nowIso.split('T')[0],
          check_in: nowIso,
          photo: response.photo_url,
        });

        setCheckInTime(now);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
        attendanceCompleteRef.current = false; // Reset completion flag
        updateButtonState({ checkIn: true, checkOut: false }, userId);
        toast.success('Check-In Successful', { description: response.message });

        // Single fetch after delay - no need for multiple calls
        setTimeout(() => fetchAttendance(false, true), 2000);

        // Auto-dismiss result to show UI
        setTimeout(() => setAttendanceResult(null), 2000);
      } else {
        toast.error('Verification Failed', { description: response.message });
        // Reset button state on failure to allow retry
        const userId = getUserId();
        if (userId) {
          updateButtonState({ checkIn: false, checkOut: false }, userId);
        }
      }
    } catch (error: any) {
      console.error('Face Check-In Error:', error);
      console.error('Error Response:', error.response?.data);
      const msg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to check in';
      toast.error('Check-In Failed', { description: msg });
      // Reset button state on error to allow retry
      const userId = getUserId();
      if (userId) {
        updateButtonState({ checkIn: false, checkOut: false }, userId);
      }
      // Refresh attendance to sync with backend state - only once
      if (!attendanceCompleteRef.current) {
        setTimeout(() => fetchAttendance(false, true), 2000);
      }
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  // --- Manual Check-In ---
  const handleManualCheckIn = async () => {
    if (markAttendanceLoading || hasCheckedInToday) return;
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");

      // Get user's current geolocation
      let userLatitude: number | null = null;
      let userLongitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;
        console.log('User location captured:', { userLatitude, userLongitude });
      } catch (geoError) {
        console.warn('Geolocation error:', geoError);
        toast.warning('Location access denied', {
          description: 'Continuing without location data'
        });
      }

      const payload: any = { "checkin": true };

      // Include geolocation if available
      if (userLatitude !== null && userLongitude !== null) {
        payload.latitude = userLatitude;
        payload.longitude = userLongitude;
      }

      const response = await apiPost('/attendance/manual-attendance/', payload) as CheckInResponse;

      if (response.message && response.message.toLowerCase().includes('success')) {
        const now = response.checkin_time ? new Date(response.checkin_time) : new Date();
        const nowIso = now.toISOString();

        setTodayAttendance((prev) => ({
          id: prev?.id ?? -Math.abs(now.getTime()),
          employee: prev?.employee ?? userId,
          date: normalizeDate(nowIso) ?? nowIso.split('T')[0],
          check_in: nowIso,
        }));

        setCheckInTime(now);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
        setAttendanceResult({ verified: true, message: response.message });
        attendanceCompleteRef.current = false; // Reset completion flag
        updateButtonState({ checkIn: true, checkOut: false }, userId);
        toast.success('Check-In Successful');
        // Single fetch after delay
        setTimeout(() => fetchAttendance(false, true), 2000);
      } else {
        toast.error('Check-In Failed', { description: response.message });
        // Reset button state on failure to allow retry
        const userId = getUserId();
        if (userId) {
          updateButtonState({ checkIn: false, checkOut: false }, userId);
        }
      }
    } catch (error: any) {
      console.error('Manual Check-In Error:', error);
      console.error('Error Response:', error.response?.data);
      const msg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to check in';
      toast.error('Error', { description: msg });
      // Reset button state on error to allow retry
      const userId = getUserId();
      if (userId) {
        updateButtonState({ checkIn: false, checkOut: false }, userId);
      }
      // Refresh attendance to sync with backend state - only once
      if (!attendanceCompleteRef.current) {
        setTimeout(() => fetchAttendance(false, true), 2000);
      }
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  // --- Manual Check-Out ---
  const handleCheckOut = async () => {
    if (!showCheckoutConfirm) return;
    if (markAttendanceLoading || isCheckOutDisabled) {
      setShowCheckoutConfirm(false);
      return;
    }
    setMarkAttendanceLoading(true);
    setShowCheckoutConfirm(false);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");
      if (!todayAttendance?.check_in) {
        toast.error('No Check-In Found');
        return;
      }

      // Get user's current geolocation
      let userLatitude: number | null = null;
      let userLongitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;
        console.log('User location captured:', { userLatitude, userLongitude });
      } catch (geoError) {
        console.warn('Geolocation error:', geoError);
        toast.warning('Location access denied', {
          description: 'Continuing without location data'
        });
      }

      const payload: any = { "checkout": true };

      // Include geolocation if available
      if (userLatitude !== null && userLongitude !== null) {
        payload.latitude = userLatitude;
        payload.longitude = userLongitude;
      }

      const response = await apiPost('/attendance/manual-attendance/', payload) as CheckoutResponse;

      if (response.message && (response.message.includes('success') || response.message.includes('checked out'))) {
        const checkoutTime = response.checkout_time ? new Date(response.checkout_time) : new Date();
        const durationMs = checkoutTime.getTime() - new Date(todayAttendance.check_in).getTime();
        const workHours = durationMs > 0 ? parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2)) : 0;

        setAttendanceResult({
          verified: true,
          message: `Checked out successfully. Duration: ${workHours}h`,
        });

        // Optimistic Update
        setTodayAttendance((prev) => prev ? {
          ...prev,
          check_out: checkoutTime.toISOString(),
          work_hours: workHours,
        } : null);

        setCheckOutTime(checkoutTime);
        attendanceCompleteRef.current = true; // Mark as complete - stops polling
        updateButtonState({ checkOut: true }, userId);
        toast.success('Check-Out Successful');
        // Single fetch to confirm - then polling stops
        setTimeout(() => fetchAttendance(false, true), 2000);
      } else {
        toast.error('Checkout Failed', { description: response.message });
      }
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to check out' });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  const resetAttendanceResult = async (nextMode?: 'checkin' | 'checkout') => {
    setAttendanceResult(null);
    if (nextMode) setAttendanceMode(nextMode);
    // Only fetch if needed, not on every reset
    // setTimeout(() => fetchAttendance(true), 100);
  };

  // --- Derived State for Calendar ---
  const timeCards: TimeCardData[] = useMemo(() => {
    return attendance.map(row => {
      const parseTime = (t?: string) => {
        if (!t) return undefined;
        try {
          // Handle "HH:MM:SS" vs ISO
          if (t.includes('T')) return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return t.split('.')[0].substring(0, 5);
        } catch { return t; }
      };

      let status: AttendanceStatus = 'absent';
      if (row.check_in) status = 'present'; // Simplified logic

      return {
        id: String(row.id),
        date: normalizeDate(row.date) || row.date,
        checkIn: parseTime(row.check_in),
        checkOut: parseTime(row.check_out),
        status,
        duration: row.work_hours ? `${Number(row.work_hours).toFixed(1)}h` : undefined,
        faceImageUrl: row.photo
      };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [attendance]);

  const attendanceMap = useMemo(() => {
    const m = new Map<string, { status: AttendanceStatus; confidence?: number }>();
    timeCards.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        m.set(r.date, { status: r.status as AttendanceStatus });
      }
    });
    return m;
  }, [timeCards, currentMonth, currentYear]);

  // Memoize button states to prevent unnecessary recalculations
  // CRITICAL: Check both buttonState AND todayAttendance for accurate state
  const hasCheckedInToday = useMemo(() => {
    // Priority 1: Button state (immediate updates)
    if (todayButtonState.checkIn) return true;
    // Priority 2: Backend data (time strings like "10:32:49.314947" or full dates)
    const checkIn = todayAttendance?.check_in;
    if (!checkIn) return false;
    const checkInStr = String(checkIn).trim();
    // Time strings are truthy if not empty
    return checkInStr !== '' && checkInStr !== 'null';
  }, [todayButtonState.checkIn, todayAttendance?.check_in]);

  const hasCheckedOutToday = useMemo(() => {
    // Priority 1: Button state (immediate updates)
    if (todayButtonState.checkOut) return true;
    // Priority 2: Backend data (time strings like "10:33:08.182621" or full dates)
    const checkOut = todayAttendance?.check_out;
    if (!checkOut) return false;
    const checkOutStr = String(checkOut).trim();
    // Time strings are truthy if not empty
    return checkOutStr !== '' && checkOutStr !== 'null';
  }, [todayButtonState.checkOut, todayAttendance?.check_out]);

  const isCheckInDisabled = useMemo(() => {
    return hasCheckedInToday || markAttendanceLoading;
  }, [hasCheckedInToday, markAttendanceLoading]);

  const isCheckOutDisabled = useMemo(() => {
    return !hasCheckedInToday || hasCheckedOutToday || markAttendanceLoading;
  }, [hasCheckedInToday, hasCheckedOutToday, markAttendanceLoading]);

  // --- Render ---

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance & Leave</h1>
          <p className="text-muted-foreground">Manage your attendance records and leave applications</p>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className={`grid w-full ${hasLeaveApproval ? 'grid-cols-3' : 'grid-cols-2'} bg-muted/50 p-1 rounded-xl`}>
            <TabsTrigger value="attendance" className="rounded-lg">
              <CalendarIcon className="mr-2 h-4 w-4" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="leave" className="rounded-lg">
              <CalendarIcon className="mr-2 h-4 w-4" /> Leave
            </TabsTrigger>
            {hasLeaveApproval && (
              <TabsTrigger value="leave-approval" className="rounded-lg">
                <UserCheck className="mr-2 h-4 w-4" /> Leave Approval
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {attendanceLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading attendance data...</p>
              </div>
            ) : (
              <>
                {/* Control Buttons */}
                <div className="flex flex-row gap-4 mb-6 justify-center">
                  {/* Face Check-in */}
                  <Button
                    onClick={() => {
                      if (isCheckInDisabled) return;
                      if (!hasCheckedInToday || hasCheckedOutToday) {
                        setAttendanceMode('checkin');
                        setAttendanceResult(null);
                      }
                    }}
                    disabled={isCheckInDisabled}
                    className={`w-40 h-14 text-sm font-semibold shadow-md transition-all ${attendanceMode === 'checkin' && (!hasCheckedInToday || hasCheckedOutToday)
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-white text-green-700 border-2 border-green-300'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Face Check In</span>
                    </div>
                  </Button>

                  {/* Manual Check-in */}
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={isCheckInDisabled}
                    className="w-40 h-14 text-sm font-semibold shadow-md bg-white text-green-700 border-2 border-green-300 hover:bg-green-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Manual Check In</span>
                    </div>
                  </Button>

                  {/* Check Out */}
                  <Button
                    onClick={() => setShowCheckoutConfirm(true)}
                    disabled={isCheckOutDisabled}
                    className={`w-40 h-14 text-sm font-semibold shadow-md transition-all ${hasCheckedInToday && !hasCheckedOutToday
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-white text-blue-700 border-2 border-blue-300 opacity-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <span>Check Out</span>
                    </div>
                  </Button>
                </div>

                {/* Webcam / Result Section */}
                {attendanceMode === 'checkin' && !todayAttendance?.check_out && (
                  <div className="mb-6">
                    <div>
                      {!attendanceResult ? (
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                          {/* <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Check In</CardTitle>
                            <CardDescription>Capture your photo to check in via facial recognition</CardDescription>
                          </CardHeader> */}
                          <CardContent>
                            <WebcamCapture
                              key="webcam-checkin"
                              onCapture={handleCheckIn}
                              isLoading={markAttendanceLoading}
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className={`shadow-lg ${attendanceResult.verified ? 'border-green-500' : 'border-red-500'}`}>
                          <CardContent className="pt-12 pb-12 text-center space-y-6">
                            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${attendanceResult.verified ? 'bg-green-500' : 'bg-red-500'}`}>
                              {attendanceResult.verified ? <CheckCircle2 className="h-12 w-12 text-white" /> : <XCircle className="h-12 w-12 text-white" />}
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold mb-2">{attendanceResult.verified ? 'Success!' : 'Failed'}</h2>
                              <p className="text-muted-foreground">{attendanceResult.message}</p>
                            </div>
                            <Button
                              onClick={() => resetAttendanceResult(attendanceResult.verified ? 'checkin' : undefined)}
                              variant={attendanceResult.verified ? "outline" : "default"}
                            >
                              {attendanceResult.verified ? 'Done' : 'Try Again'}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    {/* Recognition Status Card - Temporarily hidden */}
                    {/* <div className="lg:col-span-1">
                      <EmployeeProfile employee={recognizedEmployee} timestamp={recognitionTime} />
                    </div> */}
                  </div>
                )}

                {/* Checkout Result */}
                {attendanceResult && attendanceMode === 'checkin' && todayAttendance?.check_out && (
                  <div className="mb-6">
                    <div>
                      <Card className="border-green-500 shadow-lg">
                        <CardContent className="pt-12 pb-12 text-center space-y-6">
                          <div className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold mb-2">Check-Out Successful!</h2>
                            <p className="text-muted-foreground">{attendanceResult.message}</p>
                          </div>
                          <Button onClick={() => setAttendanceResult(null)} variant="outline" size="lg">Done</Button>
                        </CardContent>
                      </Card>
                    </div>
                    {/* Recognition Status Card - Temporarily hidden */}
                    {/* <div className="lg:col-span-1">
                      <EmployeeProfile 
                        employee={recognizedEmployee} 
                        timestamp={recognitionTime} 
                        checkInTime={checkInTime?.toLocaleTimeString()}
                        checkOutTime={checkOutTime?.toLocaleTimeString()}
                        isCheckedOut={true}
                      />
                    </div> */}
                  </div>
                )}

                {/* Dialogs */}
                <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Check-Out</DialogTitle>
                      <DialogDescription>Are you sure you want to check out? This will complete your work day.</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end mt-4">
                      <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)} disabled={markAttendanceLoading}>Cancel</Button>
                      <Button
                        onClick={handleCheckOut}
                        disabled={markAttendanceLoading}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        {markAttendanceLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Calendar */}
                <div className="mt-8">
                  <AttendanceCalendar
                    year={currentYear}
                    month={currentMonth}
                    attendanceData={attendanceMap}
                    onDateClick={(date) => {
                      const rec = timeCards.find(r => r.date === date);
                      if (rec) { setSelectedRecord(rec); setShowDetailModal(true); }
                    }}
                    onMonthChange={(dir) => {
                      if (dir === 'prev') setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
                      else setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);
                      if (dir === 'prev' && currentMonth === 0) setCurrentYear(y => y - 1);
                      if (dir === 'next' && currentMonth === 11) setCurrentYear(y => y + 1);
                    }}
                  />
                </div>

                <AttendanceDetailModal
                  isOpen={showDetailModal}
                  onClose={() => setShowDetailModal(false)}
                  data={selectedRecord}
                  onRequestCorrection={() => { toast.success('Request submitted'); setShowDetailModal(false); }}
                  onDownloadPDF={() => toast.success('PDF Downloaded')}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Leave Management</h2>
                <p className="text-muted-foreground">Apply for leave and track your applications</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Apply for Leave</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                    <DialogDescription>Fill in the details to submit your leave request</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select value={formData.leave_type} onValueChange={(v) => setFormData({ ...formData, leave_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Sick">Sick</SelectItem>
                          <SelectItem value="Annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input type="date" value={formData.from_date} onChange={(e) => setFormData({ ...formData, from_date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input type="date" value={formData.to_date} onChange={(e) => setFormData({ ...formData, to_date: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmittingLeave}>
                      {isSubmittingLeave ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {leavesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading leave records...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {leaves.map((leave) => (
                  <Card key={leave.id} className="border-l-4 border-l-primary/50">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{leave.leave_type} Leave</CardTitle>
                          <CardDescription>
                            {new Date(leave.from_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(leave.to_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-300' :
                            leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-300' :
                              'bg-yellow-100 text-yellow-700 border-yellow-300'
                            }`}
                        >
                          {leave.status.toLowerCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {leaves.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    No leave records found.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {hasLeaveApproval && (
            <TabsContent value="leave-approval" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Leave Approval</h2>
                <p className="text-muted-foreground">Review and approve or reject employee leave requests</p>
              </div>

              {pendingLeaves.length > 0 && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-amber-600" />
                      Pending Leave Requests ({pendingLeaves.length})
                    </CardTitle>
                    <CardDescription>Review and approve or reject employee leave applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingLeaves.map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold">{getEmployeeName(leave.employee)}</h3>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Leave Type</p>
                                <p className="font-medium">{leave.leave_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">From Date</p>
                                <p className="font-medium">{new Date(leave.from_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">To Date</p>
                                <p className="font-medium">{new Date(leave.to_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {leave.reason && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">Reason:</p>
                                <p className="font-medium">{leave.reason}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveLeave(leave.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectLeave(leave.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All Leave Requests</CardTitle>
                  <CardDescription>Complete history of all employee leave requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {allLeavesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-muted-foreground">Loading leave requests...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4">Employee</th>
                            <th className="text-left p-4">Leave Type</th>
                            <th className="text-left p-4">From Date</th>
                            <th className="text-left p-4">To Date</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allLeaves.map((leave) => (
                            <tr key={leave.id} className="border-b border-border hover:bg-muted/50">
                              <td className="p-4 font-medium">{getEmployeeName(leave.employee)}</td>
                              <td className="p-4">{leave.leave_type}</td>
                              <td className="p-4">{new Date(leave.from_date).toLocaleDateString()}</td>
                              <td className="p-4">{new Date(leave.to_date).toLocaleDateString()}</td>
                              <td className="p-4">
                                <Badge
                                  variant={
                                    leave.status === 'APPROVED' ? 'secondary' :
                                      leave.status === 'REJECTED' ? 'destructive' :
                                        'outline'
                                  }
                                  className="capitalize"
                                >
                                  {leave.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  {leave.status === 'PENDING' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApproveLeave(leave.id)}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectLeave(leave.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {allLeaves.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                          No leave requests found.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceLeave;