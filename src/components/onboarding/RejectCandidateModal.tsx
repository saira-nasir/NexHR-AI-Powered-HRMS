import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import type { Candidate } from '@/pages/Onboarding';

interface RejectCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onConfirm: (justification: string) => void;
}

const RejectCandidateModal: React.FC<RejectCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onConfirm,
}) => {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!justification.trim()) {
      setError('Please provide a justification for rejection');
      return;
    }
    
    onConfirm(justification);
    setJustification('');
    setError('');
  };

  const handleClose = () => {
    setJustification('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Reject Candidate
          </DialogTitle>
          <DialogDescription className="text-base">
            You are about to reject <span className="font-semibold">{candidate.candidateName}</span>. 
            This action will remove them from the candidate list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="justification" className="text-base font-semibold text-gray-900">
              Rejection Justification *
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Please provide a clear reason for rejecting this candidate
            </p>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setError('');
              }}
              placeholder="e.g., Skills did not match job requirements, communication issues during interview..."
              className="min-h-32 resize-none"
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> This rejection will be logged and the candidate 
              will be notified via email (if configured).
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectCandidateModal;
