import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Award } from 'lucide-react';
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
            <Card key={round.roundId} className="border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    {round.roundName}
                  </CardTitle>
                  <Badge className="bg-indigo-600 text-white text-lg px-4 py-1">
                    Overall Score: {round.roundScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
