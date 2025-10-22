import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { apiGet, apiPost } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar as CalendarIcon, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { TimeCard, TimeCardData } from '@/components/attendance/TimeCard';
import { AttendanceDetailModal } from '@/components/attendance/AttendanceDetailModal';
import { CameraView } from '@/components/attendance/CameraView';
import { EmployeeProfile } from '@/components/attendance/EmployeeProfile';
import type { AttendanceStatus } from '@/components/attendance/StatusBadge';

interface Attendance {
  id: number;
  date: string;
  check_in: string;
  check_out?: string;
  work_hours?: number;
  photo?: string;
}

interface Leave {
  id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  status: string;
  reason?: string;
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
  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    from_date: '',
    to_date: '',
  });

  // Decode user id from JWT access token
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || null;
    } catch {
      return null;
    }
  };

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await apiGet('/payroll/attendance/');
        setAttendance(data);
      } catch (error) {
        toast.error('Failed to fetch attendance records');
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Fetch leaves data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const data = await apiGet('/payroll/leaves/');
        setLeaves(data);
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
      // Refresh leaves data
      const data = await apiGet('/payroll/leaves/');
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
    // Determine status: absent if no check_in; late if check_in after 09:15; else present
    const checkInDate = row.check_in ? new Date(row.check_in) : null;
    let status: 'present' | 'late' | 'absent' = 'absent';
    if (checkInDate) {
      const threshold = new Date(checkInDate);
      threshold.setHours(9, 15, 0, 0);
      status = checkInDate > threshold ? 'late' : 'present';
    }
    const formatTime = (d?: string) => {
      if (!d) return undefined;
      const dt = new Date(d);
      return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const duration = typeof row.work_hours === 'number' ? `${row.work_hours.toFixed(1)}h` : undefined;

    return {
      id: String(row.id),
      date: new Date(row.date).toISOString().split('T')[0],
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

  const handleRecognition = (employee: any) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setRecognizedEmployee(employee);
    setRecognitionTime(timeString);
    toast.success(`Welcome back, ${employee.name}!`, { description: `Check-in recorded at ${timeString}` });
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
                {/* Face Recognition Section */}
                <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <CardTitle>Face Recognition Check-In</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 h-[400px]">
                        <CameraView onRecognition={handleRecognition} />
                          </div>
                      <div className="lg:col-span-1">
                        <EmployeeProfile employee={recognizedEmployee} timestamp={recognitionTime} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
