import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InterviewScoringForm from '@/components/interview-scoring-form/InterviewScoringForm';
import { ScheduledInterview } from './InterviewCard';

interface ExpandableInterviewWorkspaceProps {
  interview: ScheduledInterview | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpandableInterviewWorkspace: React.FC<ExpandableInterviewWorkspaceProps> = ({
  interview,
  isOpen,
  onClose,
}) => {
  if (!interview) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Expanded Workspace */}
          <motion.div
            layoutId={`interview-card-${interview.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Interviews
                </Button>
                <div className="h-8 w-px bg-white/30" />
                <div>
                  <h2 className="text-lg font-bold text-white">{interview.candidateName}</h2>
                  <p className="text-sm text-indigo-100">{interview.position}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-muted/20">
              <InterviewScoringForm 
                initialData={{
                  candidateName: interview.candidateName,
                  positionAppliedFor: interview.position,
                  interviewDate: interview.interviewDate,
                  interviewStage: interview.interviewStage,
                  interviewType: interview.interviewType,
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
