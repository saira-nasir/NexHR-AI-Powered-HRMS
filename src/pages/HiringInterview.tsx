import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { InterviewCard, type ScheduledInterview } from '@/components/hiring/InterviewCard';
import { ExpandableInterviewWorkspace } from '@/components/hiring/ExpandableInterviewWorkspace';
import { applicationService } from '@/services/jobPortalservice';
import { Button } from '@/components/ui/button';
import { Users, Calendar, TrendingUp, CheckCircle2, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

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
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<ScheduledInterview | null>(null);

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

  // No filtering: show all fetched interviews
  const filteredInterviews = interviews;

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

              {/* Banner stats removed */}
            </div>
          </div>
        </div>

        {/* Filters removed */}

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
            ) : interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No interviews found</h3>
                <p className="text-gray-500">
                  No scheduled interviews at the moment
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {interviews.map((interview) => (
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

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 ml-64">
        <div className="max-w-7xl mx-auto flex justify-end px-4 sm:px-8">
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-8"
            onClick={() => navigate('/onboarding')}
          >
            Next Stage: Onboarding Candidate
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Spacer for bottom bar */}
      <div className="h-24" />
    </DashboardLayout>
  );
};

export default HiringInterview;

