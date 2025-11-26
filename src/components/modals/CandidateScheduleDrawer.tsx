import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Briefcase, Calendar, Clock, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { applicationService } from '@/services/jobPortalservice';

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
  // Delete a round callback (notify parent that round was deleted)
  onDeleteRound?: (roundId: number) => void;
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
  onDeleteRound,
  scheduledLoading = false,
}) => {
  const [deletingRoundId, setDeletingRoundId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Open delete confirmation modal
  const openDeleteModal = (roundId: number) => {
    setRoundToDelete(roundId);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    if (deletingRoundId) return; // Don't close if deletion in progress
    setShowDeleteModal(false);
    setRoundToDelete(null);
    setDeleteError(null);
  };

  // Delete round handler
  const handleDeleteRound = async () => {
    if (!roundToDelete) return;

    setDeletingRoundId(roundToDelete);
    setDeleteError(null);
    try {
      const response = await applicationService.deleteInterviewRound(roundToDelete);
      if (response.success) {
        // Notify parent component to refresh the rounds list
        if (onDeleteRound) {
          onDeleteRound(roundToDelete);
        }
        closeDeleteModal();
      } else {
        setDeleteError(response.message || 'Failed to delete interview round');
      }
    } catch (error) {
      console.error('Error deleting interview round:', error);
      setDeleteError('An error occurred while deleting the interview round');
    } finally {
      setDeletingRoundId(null);
    }
  };

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

  const getFinalScoreColor = (score: number) => {
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
                    <Button onClick={() => onCreateRound && onCreateRound()} className="bg-purple-600 text-white hover:bg-purple-700">+ New Round</Button>
                  </div>
                </div>

                {/* Candidate Details Card - Simplified */}
                <Card className="border-0 shadow-xl bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Avatar */}
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full h-20 w-20 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {candidate.name.split(' ').map((n) => n[0]).join('')}
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
                          <Badge className={`${getFinalScoreColor(candidate.finalScore)} font-bold px-3 py-1`}>
                            {candidate.finalScore}% Score
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            {candidate.email}
                          </div>
                          <div className="text-sm text-gray-700">
                            {candidate.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                  {/* Candidate profile card removed per request */}

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
                                        <Calendar className="h-4 w-4 text-purple-600" />
                                        <span>{new Date(r.scheduledDate).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {r.scheduledTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4 text-purple-600" />
                                        <span>{r.scheduledTime}</span>
                                      </div>
                                    )}
                                    {r.interviewers && r.interviewers.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-purple-600" />
                                        <span>{r.interviewers.map((iv:any)=> iv.user_name || iv.user || '').filter(Boolean).join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                                  <button
                                    aria-label="Delete scheduled round"
                                    onClick={() => openDeleteModal(r.id)}
                                    disabled={deletingRoundId === r.id}
                                    className="p-2 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Trash2 className="h-5 w-5 text-red-600" />
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

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={closeDeleteModal}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Interview Round</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to delete this interview round? This action cannot be undone.
                      </p>
                      {deleteError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{deleteError}</p>
                        </div>
                      )}
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={closeDeleteModal}
                          disabled={!!deletingRoundId}
                          className="px-4"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeleteRound}
                          disabled={!!deletingRoundId}
                          className="bg-red-600 hover:bg-red-700 text-white px-4"
                        >
                          {deletingRoundId ? (
                            <>
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default CandidateScheduleDrawer;
