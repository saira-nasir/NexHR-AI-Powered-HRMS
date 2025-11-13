import type React from "react";
import { useState, useEffect } from "react";
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

  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);
  const [tempInterviewer, setTempInterviewer] = useState("");
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempTime, setTempTime] = useState("");

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

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate.id);
    setTempInterviewer(candidate.interviewer || "");
    setTempDate(candidate.interviewDate);
    setTempTime(candidate.interviewTime || "");
  };

  const handleSave = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, interviewer: tempInterviewer, interviewDate: tempDate, interviewTime: tempTime }
          : c
      )
    );
    setEditingCandidate(null);
    setTempInterviewer("");
    setTempDate(undefined);
    setTempTime("");
  };

  const handleCancel = () => {
    setEditingCandidate(null);
    setTempInterviewer("");
    setTempDate(undefined);
    setTempTime("");
  };

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
                          {editingCandidate === candidate.id ? (
                            <Select value={tempInterviewer} onValueChange={setTempInterviewer}>
                              <SelectTrigger className="h-9 w-48">
                                <SelectValue placeholder="Select interviewer" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyUsers.map((user) => (
                                  <SelectItem key={user.id} value={`${user.fname} ${user.lname}`}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.fname} {user.lname}</span>
                                      <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm">
                              {candidate.interviewer ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  {candidate.interviewer}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCandidate === candidate.id ? (
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 w-32 justify-start">
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {tempDate ? format(tempDate, "MMM dd") : "Date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={tempDate} onSelect={setTempDate} initialFocus />
                                </PopoverContent>
                              </Popover>
                              <Input
                                type="time"
                                value={tempTime}
                                onChange={(e) => setTempTime(e.target.value)}
                                className="h-9 w-28"
                              />
                            </div>
                          ) : (
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
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {editingCandidate === candidate.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(candidate.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(candidate)}
                                className="hover:bg-indigo-50"
                              >
                                Schedule
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobCandidatesDetail;
