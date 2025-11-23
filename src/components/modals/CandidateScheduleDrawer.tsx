import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Briefcase, Calendar, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

interface InterviewRound {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'scheduled' | 'completed';
  scheduledDate?: Date;
  scheduledTime?: string;
  interviewer?: string;
  // optional fuller fields returned by backend
  interviewers?: any[];
  meeting_link?: string | null;
  round_name?: string;
  round_type?: string;
  round_mode?: string;
  // backend wrapper/raw objects (may be present depending on API response shape)
  raw?: any;
  job?: any;
  application?: any;
}

interface CandidateScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onScheduleRound: (round: InterviewRound) => void;
  // scheduled rounds for the current candidate (optional)
  scheduledRounds?: InterviewRound[];
  // available round templates coming from backend (optional). If provided, use these to render round cards.
  availableRounds?: InterviewRound[];
  // Whether the parent is currently loading scheduled rounds for the candidate
  scheduledLoading?: boolean;
  // Create a new round button handler (opens modal in create mode)
  onCreateRound?: () => void;
  // Edit an existing round (open modal prefilled for editing)
  onEditRound?: (round: InterviewRound) => void;
}

const CandidateScheduleDrawer: React.FC<CandidateScheduleDrawerProps> = ({
  isOpen,
  onClose,
  candidate,
  onScheduleRound,
  scheduledRounds = [],
  availableRounds,
  onCreateRound,
  onEditRound,
  scheduledLoading = false,
}) => {
  // Show loading when parent is fetching scheduled rounds (received via prop)
  // No hardcoded rounds here; expect `availableRounds` from parent (backend). If not provided, render only scheduled rounds section.

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (!candidate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed and blurred overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Drawer content sliding from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 top-0 md:top-12 z-[70] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-t-3xl md:rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Close button */}
            <div className="absolute top-6 right-6 z-50">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto pt-8 px-6 md:px-8 pb-6">
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                    <p className="text-gray-600">Review candidate details and schedule interview rounds</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button onClick={() => onCreateRound && onCreateRound()} className="bg-indigo-600 text-white hover:bg-indigo-700">+ New Round</Button>
                  </div>
                </div>

                {/* Candidate Details Card */}
                <Card className="border-0 shadow-xl bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Avatar */}
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full h-20 w-20 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {candidate.name.split(' ').map((n) => n[0]).join('')}
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
                            <Badge className={`${getSimilarityColor(candidate.similarityScore)} font-bold px-3 py-1`}>
                              {candidate.similarityScore}% Match
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="h-4 w-4" />
                            <span>{candidate.experience}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{candidate.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{candidate.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{candidate.location}</span>
                          </div>
                          {candidate.resumeUrl && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(candidate.resumeUrl, '_blank')}
                                className="text-indigo-600 hover:text-indigo-700"
                              >
                                View Resume
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                  {/* If job/application data is available on scheduled rounds, show Job Details and richer candidate profile */}
                  {scheduledRounds && scheduledRounds.length > 0 && (() => {
                    // Try to extract job and application objects from the scheduled rounds items (they may be present under `raw` or directly)
                    let jobObj: any = null;
                    let appObj: any = null;
                    for (const rr of scheduledRounds) {
                      if (!rr) continue;
                      if (rr.raw && rr.raw.job) jobObj = rr.raw.job;
                      if (!jobObj && rr.job) jobObj = rr.job;
                      if (rr.raw && rr.raw.application) appObj = rr.raw.application;
                      if (!appObj && rr.application && typeof rr.application === 'object') appObj = rr.application;
                      // some responses may nest under rr.raw.round/application
                      if (!appObj && rr.raw && rr.raw.round && rr.raw.application) appObj = rr.raw.application;
                      if (jobObj && appObj) break;
                    }

                    return (
                      <>
                        {jobObj && (
                          <Card className="border-0 shadow-sm bg-white">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{jobObj.job_title || jobObj.title || jobObj.job_title}</h4>
                                  <div className="text-sm text-gray-600">{jobObj.company_name || jobObj.company || ''} · {jobObj.location_type || jobObj.city || ''}</div>
                                  <div className="mt-2 text-sm text-gray-700">{jobObj.description ? String(jobObj.description).slice(0, 220) : ''}</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {Array.isArray(jobObj.required_skills) && jobObj.required_skills.slice(0, 6).map((s:any) => (
                                      <Badge key={s.id || s.name} className="bg-gray-50 text-gray-700 border-gray-200">{s.name || s}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {(jobObj.salary_from || jobObj.salary_to) && (
                                    <div className="text-sm font-semibold text-gray-900">{jobObj.currency ? `${jobObj.currency} ` : ''}{jobObj.salary_from || ''}{jobObj.salary_to ? ` - ${jobObj.salary_to}` : ''}</div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {appObj && (
                          <Card className="border-0 shadow-sm bg-white">
                            <CardContent className="p-4">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">Candidate Profile</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-sm text-gray-600 font-medium">Skills</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Array.isArray(appObj.skills) && appObj.skills.length > 0 ? (
                                      appObj.skills.map((s:any) => (
                                        <Badge key={s.id || s.name} className="bg-gray-50 text-gray-700 border-gray-200">{s.name || s}</Badge>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500">No skills listed</div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm text-gray-600 font-medium">Experience</div>
                                  <div className="mt-2">
                                    {Array.isArray(appObj.experiences) && appObj.experiences.length > 0 ? (
                                      appObj.experiences.map((e:any) => (
                                        <div key={e.id} className="text-sm text-gray-700">{e.previous_job_titles || e.company_name || ''} · {e.years_of_experience || ''} yrs</div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500">No experience details</div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm text-gray-600 font-medium">Education</div>
                                  <div className="mt-2">
                                    {Array.isArray(appObj.educations) && appObj.educations.length > 0 ? (
                                      appObj.educations.map((ed:any) => (
                                        <div key={ed.id} className="text-sm text-gray-700">{ed.institution_name} · {ed.degree_detail || ed.education_level}</div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500">No education listed</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )
                  })()}

                {/* Scheduled Interviews (candidate-specific) */}
                {scheduledLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="ml-3 text-sm text-gray-600">Loading scheduled interviews...</span>
                  </div>
                ) : (
                  scheduledRounds && scheduledRounds.length > 0 ? (
                    <div className="mb-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Scheduled Interviews</h3>
                        <p className="text-sm text-gray-600">Existing scheduled interviews for this candidate</p>
                      </div>

                      <div className="space-y-3">
                        {scheduledRounds.map((r) => (
                          <Card key={r.id} className="border-0 shadow-sm bg-white">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                                  <div className="text-xs text-gray-600">{r.description}</div>
                                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-700">
                                    {r.scheduledDate && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-indigo-600" />
                                        <span>{new Date(r.scheduledDate).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {r.scheduledTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4 text-indigo-600" />
                                        <span>{r.scheduledTime}</span>
                                      </div>
                                    )}
                                    {r.interviewers && r.interviewers.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-indigo-600" />
                                        <span>{r.interviewers.map((iv:any)=> iv.user_name || iv.user || '').filter(Boolean).join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                                  <button
                                    aria-label="Edit scheduled round"
                                    onClick={() => onEditRound && onEditRound(r)}
                                    className="p-2 rounded-md hover:bg-gray-100"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M17.414 2.586a2 2 0 010 2.828L8.828 14H6v-2.828l8.586-8.586a2 2 0 012.828 0z" />
                                      <path d="M2 13.5V18h4.5L17.807 6.693a1 1 0 00-1.414-1.414L5 16.586V13.5H2z" fillRule="evenodd" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}

                {/* Interview Rounds list removed — only Scheduled Interviews are shown here per request */}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CandidateScheduleDrawer;
