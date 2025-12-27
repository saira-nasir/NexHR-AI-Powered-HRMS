import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Award, AlertCircle } from 'lucide-react';
import type { Candidate } from '@/pages/Onboarding';

interface RoundDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

const RoundDetailsModal: React.FC<RoundDetailsModalProps> = ({ isOpen, onClose, candidate }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Interview Round Details
          </DialogTitle>
          <DialogDescription className="text-base">
            {candidate.candidateName} - {candidate.candidateEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {candidate.rounds.map((round) => (
            <Card 
              key={round.roundId} 
              className={`border-2 ${
                round.isRoundComplete 
                  ? 'border-gray-200' 
                  : 'border-red-300 bg-red-50/30'
              }`}
            >
              <CardHeader className={`${
                round.isRoundComplete
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                  : 'bg-gradient-to-r from-red-50 to-red-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Award className={`h-5 w-5 ${
                        round.isRoundComplete ? 'text-blue-600' : 'text-red-600'
                      }`} />
                      {round.roundName}
                    </CardTitle>
                    {!round.isRoundComplete && (
                      <Badge className="bg-red-600 text-white px-3 py-1">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                  <Badge className={`${
                    round.isRoundComplete 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-400 text-white'
                  } text-lg px-4 py-1`}>
                    Overall Round Score: {round.overallRoundScore ?? round.roundScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {!round.isRoundComplete && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Round Incomplete</p>
                      <p className="text-xs text-red-700 mt-1">
                        This round has not been completed yet. All interviewers must submit their feedback before the candidate can proceed to onboarding.
                      </p>
                    </div>
                  </div>
                )}
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Interviewers</h4>
                <div className="space-y-4">
                  {round.interviewers.map((interviewer) => (
                    <div
                      key={interviewer.interviewerId}
                      className="p-4 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {interviewer.interviewerName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            interviewer.score >= 80
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : interviewer.score >= 60
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          Score: {interviewer.score}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Justification:</span>{' '}
                          {interviewer.justification}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {candidate.rounds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No interview rounds available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoundDetailsModal;
