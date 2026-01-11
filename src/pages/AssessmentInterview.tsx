import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthService } from '@/services/googleAuth';
import { applicationService } from '@/services/jobPortalservice';
import GoogleCalendarConnectButton from '@/components/auth/GoogleCalendarConnectButton';
import { RefreshCw, AlertCircle, CalendarIcon, Clock, Briefcase, BarChart3, Search, X, MapPin, Eye, ChevronRight, CheckCircle, Download, Filter, SlidersHorizontal, Calendar as CalendarFilter, Loader2 } from 'lucide-react';
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  postedDate: Date;
  status: "active" | "closed" | "draft" | "screened";
  totalApplicants: number;
  shortlisted: number;
  interviewed: number;
  selected: number;
  assessmentCount?: number;
  screeningCount?: number;
  threshold?: number | null;
}

const AssessmentAndInterview: React.FC = () => {
  const navigate = useNavigate();

  const [calendarStatus, setCalendarStatus] = useState<{
    is_connected: boolean;
    email?: string;
    connected_at?: string;
    is_token_expired?: boolean;
    loading: boolean;
  }>({ is_connected: false, loading: true });
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // default to showing interview content and hide tab UI (assessment logic commented below)
  const [activeView, setActiveView] = useState<'assessment' | 'interview'>('interview');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleRefreshStatus = async () => {
    try {
      setCalendarError(null);
      setCalendarStatus(prev => ({ ...prev, loading: true }));
      const result = await googleAuthService.getCalendarStatus();
      if (result.success && result.data) {
        setCalendarStatus({ ...result.data, loading: false });
      } else {
        setCalendarError(result.message || "Failed to fetch calendar status");
        setCalendarStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (err: any) {
      console.error("Error fetching calendar status:", err);
      setCalendarError(err?.message || String(err));
      setCalendarStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setCalendarError(null);
        const res = await googleAuthService.getCalendarStatus();
        if (res.success && res.data) {
          setCalendarStatus({ ...res.data, loading: false });
        } else {
          setCalendarError(res.message || "Failed to fetch calendar status");
          setCalendarStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (err: any) {
        console.error("Error fetching calendar status:", err);
        setCalendarError(err?.message || String(err));
        setCalendarStatus(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStatus();
  }, []);

  // Fetch jobs on mount so UI cards and tables have data even when assessment tab is hidden
  useEffect(() => {
    const fetchJobsOnMount = async () => {
      setIsLoadingJobs(true);
      try {
        const response = await applicationService.getAssessmentJobs();
        if (response.success && response.data) {
          const normalizeStatus = (rawStatus: any) => {
            // Rule: If any status is 'closed' -> show 'closed'. Otherwise always show 'active'.
            if (!rawStatus && rawStatus !== 0) return 'active';
            const containsClosed = (val: string) => String(val).toLowerCase().trim() === 'closed';

            if (Array.isArray(rawStatus)) {
              const arr = rawStatus.map((s: any) => String(s).toLowerCase().trim());
              return arr.includes('closed') ? 'closed' : 'active';
            }

            const s = String(rawStatus);
            if (/[,|;]+/.test(s)) {
              const parts = s.split(/[,|;]+/).map(p => p.trim().toLowerCase()).filter(Boolean);
              return parts.includes('closed') ? 'closed' : 'active';
            }

            // Single status value
            const lower = s.trim().toLowerCase();
            return lower === 'closed' ? 'closed' : 'active';
          };

          const transformedJobs: Job[] = response.data.map((job: any) => {
            const location = [job.city, job.state, job.country].filter(Boolean).join(', ') || job.location_type || 'Remote';
            return {
              id: String(job.id),
              title: job.job_title,
              department: job.department_name || 'Unknown',
              location,
              type: job.job_type || 'Full-time',
              postedDate: new Date(job.created_at),
              status: normalizeStatus(job.status),
              totalApplicants: job.application_count || 0,
              shortlisted: job.screening_count || 0,
              interviewed: 0,
              selected: 0,
              assessmentCount: job.assessment_count || 0,
              screeningCount: job.screening_count || 0,
              threshold: job.last_threshold ?? null,
            };
          });
          setJobs(transformedJobs);
        } else {
          console.error('Failed to fetch assessment jobs:', response.message);
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching assessment jobs:', error);
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobsOnMount();
  }, []);

  /*
  // Fetch assessment jobs when activeView is 'assessment'
  useEffect(() => {
    const fetchAssessmentJobs = async () => {
      if (activeView !== 'assessment') return;
      
      setIsLoadingJobs(true);
      try {
        const response = await applicationService.getAssessmentJobs();
        if (response.success && response.data) {
          const normalizeStatus = (rawStatus: any) => {
            if (!rawStatus && rawStatus !== 0) return 'active';
            if (Array.isArray(rawStatus)) {
              const arr = rawStatus.map((s: any) => String(s).toLowerCase());
              return arr.includes('active') ? 'active' : (arr[0] || 'draft');
            }
            const s = String(rawStatus);
            if (/[,|;]+/.test(s)) {
              const parts = s.split(/[,|;]+/).map(p => p.trim().toLowerCase()).filter(Boolean);
              return parts.includes('active') ? 'active' : (parts[0] || 'draft');
            }
            const lower = s.trim().toLowerCase();
            return ['active', 'closed', 'draft', 'screened'].includes(lower) ? (lower as any) : 'active';
          };

          const transformedJobs: Job[] = response.data.map((job: any) => {
            const location = [job.city, job.state, job.country].filter(Boolean).join(', ') || job.location_type || 'Remote';
            return {
              id: String(job.id),
              title: job.job_title,
              department: job.department_name || 'Unknown',
              location,
              type: job.job_type || 'Full-time',
              postedDate: new Date(job.created_at),
              status: normalizeStatus(job.status),
              totalApplicants: job.application_count || 0,
              shortlisted: job.screening_count || 0,
              interviewed: 0,
              selected: 0,
              assessmentCount: job.assessment_count || 0,
              screeningCount: job.screening_count || 0,
              threshold: job.last_threshold ?? null,
            };
          });
          setJobs(transformedJobs);
        } else {
          console.error('Failed to fetch assessment jobs:', response.message);
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching assessment jobs:', error);
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchAssessmentJobs();
  }, [activeView]);
  */

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.department.toLowerCase().includes(searchTerm.toLowerCase()) || job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter;
    const matchesDate = !dateRange.from || (job.postedDate >= dateRange.from && (!dateRange.to || job.postedDate <= dateRange.to));
    return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
  });

  const allDepartments = Array.from(new Set(jobs.map(j => j.department)));

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { color: "bg-green-100 text-green-700 border-green-200", label: "Active" },
      closed: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Closed" },
      draft: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Draft" },
      screened: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Screened" },
    };
    const { color, label } = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant="outline" className={color + " font-medium"}>{label}</Badge>;
  };

  const handleViewJob = (jobId: string) => {
    navigate(`/job-candidates/${jobId}`);
  };

  if (calendarStatus.loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl rounded-md shadow-lg my-10 bg-white">
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Checking calendar connection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!calendarStatus.is_connected) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl my-10">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white pb-16">
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-4">
                  <CalendarIcon className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Google Calendar Connection Required</h2>
                <p className="text-blue-100 text-lg">Connect your calendar to schedule interviews</p>
              </div>
            </CardHeader>
            <CardContent className="p-8 -mt-8">
              <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                {calendarError && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-100 text-red-900">
                    <strong className="block">Calendar connection failed</strong>
                    <p className="text-sm">Unable to connect to Google Calendar. Please reconnect or try again later.</p>
                  </div>
                )}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Why is this required?</h3>
                    <p className="text-gray-700 leading-relaxed">To schedule and manage interviews, we need access to your Google Calendar.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <GoogleCalendarConnectButton onStart={() => setCalendarStatus(prev => ({ ...prev, loading: true }))} onSuccess={handleRefreshStatus} onError={(e) => { setCalendarError(String(e?.message || e || 'Connection failed')); setCalendarStatus(prev => ({ ...prev, loading: false })); }} />
                  <Button onClick={handleRefreshStatus} variant="outline" className="border-2 border-gray-300 hover:bg-gray-50 px-6 py-2.5">
                    <RefreshCw className="w-5 h-5 mr-2" />Refresh Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'assessment' | 'interview')}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
            <div className="absolute inset-0 bg-black/10 z-0" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">Interview Management</h1>
                      <p className="text-indigo-100 mt-1 text-sm sm:text-base">Manage job postings and schedule candidate interviews</p>

                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 max-w-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-xs sm:text-sm font-medium">Jobs</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{jobs.length}</p>
                      </div>
                      <div className="border-l border-white/20 mx-4 h-10" />
                      <div>
                        <p className="text-indigo-100 text-xs sm:text-sm font-medium">Total Applicants</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{jobs.reduce((sum, j) => sum + j.totalApplicants, 0)}</p>
                      </div>
                      {/* users icon removed as requested */}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                {/* <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                <TabsTrigger value="assessment" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Assessments
                  <Badge className="ml-2 bg-white/20 text-white data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">{jobs.reduce((sum, j) => sum + j.shortlisted, 0)}</Badge>
                </TabsTrigger>
                <TabsTrigger value="interview" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Interviews
                  <Badge className="ml-2 bg-white/20 text-white data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">{jobs.reduce((sum, j) => sum + j.interviewed, 0)}</Badge>
                </TabsTrigger>
              </TabsList> */}
              </div>
            </div>
          </div>

          {/* Filters and Search - Temporarily hidden, uncomment to re-enable */}
          {/* <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="Search jobs by title, department, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 h-11 bg-gray-50 border-gray-200 focus:bg-white" />
                    {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2"><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>}
                  </div>
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`h-11 ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {(statusFilter !== "all" || departmentFilter !== "all" || dateRange.from) && (
                      <Badge className="ml-2 bg-indigo-600 text-white">Active</Badge>
                    )}
                  </Button>
                </div>

                {showFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-10 bg-white">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Department</label>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                          <SelectTrigger className="h-10 bg-white">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {allDepartments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date Range</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 w-full justify-start bg-white">
                              <CalendarFilter className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                                ) : (
                                  format(dateRange.from, "MMM dd, yyyy")
                                )
                              ) : (
                                "Select date range"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={{ from: dateRange.from, to: dateRange.to }}
                              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {(statusFilter !== "all" || departmentFilter !== "all" || dateRange.from) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">{filteredJobs.length} jobs match your filters</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStatusFilter("all");
                            setDepartmentFilter("all");
                            setDateRange({});
                          }}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear all filters
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div> */}
          {/* Content Area */}
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/*
              Assessment content commented out.
              To re-enable the Assessment tab and its data fetching logic, uncomment
              the block below and restore the fetch useEffect above.

            <TabsContent value="assessment">
              ... (assessment UI)
            </TabsContent>
            */}

              <TabsContent value="interview" className="mt-6">
                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden rounded-xl">
                  <CardHeader className="border-b border-slate-100 bg-white px-6 py-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                          <Briefcase className="h-5 w-5 text-indigo-600" />
                        </div>
                        Interview Jobs <span className="text-slate-400 font-normal ml-1 text-base">({filteredJobs.length})</span>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingJobs ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
                        <p className="text-slate-500 font-medium">Loading your jobs...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                              <TableHead className="pl-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[300px]">Job Role</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Applicants</TableHead>
                              <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Threshold</TableHead>
                              <TableHead className="pr-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                              <TableRow key={job.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
                                <TableCell className="pl-6 py-4">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                      {job.title.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium bg-slate-100 text-slate-600 border-slate-200">
                                          {job.type}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    {job.department}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    {job.location}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-700">{format(job.postedDate, "MMM dd, yyyy")}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  {getStatusBadge(job.status)}
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold text-slate-700">{job.totalApplicants}</span>
                                    <span className="text-xs text-slate-400">Applicants</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-center">
                                  <div className="flex items-center justify-center">
                                    <span className="text-sm font-medium text-slate-700">
                                      {typeof job.threshold === 'number' ? `${Math.round(job.threshold * 100)}%` : 'Not applied'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="pr-6 py-4 text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewJob(job.id)}
                                    className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm hover:shadow-md transition-all font-medium"
                                  >
                                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-16">
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                                      <Search className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-900 font-medium text-lg">No jobs found</p>
                                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                                      We couldn't find any jobs matching your current filters. Try adjusting your search criteria.
                                    </p>
                                    <Button
                                      variant="link"
                                      onClick={() => {
                                        setStatusFilter("all");
                                        setDepartmentFilter("all");
                                        setDateRange({});
                                        setSearchTerm("");
                                      }}
                                      className="mt-4 text-indigo-600"
                                    >
                                      Clear all filters
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 ml-64">
        <div className="max-w-7xl mx-auto flex justify-end px-4 sm:px-8">
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-8"
            onClick={() => navigate('/hiring/interview')}
          >
            Next Stage: Conduct & Score
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Spacer for bottom bar */}
      <div className="h-24" />
    </DashboardLayout>
  );
};

export default AssessmentAndInterview;
