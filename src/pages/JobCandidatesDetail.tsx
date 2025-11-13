import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  // Sample job data
  const [jobData, setJobData] = useState({
    id: jobId,
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    openings: 3,
    applicants: 24,
    shortlisted: 8,
  });

  // Sample candidates data
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 234 567 8901",
      location: "New York, NY",
      experience: "5 years",
      similarityScore: 94,
      interviewer: "",
      interviewDate: undefined,
      interviewTime: "",
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "+1 234 567 8902",
      location: "San Francisco, CA",
      experience: "6 years",
      similarityScore: 91,
      interviewer: "David Miller",
      interviewDate: new Date(2025, 10, 15),
      interviewTime: "10:00 AM",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "+1 234 567 8903",
      location: "Austin, TX",
      experience: "4 years",
      similarityScore: 88,
      interviewer: "Rachel Green",
      interviewDate: new Date(2025, 10, 16),
      interviewTime: "2:00 PM",
    },
    {
      id: "4",
      name: "James Wilson",
      email: "j.wilson@email.com",
      phone: "+1 234 567 8904",
      location: "Seattle, WA",
      experience: "7 years",
      similarityScore: 87,
      interviewer: "",
      interviewDate: undefined,
      interviewTime: "",
    },
    {
      id: "5",
      name: "Lisa Anderson",
      email: "l.anderson@email.com",
      phone: "+1 234 567 8905",
      location: "Boston, MA",
      experience: "5 years",
      similarityScore: 85,
      interviewer: "John Smith",
      interviewDate: new Date(2025, 10, 17),
      interviewTime: "11:00 AM",
    },
    {
      id: "6",
      name: "Robert King",
      email: "r.king@email.com",
      phone: "+1 234 567 8906",
      location: "Chicago, IL",
      experience: "6 years",
      similarityScore: 83,
      interviewer: "",
      interviewDate: undefined,
      interviewTime: "",
    },
    {
      id: "7",
      name: "Priya Sharma",
      email: "priya.s@email.com",
      phone: "+1 234 567 8907",
      location: "Los Angeles, CA",
      experience: "4 years",
      similarityScore: 81,
      interviewer: "Maria Garcia",
      interviewDate: new Date(2025, 10, 18),
      interviewTime: "3:00 PM",
    },
    {
      id: "8",
      name: "David Park",
      email: "david.p@email.com",
      phone: "+1 234 567 8908",
      location: "Denver, CO",
      experience: "5 years",
      similarityScore: 79,
      interviewer: "",
      interviewDate: undefined,
      interviewTime: "",
    },
    
  ]);

  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);
  const [tempInterviewer, setTempInterviewer] = useState("");
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempTime, setTempTime] = useState("");

  // Shortlist selector: show top N candidates by similarity score
  const [shortlistCount, setShortlistCount] = useState<number>(candidates.length);
  const maxCandidates = candidates.length;
  // sorted candidates by similarity score (desc)
  const sortedByScore = [...candidates].sort((a, b) => b.similarityScore - a.similarityScore);
  const displayedCandidates = shortlistCount >= maxCandidates ? sortedByScore : sortedByScore.slice(0, shortlistCount);

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
                    {displayedCandidates.map((candidate) => (
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
                            <Input
                              value={tempInterviewer}
                              onChange={(e) => setTempInterviewer(e.target.value)}
                              placeholder="Enter interviewer name"
                              className="h-9 w-40"
                            />
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
