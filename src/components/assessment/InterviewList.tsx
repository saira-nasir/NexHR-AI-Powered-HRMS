import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Mail, Briefcase, User, MessageCircle, Star, Calendar as CalendarFilter, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

// Import types from the main page to ensure type compatibility
type InterviewStatus = "pending" | "scheduled" | "completed" | "selected" | "rejected";
type InterviewType = "hr" | "technical" | "managerial" | "panel";

export type Interview = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  assessmentScore: number;
  interviewType?: InterviewType;
  interviewDate?: Date;
  interviewTime?: string;
  interviewer?: string;
  rating?: number;
  feedback?: string;
  status: InterviewStatus;
};

interface Props {
  interviews: Interview[];
  renderStatusBadge: (variant: 'assessment' | 'interview', status: any) => JSX.Element;
  onSchedule: (i: Interview) => void;
  onFeedback: (i: Interview) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const InterviewList: React.FC<Props> = ({ interviews, renderStatusBadge, onSchedule, onFeedback, onUpdateStatus }) => {
  return (
    <Card className="border-0 shadow-xl bg-white backdrop-blur">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Interview Pipeline</CardTitle>
            <CardDescription className="mt-1 text-sm">Schedule and track candidate interviews</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No interviews found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="group">
                <Card className="border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg bg-white overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-xs sm:text-sm font-semibold">
                          {interview.candidateName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 truncate text-sm sm:text-base font-semibold">{interview.candidateName}</h3>
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span className="truncate">{interview.candidateEmail}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs sm:text-sm">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {interview.position}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                              <span className="truncate">Assessment: {interview.assessmentScore}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                        {interview.interviewType && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Type</p>
                              <p className="capitalize text-gray-900 font-medium">{interview.interviewType}</p>
                            </div>
                          </div>
                        )}

                        {interview.interviewDate && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <CalendarFilter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Date & Time</p>
                              <p className="text-gray-900 font-medium">{format(interview.interviewDate, 'MMM dd')}</p>
                              <p className="text-xs text-gray-500">{interview.interviewTime}</p>
                            </div>
                          </div>
                        )}

                      {typeof interview.rating === 'number' && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 sm:h-5 sm:w-5 ${interview.rating! >= star ? 'text-amber-500' : 'text-gray-300'}`} fill={interview.rating! >= star ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                      )}

                        <div className="flex-1 sm:flex-none">{renderStatusBadge('interview', interview.status)}</div>

                        <div className="flex flex-wrap gap-2">
                          {interview.status === 'pending' && (
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm" onClick={() => onSchedule(interview)}>
                              <CalendarFilter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                              <span className="hidden sm:inline">Schedule</span>
                            </Button>
                          )}
                          {interview.status === 'completed' && (
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs sm:text-sm" onClick={() => onUpdateStatus(interview.id, 'selected')}>
                                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                <span className="hidden sm:inline">Select</span>
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm bg-transparent" onClick={() => onUpdateStatus(interview.id, 'rejected')}>
                                <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterviewList;
