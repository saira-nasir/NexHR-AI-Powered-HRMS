import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { InterviewCard, type ScheduledInterview } from '@/components/hiring/InterviewCard';
import { ExpandableInterviewWorkspace } from '@/components/hiring/ExpandableInterviewWorkspace';
import { interviewService } from '@/services/interviewService';

// Transform API round object to ScheduledInterview used by cards
const transformApiRound = (apiRound: any): ScheduledInterview | null => {
  try {
    const round = apiRound.round || apiRound;
    const application = apiRound.application || (round && round.application && typeof round.application === 'object' ? round.application : null);
    const job = apiRound.job || (round && round.job && typeof round.job === 'object' ? round.job : null);

    const interviewerNames = (round.interviewers || []).map((iv: any) => iv.user_name).filter(Boolean);

    let interviewType: 'technical' | 'behavioral' | 'panel' = 'technical';
    if (round.round_type?.toLowerCase().includes('hr') || round.round_type?.toLowerCase().includes('behavioral')) {
      interviewType = 'behavioral';
    } else if (round.round_type?.toLowerCase().includes('panel')) {
      interviewType = 'panel';
    }

    let stage: 'phone' | 'first' | 'second' | 'final' = 'first';
    if (round.seq_number === 0 || round.round_name?.toLowerCase().includes('phone')) {
      stage = 'phone';
    } else if (round.seq_number === 1) {
      stage = 'first';
    } else if (round.seq_number === 2) {
      stage = 'second';
    } else if (round.seq_number >= 3 || round.round_name?.toLowerCase().includes('final')) {
      stage = 'final';
    }

    let status: 'pending' | 'in-progress' | 'completed' = 'pending';
    if (round.round_state === 'in_progress') status = 'in-progress';
    else if (round.round_state === 'completed') status = 'completed';

    let interviewDate = new Date();
    let interviewTime = 'TBD';
    if (round.date) {
      interviewDate = new Date(round.date);
      if (round.time) {
        const timeParts = round.time.split(':');
        interviewTime = `${timeParts[0]}:${timeParts[1]}`;
      }
    }

    const candidateName = application && (application.candidate_fname || application.candidate_lname)
      ? `${application.candidate_fname || ''} ${application.candidate_lname || ''}`.trim()
      : (round.candidate_name || `Candidate ${application ? application.id : (round.application || '')}`);

    const position = (job && (job.job_title || job.title)) || round.job_title || 'Position TBD';

    return {
      id: String(round.id),
      roundId: round.id,
      applicationId: application ? application.id : round.application,
      seqNumber: round.seq_number,
      candidateName,
      position,
      interviewDate,
      interviewTime,
      interviewers: interviewerNames,
      interviewStage: stage,
      interviewType,
      status,
      candidateEmail: (application && application.email) || round.candidate_email,
      candidatePhone: (application && application.phone) || round.candidate_phone,
      roundName: round.round_name,
      roundType: round.round_type,
      roundMode: round.round_mode,
      meetingLink: round.meeting_link,
      roundState: round.round_state,
      roundResult: round.round_result,
      interviewersDetails: round.interviewers || [],
      candidateData: application || null,
      jobData: job || null,
    };
  } catch (error) {
    console.error('Error transforming API round:', error, apiRound);
    return null;
  }
};
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';

const Interview: React.FC = () => {
  // Filter to show only interviews for the current user
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<ScheduledInterview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCardClick = (interview: ScheduledInterview) => {
    setSelectedInterview(interview);
  };

  const handleClose = () => {
    setSelectedInterview(null);
  };

  // Filter interviews
  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fetch scheduled rounds for the current user (employee view)
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await interviewService.fetchScheduledRounds();
        if (resp.success) {
          const rounds = resp.data?.rounds || resp.data?.results || resp.data || [];
          const transformed = rounds.map(transformApiRound).filter((r: ScheduledInterview | null): r is ScheduledInterview => r !== null);
          setInterviews(transformed);
        } else {
          setError(resp.error || 'Failed to fetch scheduled interviews');
        }
      } catch (err: any) {
        console.error('Error fetching scheduled rounds for employee view:', err);
        setError(err?.message || 'Failed to fetch scheduled interviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, []);

  // Stats
  const totalInterviews = interviews.length;
  const upcomingInterviews = interviews.filter(i => i.status === 'pending').length;
  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  const inProgressInterviews = interviews.filter(i => i.status === 'in-progress').length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          <div className="absolute inset-0 bg-black/10 z-0" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    My Scheduled Interviews
                  </h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                    View your upcoming and past interviews
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs sm:text-sm font-medium">Total Interviews</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalInterviews}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-indigo-200" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs sm:text-sm font-medium">Upcoming</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{upcomingInterviews}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-indigo-200" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs sm:text-sm font-medium">In Progress</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{inProgressInterviews}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-200" />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs sm:text-sm font-medium">Completed</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{completedInterviews}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-indigo-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredInterviews.length > 0 && (
              <div className="mt-3">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} found
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Interview Cards Grid */}
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Calendar className="h-16 w-16 text-gray-300 mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading interviews...</h3>
                <p className="text-gray-500">Please wait while we fetch your scheduled interviews</p>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No interviews scheduled</h3>
                <p className="text-gray-500">Your upcoming interviews will appear here</p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onClick={() => handleCardClick(interview)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Workspace */}
      <ExpandableInterviewWorkspace
        interview={selectedInterview}
        isOpen={!!selectedInterview}
        onClose={handleClose}
      />
    </DashboardLayout>
  );
};

export default Interview;

