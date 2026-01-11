import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAttendanceStats, AttendanceStats } from '@/services/attendanceService';
import { format } from 'date-fns';

const AttendanceCard: React.FC = () => {
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getAttendanceStats();
                setStats(data);
            } catch (err) {
                setError('Failed to load attendance data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-md ring-1 ring-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-md ring-1 ring-gray-100 text-red-500">
                {error || 'No data available'}
            </div>
        );
    }

    const data = [
        { name: 'Present', value: stats.present_today, color: '#8b5cf6' }, // Violet-500
        { name: 'Absent', value: stats.absent_today, color: '#e2e8f0' },  // Slate-200
    ];

    const percentage = stats.attendance_percentage || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group relative hr-card h-full flex flex-col overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1"
        >
            {/* Gradient accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Attendance</h3>
                        <p className="text-xs text-slate-500 font-medium">{stats.branch_name}</p>
                    </div>
                </div>
                <div className="flex items-center text-slate-400 text-xs font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <Calendar size={12} className="mr-1.5" />
                    {format(new Date(stats.date), 'MMM dd, yyyy')}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-6">
                    {/* Chart Section */}
                    <div className="relative w-32 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Present</span>
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="flex-1 ml-6 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 border border-violet-100 transition-colors hover:bg-violet-100/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-600 shadow-sm">
                                    <UserCheck size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Present</p>
                                    <p className="text-sm font-bold text-slate-800">{stats.present_today}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/80">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                    <UserX size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Absent</p>
                                    <p className="text-sm font-bold text-slate-800">{stats.absent_today}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-medium mb-1">Total Employees</p>
                        <p className="text-lg font-bold text-slate-800">{stats.total_employees}</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                        <p className="text-xs text-slate-400 font-medium mb-1">On Leave</p>
                        <p className="text-lg font-bold text-slate-800">0</p> {/* Assuming absent includes leave or just 0 for now as API doesn't specify */}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AttendanceCard;
