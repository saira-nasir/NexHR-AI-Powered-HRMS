import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Users, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoundDetailsModal from '@/components/onboarding/RoundDetailsModal';
import RejectCandidateModal from '@/components/onboarding/RejectCandidateModal';
import OnboardCandidateModal from '@/components/onboarding/OnboardCandidateModal';

// Types
export interface InterviewerScore {
  interviewerId: number;
  interviewerName: string;
  score: number;
  justification: string;
}

export interface Round {
  roundId: number;
  roundName: string;
  roundScore: number;
  interviewers: InterviewerScore[];
}

export interface Candidate {
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  rounds: Round[];
}

export interface Job {
  jobId: number;
  jobTitle: string;
  department: string;
  candidatesCount: number;
  candidates: Candidate[];
}

// Mock data
const MOCK_JOBS: Job[] = [
  {
    jobId: 1,
    jobTitle: 'Senior Frontend Engineer',
    department: 'Engineering',
    candidatesCount: 2,
    candidates: [
      {
        candidateId: 101,
        candidateName: 'Aisha Khan',
        candidateEmail: 'aisha.khan@example.com',
        candidatePhone: '+92 300 111 2222',
        rounds: [
          {
            roundId: 1,
            roundName: 'Technical Round 1',
            roundScore: 85,
            interviewers: [
              { interviewerId: 1, interviewerName: 'John Doe', score: 90, justification: 'Strong React skills and problem-solving ability.' },
              { interviewerId: 2, interviewerName: 'Jane Smith', score: 80, justification: 'Good understanding of TypeScript and state management.' }
            ]
          },
          {
            roundId: 2,
            roundName: 'Technical Round 2',
            roundScore: 88,
            interviewers: [
              { interviewerId: 3, interviewerName: 'Mike Johnson', score: 88, justification: 'Excellent system design thinking and architecture knowledge.' }
            ]
          }
        ]
      },
      {
        candidateId: 102,
        candidateName: 'Omar Farooq',
        candidateEmail: 'omar.farooq@example.com',
        candidatePhone: '+92 300 333 4444',
        rounds: [
          {
            roundId: 1,
            roundName: 'Technical Round 1',
            roundScore: 75,
            interviewers: [
              { interviewerId: 1, interviewerName: 'John Doe', score: 75, justification: 'Decent React knowledge but needs improvement in testing.' }
            ]
          }
        ]
      }
    ]
  },
  {
    jobId: 2,
    jobTitle: 'Backend Engineer',
    department: 'Engineering',
    candidatesCount: 1,
    candidates: [
      {
        candidateId: 201,
        candidateName: 'Sara Ahmed',
        candidateEmail: 'sara.ahmed@example.com',
        candidatePhone: '+92 300 555 6666',
        rounds: [
          {
            roundId: 1,
            roundName: 'Technical Assessment',
            roundScore: 92,
            interviewers: [
              { interviewerId: 4, interviewerName: 'Alice Brown', score: 95, justification: 'Outstanding Python and Django expertise. Strong database design.' },
              { interviewerId: 5, interviewerName: 'Bob Wilson', score: 89, justification: 'Great API design skills and clean code practices.' }
            ]
          }
        ]
      }
    ]
  }
];

