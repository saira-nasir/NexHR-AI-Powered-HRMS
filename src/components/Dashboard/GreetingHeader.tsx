import React from 'react';
import { ArrowRight, Calendar, Plus, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GreetingHeaderProps {
  userName: string;
}

const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName }) => {
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = getCurrentTimeOfDay();
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Portal</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          {greeting} {userName}
        </h1>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center gap-3">

        <Link
          to="/job-portal"
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          <span>Job Portal</span>
        </Link>
        {/* <button className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" />
          <span>Add report</span>
        </button> */}
      </div>
    </div>
  );
};

export default GreetingHeader;
