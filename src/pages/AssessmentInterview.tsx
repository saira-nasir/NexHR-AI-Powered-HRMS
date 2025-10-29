import type React from "react";
import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  Award,
  Code,
  Brain,
  MessageCircle,
  Zap,
  Video,
  User,
  Star,
  UserCheck,
  UserX,
  Briefcase,
  Mail,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

type AssessmentStatus = "pending" | "scheduled" | "completed" | "passed" | "failed";
type AssessmentType = "technical" | "aptitude" | "behavioral" | "coding";

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  screeningScore: number;
  assessmentType?: AssessmentType;
  assessmentDate?: Date;
  assessmentScore?: number;
  status: AssessmentStatus;
}

type InterviewStatus = "pending" | "scheduled" | "completed" | "selected" | "rejected";
type InterviewType = "hr" | "technical" | "managerial" | "panel";

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  assessmentScore: number;
  interviewType?: InterviewType;
  interviewDate?: Date;
  interviewTime?: string;
  interviewer?: string;
  rating?: number;
  feedback?: string;
  status: InterviewStatus;
}

const initialCandidates: Candidate[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", position: "Frontend Developer", screeningScore: 85, status: "pending" },
  { id: "2", name: "Michael Chen", email: "m.chen@email.com", position: "Backend Developer", screeningScore: 92, assessmentType: "coding", assessmentDate: new Date(), status: "scheduled" },
  { id: "3", name: "Emily Rodriguez", email: "emily.r@email.com", position: "Product Manager", screeningScore: 88, assessmentType: "aptitude", assessmentDate: new Date(), assessmentScore: 78, status: "completed" },
  { id: "4", name: "James Wilson", email: "j.wilson@email.com", position: "UX Designer", screeningScore: 90, assessmentType: "behavioral", assessmentDate: new Date(), assessmentScore: 88, status: "passed" },
  { id: "5", name: "Lisa Anderson", email: "l.anderson@email.com", position: "Data Analyst", screeningScore: 75, assessmentType: "technical", assessmentDate: new Date(), assessmentScore: 55, status: "failed" },
  { id: "6", name: "Priya Sharma", email: "priya.s@email.com", position: "QA Engineer", screeningScore: 81, status: "pending" },
  { id: "7", name: "Robert King", email: "r.king@email.com", position: "DevOps Engineer", screeningScore: 87, assessmentType: "technical", assessmentDate: new Date(), status: "scheduled" },
];

const initialInterviews: Interview[] = [
  { id: "1", candidateName: "James Wilson", candidateEmail: "j.wilson@email.com", position: "UX Designer", assessmentScore: 88, status: "pending" },
  { id: "2", candidateName: "Sarah Johnson", candidateEmail: "sarah.j@email.com", position: "Frontend Developer", assessmentScore: 85, interviewType: "technical", interviewDate: new Date(), interviewTime: "10:00 AM", interviewer: "David Miller", status: "scheduled" },
  { id: "3", candidateName: "Michael Chen", candidateEmail: "m.chen@email.com", position: "Backend Developer", assessmentScore: 92, interviewType: "technical", interviewDate: new Date(), interviewTime: "2:00 PM", interviewer: "Rachel Green", rating: 4, feedback: "Strong technical skills.", status: "completed" },
  { id: "4", candidateName: "Emily Rodriguez", candidateEmail: "emily.r@email.com", position: "Product Manager", assessmentScore: 78, interviewType: "managerial", interviewDate: new Date(), interviewTime: "11:00 AM", interviewer: "John Smith", rating: 5, feedback: "Excellent leadership.", status: "selected" },
  { id: "5", candidateName: "Aarav Patel", candidateEmail: "aarav.p@email.com", position: "Data Scientist", assessmentScore: 73, status: "pending" },
  { id: "6", candidateName: "Mei Lin", candidateEmail: "mei.lin@email.com", position: "Mobile Developer", assessmentScore: 91, interviewType: "panel", interviewDate: new Date(), interviewTime: "4:30 PM", interviewer: "Maria Garcia", status: "scheduled" },
];

const assessmentTypeIcons = { technical: Code, coding: Zap, aptitude: Brain, behavioral: MessageCircle } as const;
const interviewers = ["David Miller", "Rachel Green", "John Smith", "Maria Garcia", "Tom Anderson"];

