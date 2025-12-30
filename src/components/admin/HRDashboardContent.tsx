import React from 'react';
import { useSelector } from 'react-redux';
import StatsCard from '@/components/Dashboard/StatsCard';
import TeamTracker from '@/components/Dashboard/TeamTracker';
import EmployeeCard from '@/components/Dashboard/EmployeeCard';
import AttendanceCard from '@/components/Dashboard/AttendanceCard';
import WorkingHoursCard from '@/components/Dashboard/WorkingHoursCard';
import GreetingHeader from '@/components/Dashboard/GreetingHeader';

/**
 * HR Dashboard Content Component
 * Extracted from HR Dashboard to be reusable in AdminDashboard
 */
const HRDashboardContent: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const fullName = [user?.fname, user?.lname].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      <GreetingHeader userName={fullName || 'Admin'} />

      {/* Main dashboard grid layout */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5">
        {/* First row - Employee card, Chart card and TeamTracker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-5">
          {/* Left Column (8 cols) - Employee, Attendance, Hours */}
          <div className="md:col-span-8 flex flex-col gap-3 sm:gap-4">
            {/* Top Row: Employee and Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <EmployeeCard />
              <AttendanceCard />
            </div>

            {/* Bottom Row: Avg Hours Card (Full Width of Left Column) */}
            <WorkingHoursCard />
          </div>

          {/* Right Column (4 cols) - Team Tracker */}
          <div className="md:col-span-4">
            <TeamTracker />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboardContent;

