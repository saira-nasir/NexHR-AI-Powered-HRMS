import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import StatsCard from '@/components/Dashboard/StatsCard';
import TeamTracker from '@/components/Dashboard/TeamTracker';
import EmployeeCard from '@/components/Dashboard/EmployeeCard';

import AttendanceCard from '@/components/Dashboard/AttendanceCard';
import WorkingHoursCard from '@/components/Dashboard/WorkingHoursCard';
import GreetingHeader from '@/components/Dashboard/GreetingHeader';
import { Plus, Users, Clock } from 'lucide-react';
import { employeeStatusData } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSelector } from 'react-redux';

import RecruitmentCharts from '@/components/Dashboard/RecruitmentCharts';

const Dasboard = () => {
  const isMobile = useIsMobile();

  // Fix: type the state as 'any' to avoid TS error
  const user = useSelector((state: any) => state.auth.user);
  const fullName = [user?.fname, user?.lname].filter(Boolean).join(' ');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <GreetingHeader userName={fullName || 'User'} />

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



          {/* New Recruitment Charts Section */}
          {/* <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Recruitment Analytics</h2>
            </div>
            <RecruitmentCharts />
          </div> */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dasboard;