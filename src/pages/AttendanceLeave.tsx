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

  // Leave Approval State (for HR)
  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);
  const [allLeavesLoading, setAllLeavesLoading] = useState(false);
  const [employeesMap, setEmployeesMap] = useState<Map<number, Employee>>(new Map());
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

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

  // --- API Calls ---

  const fetchAttendance = async (skipMerge: boolean = false) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      const userId = getUserId();
      if (!userId) {
        setAttendanceLoading(false);
        return;
      }

      const data = await apiGet(`/payroll/attendance/?employee=${userId}`);

      // Client-side filtering for safety
      const filteredData = Array.isArray(data)
        ? data.filter((record: Attendance) => record.employee === userId)
        : [];

      const todayKey = normalizeDate(new Date().toISOString());
      let todayRecord: Attendance | null = null;

      setAttendance((prevRecords) => {
        const merged = skipMerge
          ? filteredData.sort((a, b) => dateValue(b.date) - dateValue(a.date))
          : mergeAttendanceRecords(filteredData, prevRecords, userId);

        todayRecord = merged.find((record) => sameDate(record.date, todayKey) && record.employee === userId) ?? null;
        return merged;
      });

      // Update Today's State
      if (todayRecord && (todayRecord as Attendance).employee === userId) {
        const rec = todayRecord as Attendance;
        setTodayAttendance({ ...rec });

        // Parse Check-in
        if (rec.check_in) {
          const d = new Date(rec.check_in);
          setCheckInTime(!isNaN(d.getTime()) ? d : new Date());
        } else {
          setCheckInTime(null);
        }

        // Parse Check-out
        if (rec.check_out) {
          // Only set checkout if it's different from previous state (avoids flickering)
          const d = new Date(rec.check_out);
          setCheckOutTime(!isNaN(d.getTime()) ? d : new Date());
          setAttendanceMode('checkin'); // Reset mode if cycle complete
        } else {
          setCheckOutTime(null);
        }
      } else {
        setTodayAttendance(null);
        setCheckInTime(null);
        setCheckOutTime(null);
        setAttendanceMode('checkin');
      }

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

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(() => fetchAttendance().catch(console.error), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const userId = getUserId();
        if (!userId) return;
        const data = await apiGet(`/payroll/leaves/?employee=${userId}`);
        const filtered = Array.isArray(data) ? data.filter((l: Leave) => l.employee === userId) : [];
        setLeaves(filtered);
      } catch (error) {
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

  // Fetch all leaves when component mounts (for HR view only)
  useEffect(() => {
    if (isHR) {
      fetchAllLeaves();
    }
  }, [isHR]);

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
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");

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

        toast.success('Check-In Successful', { description: response.message });

        // Refresh background
        setTimeout(() => fetchAttendance(false), 1000);

        // Auto-dismiss result to show UI
        setTimeout(() => setAttendanceResult(null), 2000);
      } else {
        toast.error('Verification Failed', { description: response.message });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to check in';
      toast.error('Check-In Failed', { description: msg });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  // --- Manual Check-In ---
  const handleManualCheckIn = async () => {
    setMarkAttendanceLoading(true);
    setAttendanceResult(null);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");

      const response = await apiPost('/attendance/manual-attendance/', { "checkin": true }) as CheckInResponse;

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
        toast.success('Check-In Successful');
        setTimeout(() => fetchAttendance(true), 500);
      } else {
        toast.error('Check-In Failed', { description: response.message });
      }
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to check in' });
    } finally {
      setMarkAttendanceLoading(false);
    }
  };

  // --- Manual Check-Out ---
  const handleCheckOut = async () => {
    if (!showCheckoutConfirm) return;
    setMarkAttendanceLoading(true);
    setShowCheckoutConfirm(false);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not identified");
      if (!todayAttendance?.check_in) {
        toast.error('No Check-In Found');
        return;
      }

      const response = await apiPost('/attendance/manual-attendance/', { "checkout": true }) as CheckoutResponse;

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
        toast.success('Check-Out Successful');
        setTimeout(() => fetchAttendance(false), 1000);
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
    setTimeout(() => fetchAttendance(true), 100);
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

  // --- Render ---

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance & Leave</h1>
          <p className="text-muted-foreground">Manage your attendance records and leave applications</p>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className={`grid w-full ${isHR ? 'grid-cols-3' : 'grid-cols-2'} bg-muted/50 p-1 rounded-xl`}>
            <TabsTrigger value="attendance" className="rounded-lg">
              <CalendarIcon className="mr-2 h-4 w-4" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="leave" className="rounded-lg">
              <CalendarIcon className="mr-2 h-4 w-4" /> Leave
            </TabsTrigger>
            {isHR && (
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
                      if (!todayAttendance?.check_in || (todayAttendance?.check_in && todayAttendance?.check_out)) {
                        setAttendanceMode('checkin');
                        setAttendanceResult(null);
                      }
                    }}
                    disabled={!!todayAttendance?.check_in && !todayAttendance?.check_out}
                    className={`w-40 h-14 text-sm font-semibold shadow-md transition-all ${attendanceMode === 'checkin' && (!todayAttendance?.check_in || todayAttendance?.check_out)
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
                    disabled={markAttendanceLoading || (!!todayAttendance?.check_in && !todayAttendance?.check_out)}
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
                    disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
                    className={`w-40 h-14 text-sm font-semibold shadow-md transition-all ${todayAttendance?.check_in && !todayAttendance?.check_out
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
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Check In</CardTitle>
                            <CardDescription>Capture your photo to check in via facial recognition</CardDescription>
                          </CardHeader>
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

                {/* Calendar & History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="lg:col-span-2">
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
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {timeCards.slice(0, 10).map((record, i) => (
                          <TimeCard
                            key={`${record.id}-${i}`}
                            data={record}
                            onClick={() => { setSelectedRecord(record); setShowDetailModal(true); }}
                            compact
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </div>
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

            {leavesLoading ? <div>Loading...</div> : (
              <div className="grid gap-4">
                {leaves.map((leave) => (
                  <Card key={leave.id} className="border-l-4 border-l-primary/50">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{leave.leave_type} Leave</CardTitle>
                          <CardDescription>{new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}</CardDescription>
                        </div>
                        <Badge variant="outline" className="capitalize">{leave.status}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {leaves.length === 0 && <div className="text-center p-8 text-muted-foreground">No leave records found.</div>}
              </div>
            )}
          </TabsContent>

          {isHR && (
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