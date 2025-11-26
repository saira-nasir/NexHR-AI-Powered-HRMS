import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationService } from "@/services/jobPortalservice";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScheduleInterviewModal from "@/components/modals/ScheduleInterviewModal";
import CandidateScheduleDrawer from "@/components/modals/CandidateScheduleDrawer";
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
  Clock,
  RefreshCw,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  finalScore: number;
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
  
  // Drawer and modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingRound, setSchedulingRound] = useState<any | null>(null);

  // Store scheduled rounds per candidate id so drawer can display them
  const [scheduledRoundsByCandidate, setScheduledRoundsByCandidate] = useState<Record<string, any[]>>({});
  const [scheduledRoundsLoading, setScheduledRoundsLoading] = useState<boolean>(false);

  // Shortlist selector: show top N candidates by similarity score
  const [shortlistCount, setShortlistCount] = useState<number>(0);
  const maxCandidates = candidates.length;
  // sorted candidates by final score (desc)
  const sortedByScore = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  const displayedCandidates = shortlistCount >= maxCandidates ? sortedByScore : sortedByScore.slice(0, shortlistCount);



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
              status: c.status || "pending",
              finalScore: Math.round((c.final_score || 0) * 100),
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

  // Open drawer when Schedule button is clicked
  const openDrawer = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
    // fetch scheduled rounds for this candidate from API
    (async () => {
      setScheduledRoundsLoading(true);
      try {
        const appId = candidate.id; // assuming candidate.id is application id
        const resp = await applicationService.getInterviewRounds(appId as any);
        if (resp.success && resp.data) {
          // resp.data may be array of rounds or objects wrapping under 'rounds' or 'results'
          const rawData: any = resp.data;
          const rounds = Array.isArray(rawData) ? rawData : (rawData.rounds || rawData.results || [rawData]);
          // normalize rounds for UI and omit meeting_link from display; keep full interviewers array
          const normalized = rounds.map((r: any) => ({
            id: r.id || r.pk,
            application: r.application,
            seq_number: r.seq_number,
            name: r.round_name,
            round_name: r.round_name,
            round_type: r.round_type,
            round_mode: r.round_mode,
            description: r.description || '',
            type: r.round_type,
            status: r.round_state || 'scheduled',
            scheduledDate: r.date ? new Date(r.date) : undefined,
            scheduledTime: r.time || undefined,
            interviewers: Array.isArray(r.interviewers) ? r.interviewers : [],
            // keep meeting_link in data but we won't display it
            meeting_link: r.meeting_link || null,
            raw: r,
          }));

          setScheduledRoundsByCandidate(prev => ({ ...prev, [candidate.id]: normalized }));
        } else {
          setScheduledRoundsByCandidate(prev => ({ ...prev, [candidate.id]: [] }));
        }
      } catch (err) {
        console.error('Failed to fetch scheduled rounds for candidate:', err);
        setScheduledRoundsByCandidate(prev => ({ ...prev, [candidate.id]: [] }));
      } finally {
        setScheduledRoundsLoading(false);
      }
    })();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCandidate(null);
  };

  // Open modal when Schedule Round is clicked from drawer
  const handleScheduleRound = (round: any) => {
    // Keep drawer open and open modal
    setSchedulingCandidate(selectedCandidate);
    setSchedulingRound(round || null);
    setIsScheduleModalOpen(true);
  };

  // Create a new round (opened from drawer New Round button)
  const handleCreateRound = () => {
    setSchedulingCandidate(selectedCandidate);
    setSchedulingRound(null);
    setIsScheduleModalOpen(true);
  };

  // Edit an existing round (opened from drawer Edit icon)
  const handleEditRound = (round: any) => {
    setSchedulingCandidate(selectedCandidate);
    setSchedulingRound(round || null);
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSchedulingCandidate(null);
  };

  const handleScheduleSave = async (candidateId: string, interviewers: number[], date: Date | undefined, time: string, roundMeta?: { id?: number | string; name?: string; type?: string }) => {
    // Call backend API to create/update interview round
    try {
      // Determine seq_number: if editing, reuse existing seq_number if present; otherwise next index
      const prevList = scheduledRoundsByCandidate[candidateId] || [];
      let seq_number = prevList.length + 1;
      if (roundMeta && roundMeta.id) {
        const existing = prevList.find(r => String(r.id) === String(roundMeta.id));
        // @ts-ignore
        if (existing && (existing.seq_number || existing.seq_number === 0)) seq_number = existing.seq_number;
      }

      const payload: any = {
        application: Number(candidateId) || candidateId,
        seq_number,
        round_name: roundMeta?.name || schedulingRound?.name || `Round ${seq_number}`,
        round_type: (roundMeta?.type || schedulingRound?.type || 'technical').toString().toLowerCase(),
        round_mode: (roundMeta && (roundMeta as any).mode) || 'online',
        date: date ? (date instanceof Date ? date.toISOString().slice(0, 10) : String(date)) : undefined,
        time: time ? (time.length === 5 ? `${time}:00` : time) : undefined,
        meeting_link: (roundMeta && (roundMeta as any).meeting_link) || null,
        interviewers: interviewers || [],
      };

      console.debug('Creating interview round payload:', payload);

      let resp: any = null;
      if ((schedulingRound && schedulingRound.id) || (roundMeta && roundMeta.id)) {
        const roundId = (roundMeta && (roundMeta as any).id) || schedulingRound.id;
        // PATCH existing round
        const patchPayload: any = {};
        if (roundMeta?.name) patchPayload.round_name = roundMeta.name;
        if (roundMeta?.type) patchPayload.round_type = roundMeta.type.toLowerCase();
        if (roundMeta && (roundMeta as any).mode) patchPayload.round_mode = (roundMeta as any).mode;
        if (roundMeta && (roundMeta as any).meeting_link !== undefined) patchPayload.meeting_link = (roundMeta as any).meeting_link;
        if (date) patchPayload.date = date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
        if (time) patchPayload.time = time.length === 5 ? `${time}:00` : time;
        // Include interviewers in PATCH (API will add/remove based on the list)
        if (interviewers && interviewers.length > 0) patchPayload.interviewers = interviewers;
        
        console.debug('PATCH interview round payload:', patchPayload);
        resp = await applicationService.patchInterviewRound(roundId, patchPayload);
        if (resp.success && resp.data) {
          const updated = resp.data;
          const updatedRound: any = {
            id: updated.id || updated.pk || roundId,
            name: updated.round_name || roundMeta?.name || schedulingRound?.name,
            round_name: updated.round_name || roundMeta?.name || schedulingRound?.name,
            description: updated.description || schedulingRound?.description || '',
            type: updated.round_type || schedulingRound?.type || roundMeta?.type,
            round_type: updated.round_type || schedulingRound?.type || roundMeta?.type,
            round_mode: updated.round_mode || (roundMeta as any)?.mode || schedulingRound?.round_mode || 'online',
            seq_number: updated.seq_number || seq_number,
            status: updated.round_state || 'scheduled',
            scheduledDate: updated.date ? new Date(updated.date) : (date || undefined),
            scheduledTime: updated.time || (time || undefined),
            // Store full interviewers array for display in drawer
            interviewers: updated.interviewers || [],
            meeting_link: updated.meeting_link || (roundMeta as any)?.meeting_link || null,
          };

          setScheduledRoundsByCandidate(prev => {
            const prevList = prev[candidateId] || [];
            const existsIndex = prevList.findIndex(r => String(r.id) === String(updatedRound.id));
            if (existsIndex >= 0) {
              const copy = [...prevList];
              copy[existsIndex] = { ...copy[existsIndex], ...updatedRound };
              return { ...prev, [candidateId]: copy };
            }
            return { ...prev, [candidateId]: [...prevList, updatedRound] };
          });
        } else {
          console.error('Failed to patch interview round:', resp.message);
        }
      } else {
        resp = await applicationService.createInterviewRound(payload);
        if (resp.success && resp.data) {
          const created = resp.data;
          const createdRound: any = {
            id: created.id || created.pk || Date.now(),
            name: created.round_name || payload.round_name,
            round_name: created.round_name || payload.round_name,
            description: created.description || schedulingRound?.description || '',
            type: created.round_type || payload.round_type,
            round_type: created.round_type || payload.round_type,
            round_mode: created.round_mode || payload.round_mode || 'online',
            seq_number: created.seq_number || seq_number,
            status: 'scheduled',
            scheduledDate: created.date ? new Date(created.date) : (date || undefined),
            scheduledTime: created.time || (time || undefined),
            // Store full interviewers array for display in drawer
            interviewers: created.interviewers || [],
            meeting_link: created.meeting_link || payload.meeting_link || null,
          };

          setScheduledRoundsByCandidate(prev => {
            const prevList = prev[candidateId] || [];
            return { ...prev, [candidateId]: [...prevList, createdRound] };
          });
        } else {
          console.error('Failed to create interview round:', resp.message);
        }
      }
    } catch (err) {
      console.error('Error while creating interview round:', err);
    }

    // Optionally update local state if needed
    // setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, interviewer: '...', interviewDate: date, interviewTime: time } : c));
  };

  const handleDeleteRound = (roundId: number) => {
    // Remove the deleted round from the local state
    if (selectedCandidate) {
      setScheduledRoundsByCandidate(prev => {
        const prevList = prev[selectedCandidate.id] || [];
        const updatedList = prevList.filter(r => r.id !== roundId);
        return { ...prev, [selectedCandidate.id]: updatedList };
      });
    }
  };

  const getFinalScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Pending" },
      shortlisted: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Shortlisted" },
      interviewed: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Interviewed" },
      selected: { color: "bg-green-100 text-green-700 border-green-200", label: "Selected" },
      rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
    };
    const { color, label } = statusMap[status.toLowerCase()] || statusMap.pending;
    return <Badge variant="outline" className={`${color} font-medium`}>{label}</Badge>;
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
              onClick={() => navigate("/assessment-interview")}
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
              onClick={() => navigate("/assessment-interview")}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>

            {/* Banner removed per request - only showing the candidates table below */}
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
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Final Score</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
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
                          {getStatusBadge(candidate.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getFinalScoreColor(candidate.finalScore)} font-bold px-3 py-1`}
                            >
                              {candidate.finalScore}%
                            </Badge>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDrawer(candidate)}
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

          {/* Candidate Schedule Drawer */}
          <CandidateScheduleDrawer
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
            candidate={selectedCandidate}
            onScheduleRound={handleScheduleRound}
            scheduledRounds={selectedCandidate ? scheduledRoundsByCandidate[selectedCandidate.id] || [] : []}
            onCreateRound={handleCreateRound}
            onEditRound={handleEditRound}
            onDeleteRound={handleDeleteRound}
            scheduledLoading={scheduledRoundsLoading}
          />

          {/* Schedule Interview Modal */}
          <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={closeScheduleModal}
            candidate={schedulingCandidate}
            onSave={handleScheduleSave}
            round={schedulingRound}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobCandidatesDetail;
