import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { InterviewCard, type ScheduledInterview } from '@/components/hiring/InterviewCard';
import { ExpandableInterviewWorkspace } from '@/components/hiring/ExpandableInterviewWorkspace';
import { applicationService } from '@/services/jobPortalservice';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Calendar, TrendingUp, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// Transform API response to ScheduledInterview format
const transformApiRound = (apiRound: any): ScheduledInterview | null => {
  try {
    const round = apiRound.round || apiRound;
    const application = apiRound.application || (round && round.application && typeof round.application === 'object' ? round.application : null);
    const job = apiRound.job || (round && round.job && typeof round.job === 'object' ? round.job : null);

    // Extract interviewer names
    const interviewerNames = (round.interviewers || []).map((iv: any) => iv.user_name).filter(Boolean);

    // Determine interview type based on round_type
    let interviewType: 'technical' | 'behavioral' | 'panel' = 'technical';
    if (round.round_type?.toLowerCase().includes('hr') || round.round_type?.toLowerCase().includes('behavioral')) {
      interviewType = 'behavioral';
    } else if (round.round_type?.toLowerCase().includes('panel')) {
      interviewType = 'panel';
    }

    // Determine stage based on seq_number
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

    // Map round_state to status
    let status: 'pending' | 'in-progress' | 'completed' = 'pending';
    if (round.round_state === 'in_progress') {
      status = 'in-progress';
    } else if (round.round_state === 'completed') {
      status = 'completed';
    }

    // Parse date and time
    let interviewDate = new Date();
    let interviewTime = 'TBD';
    if (round.date) {
      interviewDate = new Date(round.date);
      if (round.time) {
        const timeParts = round.time.split(':');
        interviewTime = `${timeParts[0]}:${timeParts[1]}`;
      }
    }

    // Build candidate name from application object when available
    const candidateName = application && (application.candidate_fname || application.candidate_lname)
      ? `${application.candidate_fname || ''} ${application.candidate_lname || ''}`.trim()
      : (round.candidate_name || `Candidate ${application ? application.id : (round.application || '')}`);

    // Position from job object when available
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
      // Attach full application and job objects for downstream UI
      candidateData: application || null,
      jobData: job || null,
    };
  } catch (error) {
    console.error('Error transforming API round:', error, apiRound);
    return null;
  }
};

const HiringInterview: React.FC = () => {
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<ScheduledInterview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch scheduled rounds from API on mount
  useEffect(() => {
    const fetchScheduledRounds = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await applicationService.getScheduledRounds();
        if (response.success && response.data) {
          const rounds = response.data.rounds || response.data.results || response.data || [];
          const transformed = rounds
            .map(transformApiRound)
            .filter((r: ScheduledInterview | null): r is ScheduledInterview => r !== null);
          setInterviews(transformed);
        } else {
          setError(response.message || 'Failed to fetch scheduled interviews');
          setInterviews([]);
        }
      } catch (err: any) {
        console.error('Error fetching scheduled rounds:', err);
        setError(err?.message || 'Failed to fetch scheduled interviews');
        setInterviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduledRounds();
  }, []);

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

  // Stats
  const totalInterviews = interviews.length;
  const pendingInterviews = interviews.filter(i => i.status === 'pending').length;
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
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    Conduct & Score Interviews
                  </h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                    Review scheduled interviews and score candidates
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
                      <p className="text-indigo-100 text-xs sm:text-sm font-medium">Scheduled</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{pendingInterviews}</p>
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
                  placeholder="Search by candidate name or position..."
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
                    <SelectItem value="pending">Scheduled</SelectItem>
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
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading interviews...</h3>
                <p className="text-gray-500">Please wait while we fetch your scheduled interviews</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to load interviews</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No interviews found</h3>
                <p className="text-gray-500">
                  {interviews.length === 0
                    ? 'No scheduled interviews at the moment'
                    : 'Try adjusting your search or filters'}
                </p>
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

export default HiringInterview;

