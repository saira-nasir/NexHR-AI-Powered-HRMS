import React, { useEffect, useState } from 'react';
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
              <div className="grid gap-4">
                {attendance.map((record) => (
                  <Card key={record.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60 bg-gradient-to-r from-background to-muted/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </CardTitle>
                            <CardDescription>
                              Work hours: {record.work_hours?.toFixed(2) || 'N/A'} hrs
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Check In</p>
                            <p className="font-semibold text-foreground">
                              {new Date(record.check_in).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Check Out</p>
                            <p className="font-semibold text-foreground">
                              {record.check_out 
                                ? new Date(record.check_out).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Not recorded'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {attendance.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">No attendance records</p>
                      <p className="text-sm text-muted-foreground">Your attendance records will appear here</p>
                    </CardContent>
                  </Card>
                )}
              </div>
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
