import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Target, CalendarIcon, Award, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

// Import types from the main page to ensure type compatibility
type AssessmentStatus = "pending" | "scheduled" | "completed" | "passed" | "failed";
type AssessmentType = "technical" | "aptitude" | "behavioral" | "coding";

export type Candidate = {
  id: string;
  name: string;
  email: string;
  position: string;
  screeningScore: number;
  assessmentType?: AssessmentType;
  assessmentDate?: Date;
  assessmentScore?: number;
  status: AssessmentStatus;
};

interface Props {
  candidates: Candidate[];
  renderStatusBadge: (variant: 'assessment' | 'interview', status: any) => JSX.Element;
  onSchedule: (c: Candidate) => void;
  onAddScore: (c: Candidate) => void;
  onComplete: (id: string) => void;
}

const AssessmentList: React.FC<Props> = ({ candidates, renderStatusBadge, onSchedule, onAddScore, onComplete }) => {
  return (
    <Card className="border-0 shadow-xl bg-white backdrop-blur">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Assessment Pipeline</CardTitle>
            <CardDescription className="mt-1 text-sm">Track and manage candidate assessments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No assessments found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="group">
                <Card className="border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg bg-white overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:gap-6">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-xs sm:text-sm font-semibold">
                          {candidate.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 truncate text-sm sm:text-base font-semibold">{candidate.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{candidate.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                              {candidate.position}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="truncate">Screening: {candidate.screeningScore}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                        {candidate.assessmentType && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Assessment</p>
                              <p className="capitalize text-gray-900 font-medium">{candidate.assessmentType}</p>
                            </div>
                          </div>
                        )}

                        {candidate.assessmentDate && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Date</p>
                              <p className="text-gray-900 font-medium">{format(candidate.assessmentDate, 'MMM dd')}</p>
                            </div>
                          </div>
                        )}

                        {candidate.assessmentScore !== undefined && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Score</p>
                              <p className={`font-medium ${candidate.assessmentScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>{candidate.assessmentScore}%</p>
                            </div>
                          </div>
                        )}

                        <div className="flex-1 sm:flex-none">{renderStatusBadge('assessment', candidate.status)}</div>

                        <div className="flex gap-2 flex-wrap">
                          {candidate.status === 'pending' && (
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm" onClick={() => onSchedule(candidate)}>
                              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                              <span className="hidden sm:inline">Schedule</span>
                            </Button>
                          )}
                          {candidate.status === 'completed' && (
                            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm bg-transparent" onClick={() => onAddScore(candidate)}>
                              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                              <span className="hidden sm:inline">Add Score</span>
                            </Button>
                          )}
                          {candidate.status === 'scheduled' && (
                            <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 text-xs sm:text-sm bg-transparent" onClick={() => onComplete(candidate.id)}>
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                              <span className="hidden sm:inline">Complete</span>
                            </Button>
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

export default AssessmentList;
