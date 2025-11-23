import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Users, Briefcase, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export interface ScheduledInterview {
  id: string;
  candidateName: string;
  position: string;
  interviewDate: Date;
  interviewTime: string;
  interviewers: string[];
  interviewStage: 'phone' | 'first' | 'second' | 'final';
  interviewType: 'technical' | 'behavioral' | 'panel';
  status: 'pending' | 'in-progress' | 'completed';
  candidateEmail?: string;
  candidatePhone?: string;
  // Extended fields from API
  roundId?: number;
  applicationId?: number;
  seqNumber?: number;
  roundName?: string;
  roundType?: string;
  roundMode?: string;
  meetingLink?: string | null;
  roundState?: string;
  roundResult?: string;
  interviewersDetails?: Array<{
    id: number;
    user: number;
    user_name: string;
    user_email: string;
    is_submitted?: boolean;
    interviewer_score?: number | null;
  }>;
  // Candidate/Application details (for future use in scoring form)
  candidateData?: any;
  jobData?: any;
}

interface InterviewCardProps {
  interview: ScheduledInterview;
  onClick: () => void;
}

const stageLabels = {
  phone: 'Phone Screen',
  first: '1st Round',
  second: '2nd Round',
  final: 'Final Round'
};

const typeLabels = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  panel: 'Panel Interview'
};

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Scheduled' },
  'in-progress': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Completed' }
};

export const InterviewCard: React.FC<InterviewCardProps> = ({ interview, onClick }) => {
  const statusStyle = statusConfig[interview.status];
  // Prefer candidate name from candidateData (application) when available
  const candidateDisplayName = interview.candidateData && (interview.candidateData.candidate_fname || interview.candidateData.candidate_lname)
    ? `${interview.candidateData.candidate_fname || ''} ${interview.candidateData.candidate_lname || ''}`.trim()
    : interview.candidateName;

  const seqLabel = interview.seqNumber !== undefined && interview.seqNumber !== null ? `Round ${interview.seqNumber}` : null;
  const roundTypeLabel = interview.roundType || (interview as any).round_type || '';
  const roundNameLabel = interview.roundName || (interview as any).round_name || '';
  return (
    <motion.div
      layoutId={`interview-card-${interview.id}`}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden border-2 border-gray-100 hover:border-indigo-200 transition-colors">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{candidateDisplayName}</h3>
              <div className="text-sm text-gray-600 mb-1">{interview.position}</div>
            </div>
            <Badge variant="outline" className={`${statusStyle.color} font-medium flex-shrink-0`}>
              {statusStyle.label}
            </Badge>
          </div>

          {/* Interview Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">{format(interview.interviewDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">{interview.interviewTime}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Users className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-gray-600">Interviewers: </span>
                <span className="font-medium text-gray-900">
                  {Array.isArray(interview.interviewersDetails) && interview.interviewersDetails.length > 0 ? (
                    interview.interviewersDetails.length > 2
                      ? `${interview.interviewersDetails.slice(0, 2).map((i) => i.user_name || i.user || '').filter(Boolean).join(', ')} +${interview.interviewersDetails.length - 2}`
                      : interview.interviewersDetails.map((i) => i.user_name || i.user || '').filter(Boolean).join(', ')
                  ) : Array.isArray(interview.interviewers) ? (
                    interview.interviewers.length > 2
                      ? `${interview.interviewers.slice(0, 2).join(', ')} +${interview.interviewers.length - 2}`
                      : interview.interviewers.join(', ')
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Footer: show seq / round type / round name once (do not duplicate) */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600 flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium flex-shrink-0">
                {seqLabel && <span className="font-medium mr-2">{seqLabel}</span>}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium flex-shrink-0">
                {roundTypeLabel && <span className="capitalize mr-2">{roundTypeLabel}</span>}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium flex-shrink-0">
                {roundNameLabel && <span className="text-gray-500">{roundNameLabel}</span>}
              </Badge>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