const AssessmentAndInterview: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("technical");
  const [assessmentDate, setAssessmentDate] = useState<Date | undefined>(undefined);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [score, setScore] = useState("");

  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType>("hr");
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleScheduleAssessment = () => {
    if (selectedCandidate && assessmentDate) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === selectedCandidate.id ? { ...c, assessmentType, assessmentDate, status: "scheduled" } : c))
      );
      setIsAssessmentDialogOpen(false);
      setSelectedCandidate(null);
      setAssessmentDate(undefined);
    }
  };

  const handleSubmitScore = () => {
    if (selectedCandidate && score) {
      const numScore = Number.parseInt(score, 10);
      const status: AssessmentStatus = numScore >= 70 ? "passed" : "failed";
      setCandidates((prev) => prev.map((c) => (c.id === selectedCandidate.id ? { ...c, assessmentScore: numScore, status } : c)));
      setIsScoreDialogOpen(false);
      setSelectedCandidate(null);
      setScore("");
    }
  };

  const handleScheduleInterview = () => {
    if (selectedInterview && interviewDate && interviewTime && interviewer) {
      setInterviews((prev) =>
        prev.map((i) =>
          i.id === selectedInterview.id
            ? { ...i, interviewType, interviewDate, interviewTime, interviewer, status: "scheduled" }
            : i
        )
      );
      setIsScheduleDialogOpen(false);
      setSelectedInterview(null);
      setInterviewDate(undefined);
      setInterviewTime("");
      setInterviewer("");
    }
  };

  const handleSubmitFeedback = () => {
    if (selectedInterview && rating > 0) {
      setInterviews((prev) => prev.map((i) => (i.id === selectedInterview.id ? { ...i, rating, feedback, status: "completed" } : i)));
      setIsFeedbackDialogOpen(false);
      setSelectedInterview(null);
      setRating(0);
      setFeedback("");
    }
  };

  const handleUpdateStatus = (id: string, status: InterviewStatus) => {
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const assessmentStats = {
    pending: candidates.filter((c) => c.status === "pending").length,
    scheduled: candidates.filter((c) => c.status === "scheduled").length,
    passed: candidates.filter((c) => c.status === "passed").length,
    total: candidates.length,
  };

  const interviewStats = {
    pending: interviews.filter((i) => i.status === "pending").length,
    scheduled: interviews.filter((i) => i.status === "scheduled").length,
    completed: interviews.filter((i) => i.status === "completed").length,
    selected: interviews.filter((i) => i.status === "selected").length,
  };

  const renderStatusBadge = (variant: "assessment" | "interview", status: any) => {
    if (variant === "assessment") {
      const map: Record<AssessmentStatus, { icon: any; className: string; label: string }> = {
        pending: { icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
        scheduled: { icon: CalendarIcon, className: "bg-blue-100 text-blue-700 border-blue-200", label: "Scheduled" },
        completed: { icon: CheckCircle, className: "bg-purple-100 text-purple-700 border-purple-200", label: "Completed" },
        passed: { icon: Award, className: "bg-green-100 text-green-700 border-green-200", label: "Passed" },
        failed: { icon: XCircle, className: "bg-red-100 text-red-700 border-red-200", label: "Failed" },
      };
      const { icon: Icon, className, label } = map[status as AssessmentStatus];
      return (
        <Badge variant="outline" className={`${className} flex items-center gap-1.5 w-fit px-3 py-1`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Badge>
      );
    }
    const map: Record<InterviewStatus, { icon: any; className: string; label: string }> = {
      pending: { icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
      scheduled: { icon: Video, className: "bg-blue-100 text-blue-700 border-blue-200", label: "Scheduled" },
      completed: { icon: CheckCircle, className: "bg-purple-100 text-purple-700 border-purple-200", label: "Completed" },
      selected: { icon: UserCheck, className: "bg-green-100 text-green-700 border-green-200", label: "Selected" },
      rejected: { icon: UserX, className: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
    };
    const { icon: Icon, className, label } = map[status as InterviewStatus];
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1.5 w-fit px-3 py-1`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          <div className="absolute inset-0 bg-black/10 z-0" />
          <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Assessment & Interview</h1>
                <p className="text-indigo-100 mt-1 text-sm sm:text-base">Manage assessments and interviews in one place</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
          <div className="max-w-7xl mx-auto relative z-10">
            <Tabs defaultValue="assessment" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-white shadow-md border border-gray-200 p-1 rounded-xl">
                  <TabsTrigger value="assessment" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Assessment</span>
                    <span className="sm:hidden">Assess</span>
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Interview</span>
                    <span className="sm:hidden">Interview</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="assessment" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-blue-100">Total Candidates</CardDescription>
                        <Users className="h-8 w-8 text-blue-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{assessmentStats.total}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-amber-100">Pending Assessment</CardDescription>
                        <Clock className="h-8 w-8 text-amber-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{assessmentStats.pending}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-purple-100">Scheduled</CardDescription>
                        <Target className="h-8 w-8 text-purple-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{assessmentStats.scheduled}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-green-100">Passed</CardDescription>
                        <TrendingUp className="h-8 w-8 text-green-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{assessmentStats.passed}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur mt-6 sm:mt-8">
                  <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-gray-900 text-lg sm:text-xl">Assessment Pipeline</CardTitle>
                        <CardDescription className="mt-1 text-sm">Track and manage candidate assessments</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="group">
                          <Card className="border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg bg-white overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col gap-4 sm:gap-6">
                                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-xs sm:text-sm font-semibold">
                                    {candidate.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-900 truncate text-sm sm:text-base font-semibold">{candidate.name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{candidate.email}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                                        {candidate.position}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                        <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="truncate">Screening: {candidate.screeningScore}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                                  {candidate.assessmentType && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      {(() => {
                                        const Icon = assessmentTypeIcons[candidate.assessmentType!];
                                        return <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />;
                                      })()}
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Assessment</p>
                                        <p className="capitalize text-gray-900 font-medium">{candidate.assessmentType}</p>
                                      </div>
                                    </div>
                                  )}

                                  {candidate.assessmentDate && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Date</p>
                                        <p className="text-gray-900 font-medium">{format(candidate.assessmentDate, "MMM dd")}</p>
                                      </div>
                                    </div>
                                  )}

                                  {candidate.assessmentScore !== undefined && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Score</p>
                                        <p className={`font-medium ${candidate.assessmentScore >= 70 ? "text-green-600" : "text-red-600"}`}>{candidate.assessmentScore}%</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex-1 sm:flex-none">{renderStatusBadge("assessment", candidate.status)}</div>

                                  <div className="flex gap-2 flex-wrap">
                                    {candidate.status === "pending" && (
                                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm" onClick={() => { setSelectedCandidate(candidate); setIsAssessmentDialogOpen(true); }}>
                                        <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                        <span className="hidden sm:inline">Schedule</span>
                                        <span className="sm:hidden">Schedule</span>
                                      </Button>
                                    )}
                                    {candidate.status === "completed" && (
                                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm bg-transparent" onClick={() => { setSelectedCandidate(candidate); setIsScoreDialogOpen(true); }}>
                                        <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                        <span className="hidden sm:inline">Add Score</span>
                                        <span className="sm:hidden">Score</span>
                                      </Button>
                                    )}
                                    {candidate.status === "scheduled" && (
                                      <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 text-xs sm:text-sm bg-transparent" onClick={() => { setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, status: "completed" } : c))); }}>
                                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                        <span className="hidden sm:inline">Complete</span>
                                        <span className="sm:hidden">Done</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interview" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-amber-100">Pending Schedule</CardDescription>
                        <Clock className="h-8 w-8 text-amber-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{interviewStats.pending}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-blue-100">Scheduled</CardDescription>
                        <Video className="h-8 w-8 text-blue-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{interviewStats.scheduled}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-purple-100">Completed</CardDescription>
                        <Users className="h-8 w-8 text-purple-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{interviewStats.completed}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-green-100">Selected</CardDescription>
                        <TrendingUp className="h-8 w-8 text-green-200" />
                      </div>
                      <CardTitle className="text-white mt-2">{interviewStats.selected}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur mt-6 sm:mt-8">
                  <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-gray-900 text-lg sm:text-xl">Interview Pipeline</CardTitle>
                        <CardDescription className="mt-1 text-sm">Schedule and track candidate interviews</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {interviews.map((interview) => (
                        <div key={interview.id} className="group">
                          <Card className="border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg bg-white overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col gap-4 sm:gap-6">
                                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-xs sm:text-sm font-semibold">
                                    {interview.candidateName.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-900 truncate text-sm sm:text-base font-semibold">{interview.candidateName}</h3>
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                      <span className="truncate">{interview.candidateEmail}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs sm:text-sm">
                                        <Briefcase className="h-3 w-3 mr-1" />
                                        {interview.position}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                                        <span className="truncate">Assessment: {interview.assessmentScore}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                                  {interview.interviewType && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <Video className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Type</p>
                                        <p className="capitalize text-gray-900 font-medium">{interview.interviewType}</p>
                                      </div>
                                    </div>
                                  )}

                                  {interview.interviewDate && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Date & Time</p>
                                        <p className="text-gray-900 font-medium">{format(interview.interviewDate, "MMM dd")}</p>
                                        <p className="text-xs text-gray-500">{interview.interviewTime}</p>
                                      </div>
                                    </div>
                                  )}

                                  {interview.interviewer && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-gray-500 text-xs">Interviewer</p>
                                        <p className="text-gray-900 font-medium truncate">{interview.interviewer}</p>
                                      </div>
                                    </div>
                                  )}

                                  {typeof interview.rating === "number" && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star key={star} className={`h-4 w-4 sm:h-5 sm:w-5 ${interview.rating! >= star ? "text-amber-500" : "text-gray-300"}`} fill={interview.rating! >= star ? "currentColor" : "none"} />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex-1 sm:flex-none">{renderStatusBadge("interview", interview.status)}</div>

                                  <div className="flex flex-wrap gap-2">
                                    {interview.status === "pending" && (
                                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm" onClick={() => { setSelectedInterview(interview); setIsScheduleDialogOpen(true); }}>
                                        <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                        <span className="hidden sm:inline">Schedule</span>
                                        <span className="sm:hidden">Schedule</span>
                                      </Button>
                                    )}
                                    {interview.status === "scheduled" && (
                                      <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs sm:text-sm bg-transparent" onClick={() => { setSelectedInterview(interview); setIsFeedbackDialogOpen(true); }}>
                                        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                        <span className="hidden sm:inline">Feedback</span>
                                        <span className="sm:hidden">Feedback</span>
                                      </Button>
                                    )}
                                    {interview.status === "completed" && (
                                      <div className="flex gap-2 flex-wrap">
                                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs sm:text-sm" onClick={() => handleUpdateStatus(interview.id, "selected")}>
                                          <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                          <span className="hidden sm:inline">Select</span>
                                          <span className="sm:hidden">Select</span>
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm bg-transparent" onClick={() => handleUpdateStatus(interview.id, "rejected")}>
                                          <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                          <span className="hidden sm:inline">Reject</span>
                                          <span className="sm:hidden">Reject</span>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Assessment</DialogTitle>
            <DialogDescription>Configure assessment for {selectedCandidate?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Assessment Type</Label>
              <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as AssessmentType)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical"><div className="flex items-center gap-2"><Code className="h-4 w-4" />Technical Assessment</div></SelectItem>
                  <SelectItem value="coding"><div className="flex items-center gap-2"><Zap className="h-4 w-4" />Coding Challenge</div></SelectItem>
                  <SelectItem value="aptitude"><div className="flex items-center gap-2"><Brain className="h-4 w-4" />Aptitude Test</div></SelectItem>
                  <SelectItem value="behavioral"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Behavioral Assessment</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assessment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-11 bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {assessmentDate ? format(assessmentDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={assessmentDate} onSelect={setAssessmentDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAssessmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleAssessment} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Send className="h-4 w-4 mr-2" />
              Schedule & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Assessment Score</DialogTitle>
            <DialogDescription>Enter the assessment score for {selectedCandidate?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Score (0-100)</Label>
              <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Enter score" className="h-11" />
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Award className="h-4 w-4 text-blue-600" />
                Pass mark: 70% or above
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitScore} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>Configure interview for {selectedInterview?.candidateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">HR Round</SelectItem>
                  <SelectItem value="technical">Technical Round</SelectItem>
                  <SelectItem value="managerial">Managerial Round</SelectItem>
                  <SelectItem value="panel">Panel Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interview Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-11 bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interviewDate ? format(interviewDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={interviewDate} onSelect={setInterviewDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Interview Time</Label>
              <Input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Assign Interviewer</Label>
              <Select value={interviewer} onValueChange={setInterviewer}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select interviewer" />
                </SelectTrigger>
                <SelectContent>
                  {interviewers.map((name) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleInterview} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Video className="h-4 w-4 mr-2" />
              Schedule & Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>Provide feedback for {selectedInterview?.candidateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} onClick={() => setRating(value)} onMouseEnter={() => setHoveredStar(value)} onMouseLeave={() => setHoveredStar(0)} className="focus:outline-none transition-transform hover:scale-110">
                    <Star className={`h-10 w-10 transition-colors ${value <= (hoveredStar || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Feedback Notes</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={6} className="resize-none" placeholder="Enter detailed feedback..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitFeedback} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AssessmentAndInterview;


