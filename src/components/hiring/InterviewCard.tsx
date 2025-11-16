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
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                {interview.candidateName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span className="line-clamp-1">{interview.position}</span>
              </div>
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
                  {interview.interviewers.length > 2 
                    ? `${interview.interviewers.slice(0, 2).join(', ')} +${interview.interviewers.length - 2}`
                    : interview.interviewers.join(', ')
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Stage & Type Badges */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                {stageLabels[interview.interviewStage]}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {typeLabels[interview.interviewType]}
              </Badge>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
