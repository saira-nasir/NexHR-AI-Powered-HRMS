import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Users, Trash, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoundDetailsModal from '@/components/onboarding/RoundDetailsModal';
import RejectCandidateModal from '@/components/onboarding/RejectCandidateModal';
import { applicationService } from '@/services/jobPortalservice';

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
  overallRoundScore?: number;
  interviewers: InterviewerScore[];
  isRoundComplete: boolean;
}

export interface Candidate {
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  applicationId?: number;
  rounds: Round[];
  readyForOnboarding: boolean;
}

export interface Job {
  jobId: number;
  jobTitle: string;
  department: string;
  candidatesCount: number;
  candidates: Candidate[];
}

const Onboarding: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [closingJobId, setClosingJobId] = useState<number | null>(null);
  const [showCloseJobDialog, setShowCloseJobDialog] = useState(false);
  const [jobToClose, setJobToClose] = useState<Job | null>(null);

  // Lottie animation (same pattern as EmployeeCard)
  const lottieContainer = useRef<HTMLDivElement | null>(null);
  const lottieAnimRef = useRef<any | null>(null);

  const navigate = useNavigate();

  // Fetch interview feedback data on component mount
  useEffect(() => {
    const fetchInterviewFeedback = async () => {
      setIsLoading(true);
      try {
        const response = await applicationService.getInterviewFeedback();
        if (response.success && response.data) {
          // Map API response to Job[] structure
          const mappedJobs: Job[] = response.data.jobs.map((apiJob: any) => ({
            jobId: apiJob.job_id,
            jobTitle: apiJob.job_title,
            department: apiJob.department,
            candidatesCount: apiJob.number_of_applications,
            candidates: apiJob.applications.map((app: any) => ({
              candidateId: app.application_id || 0,
              applicationId: app.application_id || 0,
              candidateName: app.name,
              candidateEmail: app.email,
              candidatePhone: app.phone_number,
              readyForOnboarding: app.ready_for_onboarding || false,
              rounds: app.rounds.map((round: any) => ({
                roundId: round.round_id || 0,
                roundName: round.round_name,
                roundScore: round.overall_round_score,
                overallRoundScore: round.overall_round_score,
                isRoundComplete: round.is_round_complete || false,
                interviewers: round.interviewer_details.map((interviewer: any) => ({
                  interviewerId: interviewer.interviewer_id || 0,
                  interviewerName: interviewer.name,
                  score: interviewer.score,
                  justification: interviewer.summary?.justification || ''
                }))
              }))
            }))
          }));
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error('Failed to fetch interview feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviewFeedback();
  }, []);

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
    const applicationId = candidate.applicationId ?? candidate.candidateId;
    navigate(`/onboard/${applicationId}`, { state: { candidate } });
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

  const handleOnboardConfirm = async (salaryData: any) => {
    if (!selectedCandidate) return;
    // Map local SalaryData to API payload
    const payload = {
      base_salary: Number(salaryData.baseSalary),
      allowances: salaryData.allowances ? Number(salaryData.allowances) : 0,
      effective_from: salaryData.startDate,
      hiring_justification: salaryData.justification,
    };

    // Call service to onboard application - candidate.candidateId holds application id
    try {
  const applicationId = selectedCandidate.applicationId ?? selectedCandidate.candidateId;
      const resp = await applicationService.onboardApplication(applicationId, payload);
      if (resp.success) {
        // Remove the candidate from the job list (simple UI update)
        setJobs(prevJobs => prevJobs.map(job => ({
          ...job,
          candidates: job.candidates.filter(c => c.candidateId !== selectedCandidate.candidateId),
          candidatesCount: job.candidates.filter(c => c.candidateId !== selectedCandidate.candidateId).length
        })));

        // Clear selection after onboarding
        setSelectedCandidate(null);
      } else {
        // show error in console for now — could use toast
        console.error('Onboard failed:', resp.message);
      }
    } catch (err) {
      console.error('Onboard error:', err);
    }
  };

  const handleCloseJobClick = (job: Job) => {
    setJobToClose(job);
    setShowCloseJobDialog(true);
  };

  const handleCloseJobConfirm = async () => {
    if (!jobToClose) return;
    
    setClosingJobId(jobToClose.jobId);
    setShowCloseJobDialog(false);
    
    try {
      const token = localStorage.getItem('access_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      
      const response = await fetch(`${API_BASE}/jobs/${jobToClose.jobId}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'closed' })
      });

      if (!response.ok) {
        throw new Error(`Failed to close job: ${response.status}`);
      }

      // Successfully closed - remove job from list
      setJobs(prev => prev.filter(j => j.jobId !== jobToClose.jobId));
    } catch (error) {
      console.error('Error closing job:', error);
      // Optionally show error toast here
    } finally {
      setClosingJobId(null);
      setJobToClose(null);
    }
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

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No candidates available for onboarding</p>
              </div>
            ) : (
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
                          onClick={() => handleCloseJobClick(job)}
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
                                    {candidate.readyForOnboarding ? (
                                      <>
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
                                      </>
                                    ) : (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 px-3 py-1">
                                        Awaiting Round Completion
                                      </Badge>
                                    )}
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
              </div>
            )}
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
        </>
      )}

      {/* Close Job Confirmation Dialog */}
      <AlertDialog open={showCloseJobDialog} onOpenChange={setShowCloseJobDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Close Job Position
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base font-medium text-gray-900">
                Are you sure you want to close this job?
              </p>
              {jobToClose && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="font-semibold text-blue-900">{jobToClose.jobTitle}</p>
                  <p className="text-sm text-blue-700">{jobToClose.department}</p>
                </div>
              )}
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This job will be permanently closed and removed from the job portal. 
                  All pending applications will no longer be accessible.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobToClose(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseJobConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Close Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Onboarding;