const Onboarding: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [closingJobId, setClosingJobId] = useState<number | null>(null);

  // Lottie animation (same pattern as EmployeeCard)
  const lottieContainer = useRef<HTMLDivElement | null>(null);
  const lottieAnimRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadLottie = async () => {
      try {
        const lottieModule = await import('lottie-web');
        const lottie = (lottieModule as any).default || lottieModule;
        if (lottieContainer.current && mounted) {
          const anim = lottie.loadAnimation({
            container: lottieContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/lottieFiles/selection.json',
          });
          lottieAnimRef.current = anim;
        }
      } catch (err) {
        console.error('Failed to load selection lottie:', err);
      }
    };

    loadLottie();

    return () => {
      mounted = false;
      if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    };
  }, []);

  const toggleJobExpansion = (jobId: number) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handleRoundDetailsClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowRoundDetails(true);
  };

  const handleRejectClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowRejectModal(true);
  };

  const handleOnboardClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowOnboardModal(true);
  };

  const handleRejectConfirm = (justification: string) => {
    if (!selectedCandidate) return;
    
    // Remove candidate from the job's candidate list
    setJobs(prevJobs => 
      prevJobs.map(job => ({
        ...job,
        candidates: job.candidates.filter(c => c.candidateId !== selectedCandidate.candidateId),
        candidatesCount: job.candidates.filter(c => c.candidateId !== selectedCandidate.candidateId).length
      }))
    );
    
    setShowRejectModal(false);
    setSelectedCandidate(null);
  };

  const handleOnboardConfirm = (salaryData: any) => {
    // Process onboarding (UI flow only - no backend logic required)
    console.log('Onboarding candidate:', selectedCandidate, 'with salary data:', salaryData);
    setShowOnboardModal(false);
    setSelectedCandidate(null);
  };

  const handleCloseJob = (jobId: number) => {
    // show loader on the button, simulate API call and remove job
    setClosingJobId(jobId);
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.jobId !== jobId));
      setClosingJobId(null);
    }, 900);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Lottie Animation Hero — text aligned with animation (responsive) */}
        <div className="w-full bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700" style={{ height: '25vh' }}>
          <div className="max-w-7xl mx-auto w-full h-full px-4 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
            {/* Text block — left on md+, centered on small screens. Added subtle dark panel behind text for contrast. */}
            <div className="md:w-1/2 w-full text-center md:text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">Candidate Onboarding</h1>
                <p className="mt-2 text-sm md:text-base lg:text-lg text-indigo-100/90">Review and manage selected candidates for each job position</p>
            </div>

            {/* Lottie container — right on md+, centered on small screens */}
            <div
              ref={lottieContainer}
              className="md:w-1/2 w-full h-full flex items-center justify-center"
              style={{ maxWidth: '500px' }}
            />
          </div>
        </div>

        {/* Job Cards Section */}
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6" />

            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.jobId} className="border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900">{job.jobTitle}</CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {job.department}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{job.candidatesCount} candidate{job.candidatesCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCloseJob(job.jobId)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                          disabled={closingJobId === job.jobId}
                        >
                          {closingJobId === job.jobId ? (
                            <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                          <span className="text-sm">Close Job</span>
                        </button>

                        <Button
                          variant="outline"
                          onClick={() => toggleJobExpansion(job.jobId)}
                          className="flex items-center gap-2"
                        >
                          {expandedJobId === job.jobId ? (
                            <>
                              Hide Candidates
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              View Candidates
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expandable Candidate List */}
                  <AnimatePresence>
                    {expandedJobId === job.jobId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-6">
                          {job.candidates.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                              <p>No candidates available</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {job.candidates.map((candidate) => (
                                <div
                                  key={candidate.candidateId}
                                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {candidate.candidateName}
                                    </h3>
                                    <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                                    {candidate.candidatePhone && (
                                      <p className="text-sm text-gray-500">{candidate.candidatePhone}</p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRoundDetailsClick(candidate)}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                      Round Details
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRejectClick(candidate)}
                                      className="border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleOnboardClick(candidate)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Onboard
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}

              {jobs.length === 0 && (
                <div className="text-center py-20">
                  <Users className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs available</h3>
                  <p className="text-gray-500">There are no job positions with selected candidates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedCandidate && (
        <>
          <RoundDetailsModal
            isOpen={showRoundDetails}
            onClose={() => setShowRoundDetails(false)}
            candidate={selectedCandidate}
          />
          <RejectCandidateModal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            candidate={selectedCandidate}
            onConfirm={handleRejectConfirm}
          />
          <OnboardCandidateModal
            isOpen={showOnboardModal}
            onClose={() => setShowOnboardModal(false)}
            candidate={selectedCandidate}
            onConfirm={handleOnboardConfirm}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default Onboarding;
