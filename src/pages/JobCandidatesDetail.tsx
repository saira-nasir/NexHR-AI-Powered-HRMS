import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationService } from "@/services/jobPortalservice";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  TrendingUp,
  CalendarIcon,
  Clock,
  Save,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  similarityScore: number;
  resumeUrl?: string;
  interviewer?: string;
  interviewDate?: Date;
  interviewTime?: string;
}

const JobCandidatesDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Job data from API
  const [jobData, setJobData] = useState({
    id: jobId,
    title: "",
    department: "",
    location: "",
    type: "",
    openings: 0,
    applicants: 0,
    shortlisted: 0,
  });

  // Candidates data from API
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  // Company users for interviewer dropdown
  const [companyUsers, setCompanyUsers] = useState<Array<{ id: number; fname: string; lname: string; email: string }>>([]);

  // Scheduling modal state
  const [schedulingCandidateId, setSchedulingCandidateId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInterviewers, setSelectedInterviewers] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  const lottieContainer = useRef<HTMLDivElement | null>(null);
  const lottieAnimRef = useRef<any | null>(null);

  // Shortlist selector: show top N candidates by similarity score
  const [shortlistCount, setShortlistCount] = useState<number>(0);
  const maxCandidates = candidates.length;
  // sorted candidates by similarity score (desc)
  const sortedByScore = [...candidates].sort((a, b) => b.similarityScore - a.similarityScore);
  const displayedCandidates = shortlistCount >= maxCandidates ? sortedByScore : sortedByScore.slice(0, shortlistCount);

  // Fetch company users on mount
  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        const response = await applicationService.getCompanyUsers();
        if (response.success && response.data) {
          setCompanyUsers(response.data);
        } else {
          console.error("Failed to fetch company users:", response.message);
        }
      } catch (err) {
        console.error("Error fetching company users:", err);
      }
    };

    fetchCompanyUsers();
  }, []);

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!jobId) {
        setError("No job ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await applicationService.getCandidatesByJob(jobId);
        
        if (response.success && response.data) {
          const apiData = response.data;
          
          // Set job data
          if (apiData.job_title) {
            setJobData({
              id: jobId,
              title: apiData.job_title || "",
              department: apiData.department_name || "",
              location: [apiData.city, apiData.state, apiData.country].filter(Boolean).join(', ') || apiData.location_type || "",
              type: apiData.job_type || "",
              openings: apiData.openings || 0,
              applicants: apiData.application_count || 0,
              shortlisted: apiData.screening_count || 0,
            });
          }

          // Transform candidates data
          if (apiData.candidates && Array.isArray(apiData.candidates)) {
            const transformedCandidates: Candidate[] = apiData.candidates.map((c: any) => ({
              id: String(c.id || c.application_id),
              name: `${c.candidate_fname || ""} ${c.candidate_lname || ""}`.trim() || c.name || "Unknown",
              email: c.email || "",
              phone: c.phone || "",
              location: c.address || c.location || "",
              experience: c.experience ? `${c.experience} years` : "",
              similarityScore: Math.round((c.similarity_score || c.score || 0) * 100),
              resumeUrl: c.resume_url || c.resume,
              interviewer: c.interviewer || "",
              interviewDate: c.interview_date ? new Date(c.interview_date) : undefined,
              interviewTime: c.interview_time || "",
            }));

            setCandidates(transformedCandidates);
            setShortlistCount(transformedCandidates.length);
          } else {
            setCandidates([]);
            setShortlistCount(0);
          }
        } else {
          setError(response.message || "Failed to fetch candidates");
          setCandidates([]);
        }
      } catch (err: any) {
        console.error("Error fetching candidates:", err);
        setError(err?.message || "An error occurred while fetching candidates");
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [jobId]);

  const openScheduleModal = (candidate: Candidate) => {
    // try to preselect interviewer(s) by matching names if present
    const matchedIds: number[] = [];
    if (candidate.interviewer) {
      const names = candidate.interviewer.split(/,|;/).map(s => s.trim());
      names.forEach((n) => {
        const found = companyUsers.find(u => `${u.fname} ${u.lname}` === n || `${u.lname} ${u.fname}` === n || u.email === n);
        if (found) matchedIds.push(found.id);
      });
    }
    setSelectedInterviewers(matchedIds);
    setScheduleDate(candidate.interviewDate);
    setScheduleTime(candidate.interviewTime || "");
    setSchedulingCandidateId(candidate.id);
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSchedulingCandidateId(null);
    setSelectedInterviewers([]);
    setScheduleDate(undefined);
    setScheduleTime("");
    setSchedulingInProgress(false);
    if (lottieContainer.current) {
      if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    }
  };

  const handleScheduleSave = async () => {
    if (!schedulingCandidateId) return;
    setSchedulingInProgress(true);

    // Simulate API save delay; replace with real API call when endpoint is available
    await new Promise((res) => setTimeout(res, 900));

    // update local candidate state
    setCandidates(prev => prev.map(c => c.id === schedulingCandidateId ? {
      ...c,
      interviewer: selectedInterviewers.map(id => {
        const u = companyUsers.find(x => x.id === id);
        return u ? `${u.fname} ${u.lname}` : String(id);
      }).join(', '),
      interviewDate: scheduleDate,
      interviewTime: scheduleTime,
    } : c));

    setSchedulingInProgress(false);
    // brief success animation then close
    await new Promise((res) => setTimeout(res, 400));
    closeScheduleModal();
  };

  // load lottie when modal opens for preview and destroy on close
  useEffect(() => {
    if (!isScheduleModalOpen) {
      return;
    }

    const loadLottie = async () => {
      try {
        console.log('Loading lottie...');
        const lottie = await import('lottie-web');
        console.log('Lottie imported:', lottie);

        if (lottieContainer.current) {
          console.log('Container found:', lottieContainer.current);
          const anim = lottie.loadAnimation({
            container: lottieContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/lottieFiles/calendar-red.json',
          });

          lottieAnimRef.current = anim;
          console.log('Animation loaded successfully:', anim);

          return () => anim.destroy();
        } else {
          console.warn('Container not found');
        }
      } catch (error) {
        console.error('Error loading lottie:', error);
      }
    };

    loadLottie();

    return () => {
      if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    };
  }, [isScheduleModalOpen]);

  const getSimilarityColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-lg text-gray-600">Loading candidates...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate("/hiring/assessment-interview")}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
            <Card className="shadow-xl border-0 mt-8">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-red-100 p-4 rounded-full">
                    <User className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Candidates</h2>
                    <p className="text-gray-600">{error}</p>
                  </div>
                  <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/hiring/assessment-interview")}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>

            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {jobData.title}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm text-indigo-100">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {jobData.department}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {jobData.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {jobData.type}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <p className="text-xs text-indigo-100">Applicants</p>
                    <p className="text-xl font-bold text-white">{jobData.applicants}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <p className="text-xs text-indigo-100">Shortlisted</p>
                    <p className="text-xl font-bold text-white">{jobData.shortlisted}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          <Card className="shadow-xl border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                Shortlisted Candidates (showing {displayedCandidates.length} of {candidates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Show top</label>
                  <input
                    type="range"
                    min={1}
                    max={maxCandidates}
                    value={shortlistCount}
                    onChange={(e) => setShortlistCount(Number(e.target.value))}
                    className="w-48"
                  />
                  <div className="text-sm font-semibold text-gray-800">{shortlistCount} / {maxCandidates}</div>
                </div>
                <div className="text-sm text-gray-600">Sorting by match score (highest first)</div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">Candidate</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Experience</TableHead>
                      <TableHead className="font-semibold">Match Score</TableHead>
                      <TableHead className="font-semibold">Interviewer</TableHead>
                      <TableHead className="font-semibold">Interview Date & Time</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <User className="h-12 w-12 text-gray-300" />
                            <p className="text-gray-500 font-medium">No candidates found</p>
                            <p className="text-sm text-gray-400">
                              {candidates.length === 0 
                                ? "No candidates have been screened for this job yet" 
                                : "Adjust the shortlist slider to show more candidates"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : displayedCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold">
                              {candidate.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{candidate.name}</p>
                              <p className="text-xs text-gray-500">{candidate.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">{candidate.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{candidate.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {candidate.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {candidate.experience}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getSimilarityColor(candidate.similarityScore)} font-bold px-3 py-1`}
                            >
                              {candidate.similarityScore}%
                            </Badge>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {candidate.interviewer ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {candidate.interviewer}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 italic">Not assigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {candidate.interviewDate && candidate.interviewTime ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <CalendarIcon className="h-3 w-3" />
                                  {format(candidate.interviewDate, "MMM dd, yyyy")}
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  {candidate.interviewTime}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not scheduled</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openScheduleModal(candidate)}
                              className="hover:bg-indigo-50"
                            >
                              Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Interview Modal */}
          <Dialog open={isScheduleModalOpen} onOpenChange={(open) => { if (!open) closeScheduleModal(); setIsScheduleModalOpen(open); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Schedule Interview</DialogTitle>
                <DialogDescription className="text-gray-600">Select interviewers, pick a date & time</DialogDescription>
              </DialogHeader>

              {/* Lottie Animation */}
              <div className="flex justify-center py-4">
                <div 
                  ref={lottieContainer} 
                  className="w-full h-full"
                  style={{ 
                    minHeight: '200px', 
                    maxHeight: '200px',
                    minWidth: '200px',
                    maxWidth: '400px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                />
              </div>

              <div className="border-t pt-6 space-y-6">
                {/* Interviewer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="interviewers" className="text-sm font-semibold text-gray-700">
                    Select Interviewers *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        id="interviewers"
                        variant="outline" 
                        className="w-full justify-start min-h-[2.5rem] h-auto text-left"
                      >
                        {selectedInterviewers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedInterviewers.map(id => {
                              const u = companyUsers.find(x => x.id === id);
                              return u ? (
                                <span 
                                  key={id} 
                                  className="inline-flex items-center bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-medium"
                                >
                                  {u.fname} {u.lname}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500">Choose one or more interviewers</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="start">
                      <div className="p-3 border-b">
                        <Input 
                          placeholder="Search by name or email..." 
                          className="h-9"
                          onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            setCompanyUsers(prev => prev.map(u => ({
                              ...u, 
                              __visible: q === '' || (u.fname + ' ' + u.lname + ' ' + u.email).toLowerCase().includes(q)
                            })));
                          }} 
                        />
                      </div>
                      <div className="max-h-64 overflow-auto p-2">
                        {companyUsers.filter(u => (u as any).__visible !== false).length === 0 ? (
                          <div className="text-center py-6 text-sm text-gray-500">
                            No interviewers found
                          </div>
                        ) : (
                          companyUsers.map((user) => (
                            (user as any).__visible === false ? null : (
                              <label 
                                key={user.id} 
                                className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  checked={selectedInterviewers.includes(user.id)}
                                  onCheckedChange={(val) => {
                                    const checked = Boolean(val);
                                    setSelectedInterviewers(prev => 
                                      checked 
                                        ? Array.from(new Set([...prev, user.id])) 
                                        : prev.filter(id => id !== user.id)
                                    );
                                  }}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900">
                                    {user.fname} {user.lname}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {user.email}
                                  </div>
                                </div>
                              </label>
                            )
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedInterviewers.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {selectedInterviewers.length} interviewer{selectedInterviewers.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                      Interview Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, "PPP") : <span className="text-gray-500">Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-semibold text-gray-700">
                      Interview Time *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="h-10 pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                {(selectedInterviewers.length > 0 || scheduleDate || scheduleTime) && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Interview Summary</h4>
                    <div className="space-y-1.5 text-sm text-gray-700">
                      {selectedInterviewers.length > 0 && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                          <span>
                            {selectedInterviewers.map(id => {
                              const u = companyUsers.find(x => x.id === id);
                              return u ? `${u.fname} ${u.lname}` : null;
                            }).filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {scheduleDate && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-indigo-600" />
                          <span>{format(scheduleDate, "PPPP")}</span>
                        </div>
                      )}
                      {scheduleTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span>{scheduleTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={closeScheduleModal} 
                  disabled={schedulingInProgress}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleScheduleSave} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-1 sm:flex-none"
                  disabled={schedulingInProgress || selectedInterviewers.length === 0 || !scheduleDate || !scheduleTime}
                >
                  {schedulingInProgress ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save & Schedule
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobCandidatesDetail;
