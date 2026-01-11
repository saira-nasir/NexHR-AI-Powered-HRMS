import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWorkingHours, WorkingHoursStats } from '@/services/attendanceService';
import { Card, CardContent } from '@/components/ui/card';

const WorkingHoursCard: React.FC = () => {
    const [stats, setStats] = useState<WorkingHoursStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getWorkingHours();
                setStats(data);
            } catch (err) {
                setError('Failed to load working hours');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Card className="flex-1 flex items-center justify-center min-h-[200px] border border-gray-100 shadow-md ring-1 ring-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </Card>
        );
    }

    if (error || !stats) {
        return (
            <Card className="flex-1 flex items-center justify-center min-h-[200px] text-red-500 border border-gray-100 shadow-md ring-1 ring-gray-100">
                {error || 'No data available'}
            </Card>
        );
    }

    // Transform daily hours for the chart
    const chartData = stats.current_week.daily_hours.map(day => ({
        name: day.day.substring(0, 3), // Mon, Tue, etc.
        hours: day.hours_worked,
        fullDate: day.date,
        status: day.status
    }));

    const avgHours = stats.average_working_hours.toFixed(1);
    // Calculate percentage change (mock logic as API doesn't provide previous week yet)
    // In a real scenario, we'd compare with previous week's avg
    const percentageChange = "+0.5%";

    return (
        <Card className="group relative hr-card flex-1 flex flex-col overflow-hidden border border-gray-100 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 hover:border-purple-200 transition-all duration-300 ease-out hover:-translate-y-1">
            {/* Gradient accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
            <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Avg. Working Hours</h3>
                            <p className="text-xs text-slate-500">Current Week ({stats.current_week.start_date} - {stats.current_week.end_date})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <TrendingUp size={12} />
                        <span className="text-xs font-bold">{percentageChange}</span>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-slate-900">{avgHours}</span>
                    <span className="text-sm text-slate-500 font-medium">hours / week</span>
                </div>

                <div className="flex-1 min-h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                                <p className="font-semibold mb-1">{data.fullDate}</p>
                                                <p>Hours: <span className="font-bold text-violet-300">{data.hours}h</span></p>
                                                <p className="text-slate-400 capitalize">{data.status}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="hours" radius={[4, 4, 4, 4]} barSize={24}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.hours > 0 ? '#8b5cf6' : '#e2e8f0'} // Violet if worked, Slate if 0
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default WorkingHoursCard;
