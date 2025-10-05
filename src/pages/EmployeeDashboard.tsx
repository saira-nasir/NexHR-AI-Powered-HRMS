import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import EmployeeCard from '@/components/Dashboard/EmployeeCard';
import {
  AttendanceStatusCard,
  LeaveBalanceCard,
  MonthlyAttendanceCard,
  PayrollSummaryCard,
  QuickActionsCard,
  RecentActivitiesCard,
  WeeklyHoursCard
} from '@/components/employeeDashboard';

const EmployeeDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EmployeeCard />

        <div className="md:col-span-2">
          <QuickActionsCard />
        </div>

        <AttendanceStatusCard status="checked-in" checkInTime="09:15 AM" workingHours="7h 45m" />
        <RecentActivitiesCard
          activities={[
            { id: '1', message: 'Checked in at 09:15 AM', timestamp: 'Today', color: 'bg-green-500' },
            { id: '2', message: 'Leave request approved', timestamp: 'Yesterday', color: 'bg-blue-500' },
            { id: '3', message: 'Performance review completed', timestamp: '2 days ago', color: 'bg-purple-500' },
            { id: '4', message: 'Payslip generated', timestamp: '3 days ago', color: 'bg-orange-500' },
          ]}
        />
        <WeeklyHoursCard weeklyHours="38h 30m" percentage={96} />
        <MonthlyAttendanceCard attendanceRate={95} />

        <LeaveBalanceCard available={18} used={7} pending={2} />
        <PayrollSummaryCard
          payrollData={{ lastPayment: '$5,200', nextPayDate: 'Dec 31, 2024', ytdEarnings: '$62,400' }}
        />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;


