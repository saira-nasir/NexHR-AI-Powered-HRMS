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
}

interface CandidateScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onScheduleRound: (round: InterviewRound) => void;
}

const CandidateScheduleDrawer: React.FC<CandidateScheduleDrawerProps> = ({
  isOpen,
  onClose,
  candidate,
  onScheduleRound,
}) => {
  // Sample interview rounds - in production, fetch from API based on job requirements
  const [interviewRounds] = useState<InterviewRound[]>([
    {
      id: 1,
      name: 'Technical Round 1',
      description: 'Initial technical screening with senior developer',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Technical Round 2',
      description: 'Deep dive into technical skills and problem solving',
      status: 'pending',
    },
    {
      id: 3,
      name: 'HR Round',
      description: 'Cultural fit and HR discussion',
      status: 'pending',
    },
    {
      id: 4,
      name: 'Managerial Round',
      description: 'Final round with hiring manager',
      status: 'pending',
    },
  ]);

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
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                  <p className="text-gray-600">Review candidate details and schedule interview rounds</p>
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

                {/* Interview Rounds Section */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Interview Rounds</h3>
                    <p className="text-sm text-gray-600">Select a round to schedule the interview</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {interviewRounds.map((round, index) => (
                      <Card
                        key={round.id}
                        className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{round.name}</h4>
                                <Badge variant="outline" className={getStatusColor(round.status)}>
                                  {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-600 ml-11">{round.description}</p>

                              {round.status === 'scheduled' && round.scheduledDate && (
                                <div className="ml-11 flex flex-wrap items-center gap-4 text-sm text-gray-700 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    <span>{round.scheduledDate.toLocaleDateString()}</span>
                                  </div>
                                  {round.scheduledTime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-indigo-600" />
                                      <span>{round.scheduledTime}</span>
                                    </div>
                                  )}
                                  {round.interviewer && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4 text-indigo-600" />
                                      <span>{round.interviewer}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => onScheduleRound(round)}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-shrink-0"
                              disabled={round.status === 'completed'}
                            >
                              {round.status === 'scheduled' ? 'Reschedule' : 'Schedule Round'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CandidateScheduleDrawer;
