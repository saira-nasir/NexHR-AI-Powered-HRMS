import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend,
    FunnelChart,
    Funnel,
    LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, Briefcase, PieChart as PieChartIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Bulk Sample Data Generation ---

// 1. Hiring Funnel Data (Base)
const baseFunnelData = [
    { stage: 'Applied', count: 1245, fill: '#6366f1' }, // Indigo-500
    { stage: 'Screened', count: 850, fill: '#8b5cf6' }, // Violet-500
    { stage: 'Shortlisted', count: 420, fill: '#a855f7' }, // Purple-500
    { stage: 'Interviewed', count: 180, fill: '#d946ef' }, // Fuchsia-500
    { stage: 'Offer Sent', count: 65, fill: '#ec4899' }, // Pink-500
    { stage: 'Hired', count: 42, fill: '#f43f5e' }, // Rose-500
];

const dummyJobs = [
    { id: 'all', title: 'All Jobs' },
    { id: '1', title: 'Senior Frontend Engineer' },
    { id: '2', title: 'Product Designer' },
    { id: '3', title: 'Backend Developer' },
    { id: '4', title: 'HR Manager' },
];

// 2. Applications Trend Data (Daily for 2 months)
const generateTrendData = () => {
    const data = [];
    const startDate = new Date('2025-09-01');
    for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        // Random trend with some spikes
        const base = 20 + Math.random() * 30;
        const spike = i % 7 === 1 ? Math.random() * 50 : 0; // Spike on Mondays
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: Math.floor(base + spike),
        });
    }
    return data;
};
const applicationsTrendData = generateTrendData();

// 3. Openings by Department Data
const openingsData = [
    { name: 'Engineering', jobs: 24, fill: '#3b82f6' }, // Blue-500
    { name: 'Sales', jobs: 18, fill: '#10b981' }, // Emerald-500
    { name: 'Marketing', jobs: 12, fill: '#f59e0b' }, // Amber-500
    { name: 'Product', jobs: 9, fill: '#8b5cf6' }, // Violet-500
    { name: 'HR', jobs: 5, fill: '#ec4899' }, // Pink-500
    { name: 'Finance', jobs: 4, fill: '#6366f1' }, // Indigo-500
    { name: 'Support', jobs: 7, fill: '#06b6d4' }, // Cyan-500
    { name: 'Legal', jobs: 2, fill: '#64748b' }, // Slate-500
];

// 4. Demographics Data
const demographicsData = [
    { name: 'Male', value: 58, fill: '#3b82f6' },
    { name: 'Female', value: 39, fill: '#ec4899' },
    { name: 'Non-Binary', value: 2, fill: '#8b5cf6' },
    { name: 'Prefer not to say', value: 1, fill: '#94a3b8' },
];

// --- Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 shadow-xl rounded-xl">
                <p className="font-semibold text-slate-700 mb-1">{label}</p>
                <p className="text-indigo-600 font-bold">
                    {payload[0].value} {payload[0].name === 'count' ? 'Candidates' : ''}
                </p>
            </div>
        );
    }
    return null;
};

export default function RecruitmentCharts() {
    const [selectedJob, setSelectedJob] = useState('all');

    // Filter/Simulate data based on selection
    const currentFunnelData = React.useMemo(() => {
        if (selectedJob === 'all') return baseFunnelData;

        // Simulate different data for different jobs
        // Use a pseudo-random multiplier based on job ID to keep it consistent but different
        const multiplier = parseInt(selectedJob) * 0.2 + 0.3;

        return baseFunnelData.map(item => ({
            ...item,
            count: Math.floor(item.count * multiplier)
        }));
    }, [selectedJob]);

    const currentConversion = selectedJob === 'all' ? '3.4%' : `${(2.1 + parseInt(selectedJob || '0') * 0.5).toFixed(1)}%`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            {/* 1. Hiring Funnel */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Briefcase size={20} className="text-indigo-600" />
                                </div>
                                Hiring Funnel
                            </CardTitle>
                            <CardDescription>Conversion rates across recruitment stages</CardDescription>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-[200px]">
                                <Select value={selectedJob} onValueChange={setSelectedJob}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Job" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dummyJobs.map(job => (
                                            <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-2xl font-bold text-indigo-600">{currentConversion}</span>
                                <p className="text-xs text-slate-500">Conversion</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={currentFunnelData}
                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="stage"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                    width={80}
                                />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                                    {currentFunnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="count" position="right" fill="#64748b" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Applications Trend */}
            {/* <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <TrendingUp size={20} className="text-emerald-600" />
                                </div>
                                Application Trends
                            </CardTitle>
                            <CardDescription>Daily application volume over last 60 days</CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-emerald-600">+12.5%</span>
                            <p className="text-xs text-slate-500">vs last period</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={applicationsTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card> */}

            {/* 3. Openings by Department */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Briefcase size={20} className="text-blue-600" />
                        </div>
                        Openings by Department
                    </CardTitle>
                    <CardDescription>Active job requisitions across teams</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={openingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    interval={0}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-800 text-white text-xs p-2 rounded-lg shadow-xl">
                                                    <p className="font-bold">{payload[0].payload.name}</p>
                                                    <p>{payload[0].value} Openings</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="jobs" radius={[8, 8, 0, 0]} barSize={40}>
                                    {openingsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="jobs" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Demographics */}
            {/* <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <Users size={20} className="text-pink-600" />
                        </div>
                        Candidate Demographics
                    </CardTitle>
                    <CardDescription>Gender diversity in current pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographicsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {demographicsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-lg">
                                                    <p className="font-semibold text-slate-700">{payload[0].name}</p>
                                                    <p className="text-indigo-600 font-bold">{payload[0].value}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                                />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                    <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="#1e293b">Total</tspan>
                                    <tspan x="50%" dy="24" fontSize="14" fill="#64748b">Candidates</tspan>
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
}
