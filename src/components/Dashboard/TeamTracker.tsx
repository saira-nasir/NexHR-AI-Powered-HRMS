import React, { useEffect, useState } from 'react';
import { ArrowRight, Users, Layers } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import departmentsService, { DepartmentAnalysis } from '@/services/departmentsService';
import { Skeleton } from '@/components/ui/skeleton';
import { DonutChart, DonutChartSegment } from '@/components/ui/donut-chart';
import { cn } from '@/lib/utils';

const TeamTracker: React.FC = () => {
  const [data, setData] = useState<DepartmentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSegmentLabel, setHoveredSegmentLabel] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await departmentsService.getDepartmentAnalysis();
        // Filter out departments with 0 employees
        const activeDepartments = result.filter(d => d.employee_count > 0);

        // Sort by count descending
        const sortedData = activeDepartments.sort((a, b) => b.employee_count - a.employee_count);
        setData(sortedData);
      } catch (err) {
        console.error("Failed to fetch department analysis", err);
        setError("Failed to load team data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalEmployees = data.reduce((acc, curr) => acc + curr.employee_count, 0);

  // Modern palette
  const COLORS = [
    'hsl(238.7 83.5% 66.7%)', // Indigo-500
    'hsl(262.1 83.3% 57.8%)', // Violet-500
    'hsl(330.4 81.2% 60.4%)', // Pink-500
    'hsl(158.1 64.4% 51.6%)', // Emerald-500
    'hsl(45.4 93.4% 47.5%)', // Amber-500
    'hsl(217.2 91.2% 59.8%)', // Blue-500
    'hsl(188.7 94.5% 42.7%)', // Cyan-500
    'hsl(346.8 77.2% 49.8%)', // Rose-500
    'hsl(173.4 80.4% 40%)',   // Teal-500
    'hsl(84.5 81.2% 43.9%)',  // Lime-500
  ];

  // Transform data for DonutChart
  const chartData: DonutChartSegment[] = data.map((dept, index) => ({
    value: dept.employee_count,
    label: dept.name,
    color: COLORS[index % COLORS.length],
  }));

  // Find the currently hovered segment data
  const activeSegment = chartData.find(
    (segment) => segment.label === hoveredSegmentLabel
  );

  // Determine total value (either hovered or overall)
  const displayValue = activeSegment?.value ?? totalEmployees;
  const displayLabel = activeSegment?.label ?? "Total Employees";
  const displayPercentage =
    activeSegment ? (activeSegment.value / totalEmployees) * 100 : 100;

  if (loading) {
    return (
      <div className="hr-card col-span-1 row-span-2 flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-md ring-1 ring-gray-100 p-5">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hr-card col-span-1 row-span-2 flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-100 shadow-md ring-1 ring-gray-100 p-5 text-center">
        <Users className="h-10 w-10 text-slate-300 mb-2" />
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="group relative hr-card col-span-1 row-span-2 flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-indigo-500" />
              Track your team
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Departmental Distribution</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col items-center justify-center">
        {chartData.length > 0 ? (
          <>
            <div className="relative flex items-center justify-center mb-6">
              <DonutChart
                data={chartData}
                size={220}
                strokeWidth={25}
                animationDuration={1.2}
                animationDelayPerSegment={0.05}
                highlightOnHover={true}
                onSegmentHover={(segment) => setHoveredSegmentLabel(segment?.label ?? null)}
                centerContent={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displayLabel} // Key changes to trigger animation
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "circOut" }}
                      className="flex flex-col items-center justify-center text-center px-2"
                    >
                      <p className="text-slate-500 text-xs font-medium truncate max-w-[140px] mb-1">
                        {displayLabel}
                      </p>
                      <p className="text-3xl font-bold text-slate-800">
                        {displayValue}
                      </p>
                      {/* Only show percentage if a segment is hovered */}
                      {activeSegment && (
                        <p className="text-sm font-medium text-indigo-600 mt-1">
                          {displayPercentage.toFixed(1)}%
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            <div className="w-full space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {chartData.map((segment, index) => (
                <motion.div
                  key={segment.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer border border-transparent",
                    hoveredSegmentLabel === segment.label
                      ? "bg-slate-50 border-slate-100 shadow-sm"
                      : "hover:bg-slate-50"
                  )}
                  onMouseEnter={() => setHoveredSegmentLabel(segment.label)}
                  onMouseLeave={() => setHoveredSegmentLabel(null)}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: segment.color }}
                    ></span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                      {segment.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {segment.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No active employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamTracker;
