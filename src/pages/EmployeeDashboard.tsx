import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import EmployeeCard from '@/components/Dashboard/EmployeeCard';
import {
  AttendanceStatusCard,
  LeaveBalanceCard,
  MonthlyAttendanceCard,
  PayrollSummaryCard,
  WeeklyHoursCard
} from '@/components/employeeDashboard';
import { getWorkingHours, WorkingHoursStats, DailyHours } from '@/services/attendanceService';
import payrollService, { LeaveRecord, Payroll } from '@/services/payrollService';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Helper to format hours as "Xh Ym"
const formatHoursMinutes = (totalHours: number): string => {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Helper to format time from ISO string to "HH:MM AM/PM"
const formatCheckInTime = (isoTime: string | null): string => {
  if (!isoTime) return '--:--';
  try {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '--:--';
  }
};

// Calculate days between two dates (inclusive)
const daysBetween = (fromDate: string, toDate: string): number => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Loading skeleton component
const LoadingCard: React.FC<{ title: string }> = ({ title }) => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </CardContent>
  </Card>
);

const EmployeeDashboard: React.FC = () => {
  // State for working hours data (powers Today's Status + Weekly Hours + Monthly Attendance)
  const [workingHours, setWorkingHours] = useState<WorkingHoursStats | null>(null);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(true);
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null);

  // State for leave data
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [leavesError, setLeavesError] = useState<string | null>(null);

  // State for payroll data
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [payrollsLoading, setPayrollsLoading] = useState(true);
  const [payrollsError, setPayrollsError] = useState<string | null>(null);

  // Fetch working hours data
  const fetchWorkingHours = useCallback(async () => {
    try {
      setWorkingHoursLoading(true);
      setWorkingHoursError(null);
      const data = await getWorkingHours();
      setWorkingHours(data);
    } catch (error) {
      console.error('Error fetching working hours:', error);
      setWorkingHoursError('Failed to load attendance data');
    } finally {
      setWorkingHoursLoading(false);
    }
  }, []);

  // Fetch leaves data
  const fetchLeaves = useCallback(async () => {
    try {
      setLeavesLoading(true);
      setLeavesError(null);
      const data = await payrollService.listLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeavesError('Failed to load leave data');
    } finally {
      setLeavesLoading(false);
    }
  }, []);

  // Fetch payrolls data
  const fetchPayrolls = useCallback(async () => {
    try {
      setPayrollsLoading(true);
      setPayrollsError(null);
      const data = await payrollService.listPayrolls();
      setPayrolls(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setPayrollsError('Failed to load payroll data');
    } finally {
      setPayrollsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchWorkingHours();
    fetchLeaves();
    fetchPayrolls();
  }, [fetchWorkingHours, fetchLeaves, fetchPayrolls]);

  // Derived data for Today's Status card
  const todayStatus = useMemo(() => {
    if (!workingHours?.current_week?.daily_hours) {
      return { status: 'absent', checkInTime: '--:--', workingHours: '0h' };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = workingHours.current_week.daily_hours.find(
      (d: DailyHours) => d.date === today
    );

    if (!todayEntry) {
      return { status: 'absent', checkInTime: '--:--', workingHours: '0h' };
    }

    const status = todayEntry.check_in_time ? 'checked-in' : 'absent';
    const checkInTime = formatCheckInTime(todayEntry.check_in_time);
    const hoursWorked = formatHoursMinutes(todayEntry.hours_worked || 0);

    return { status, checkInTime, workingHours: hoursWorked };
  }, [workingHours]);

  // Derived data for Weekly Hours card
  const weeklyData = useMemo(() => {
    if (!workingHours?.current_week) {
      return { weeklyHours: '0h', percentage: 0 };
    }

    const totalHours = workingHours.current_week.total_hours || 0;
    const targetHours = 40; // Standard work week
    const percentage = Math.min(100, Math.round((totalHours / targetHours) * 100));

    return {
      weeklyHours: formatHoursMinutes(totalHours),
      percentage
    };
  }, [workingHours]);

  // Derived data for Monthly Attendance card
  const monthlyAttendance = useMemo(() => {
    if (!workingHours?.current_week?.daily_hours) {
      return 0;
    }

    // Calculate from available data - count days with check_in
    const dailyHours = workingHours.current_week.daily_hours;
    const presentDays = dailyHours.filter((d: DailyHours) =>
      d.status === 'present' || d.status === 'holiday' || d.check_in_time
    ).length;
    const totalDays = dailyHours.length || 1;

    return Math.round((presentDays / totalDays) * 100);
  }, [workingHours]);

  // Derived data for Leave Balance card
  const leaveBalance = useMemo(() => {
    const ANNUAL_LEAVE_QUOTA = 25; // Default annual leave days

    const approvedLeaves = leaves.filter(l => l.status === 'APPROVED');
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING');

    // Calculate used days from approved leaves
    const usedDays = approvedLeaves.reduce((total, leave) => {
      return total + daysBetween(leave.from_date, leave.to_date);
    }, 0);

    const pendingCount = pendingLeaves.length;
    const availableDays = Math.max(0, ANNUAL_LEAVE_QUOTA - usedDays);

    return {
      available: availableDays,
      used: usedDays,
      pending: pendingCount
    };
  }, [leaves]);

  // Derived data for Payroll Summary card
  const payrollSummary = useMemo(() => {
    if (!payrolls || payrolls.length === 0) {
      return null; // No payroll data available
    }

    // Get paid payrolls sorted by date (most recent first)
    const paidPayrolls = payrolls
      .filter(p => p.payment_status === 'PAID' && p.paid_on)
      .sort((a, b) => new Date(b.paid_on!).getTime() - new Date(a.paid_on!).getTime());

    // Last payment amount
    const lastPayment = paidPayrolls.length > 0
      ? `$${parseFloat(paidPayrolls[0].net_salary).toLocaleString()}`
      : 'N/A';

    // Calculate YTD earnings (current year)
    const currentYear = new Date().getFullYear();
    const ytdEarnings = paidPayrolls
      .filter(p => new Date(p.paid_on!).getFullYear() === currentYear)
      .reduce((total, p) => total + parseFloat(p.net_salary || '0'), 0);

    // Next pay date (estimate: last day of current month or next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextPayDate = nextMonth.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      lastPayment,
      nextPayDate,
      ytdEarnings: `$${ytdEarnings.toLocaleString()}`
    };
  }, [payrolls]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card - Already dynamic via Redux */}
        <EmployeeCard />

        {/* Today's Status Card */}
        {workingHoursLoading ? (
          <LoadingCard title="Today's Status" />
        ) : workingHoursError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-600">
              <p className="text-sm">{workingHoursError}</p>
            </CardContent>
          </Card>
        ) : (
          <AttendanceStatusCard
            status={todayStatus.status}
            checkInTime={todayStatus.checkInTime}
            workingHours={todayStatus.workingHours}
          />
        )}

        {/* Weekly Hours Card */}
        {workingHoursLoading ? (
          <LoadingCard title="This Week" />
        ) : workingHoursError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-600">
              <p className="text-sm">{workingHoursError}</p>
            </CardContent>
          </Card>
        ) : (
          <WeeklyHoursCard
            weeklyHours={weeklyData.weeklyHours}
            percentage={weeklyData.percentage}
          />
        )}

        {/* Monthly Attendance Card */}
        {workingHoursLoading ? (
          <LoadingCard title="Monthly Attendance" />
        ) : workingHoursError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-600">
              <p className="text-sm">{workingHoursError}</p>
            </CardContent>
          </Card>
        ) : (
          <MonthlyAttendanceCard attendanceRate={monthlyAttendance} />
        )}

        {/* Leave Balance Card */}
        {leavesLoading ? (
          <LoadingCard title="Leave Balance" />
        ) : leavesError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-600">
              <p className="text-sm">{leavesError}</p>
            </CardContent>
          </Card>
        ) : (
          <LeaveBalanceCard
            available={leaveBalance.available}
            used={leaveBalance.used}
            pending={leaveBalance.pending}
          />
        )}

        {/* Payroll Summary Card - Always show, empty state handled by component */}
        {payrollsLoading ? (
          <LoadingCard title="Payroll Summary" />
        ) : payrollsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-600">
              <p className="text-sm">{payrollsError}</p>
            </CardContent>
          </Card>
        ) : (
          <PayrollSummaryCard
            payrollData={payrollSummary ? {
              lastPayment: payrollSummary.lastPayment,
              nextPayDate: payrollSummary.nextPayDate,
              ytdEarnings: payrollSummary.ytdEarnings
            } : null}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;


