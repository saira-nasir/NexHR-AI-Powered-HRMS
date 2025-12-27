import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLinkedInConnection } from '@/hooks/useLinkedInConnection';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';



interface JobPostedModalProps {
  open: boolean;
  onClose: () => void;
  onPostLinkedIn?: () => Promise<void>;
}

const JobPostedModal: React.FC<JobPostedModalProps> = ({ open, onClose, onPostLinkedIn }) => {
  const { isConnected, isLoading, connectLinkedIn } = useLinkedInConnection();
  const [isPostedToLinkedIn, setIsPostedToLinkedIn] = React.useState(false);
  const navigate = useNavigate();

  const handleLinkedInAction = async () => {
    if (!isConnected) {
      await connectLinkedIn();
    } else if (onPostLinkedIn && !isPostedToLinkedIn) {
      await onPostLinkedIn(); // Assume this is async and handles actual API posting
      setIsPostedToLinkedIn(true); // Mark as posted
      navigate('/hiring/job-screening');
    }
  };

  // useEffect(() => {
  //   if (!open) {
  //     setIsPostedToLinkedIn(false); // Reset state when modal closes
  //   }
  // }, [open]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.linkedinAuth === "success") {
        // Refresh user connection status, update UI, etc.
        console.log("✅ LinkedIn successfully connected");
        toast({
          title: "Success",
          description: "Successfully connected with LinkedIn",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 rounded-3xl shadow-2xl bg-gradient-to-br from-[#F2F1F7] to-[#DBD8E3] border-0 overflow-hidden">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0077b5] to-[#00a0dc]" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0077b5] opacity-10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#5C5470] opacity-10 rounded-full blur-3xl" />

          <DialogHeader className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-30 animate-pulse" />
                <CheckCircle2 className="relative text-green-500 w-20 h-20 mb-2 animate-bounce" />
              </div>
              <DialogTitle className="text-4xl font-bold text-[#352F44] text-center mb-2">
                Job Posted Successfully!
              </DialogTitle>
              <p className="text-xl text-gray-700 text-center max-w-lg leading-relaxed">
                Your job has been posted and is now live for candidates to apply. Share it on LinkedIn to reach more qualified candidates.
              </p>
            </div>
          </DialogHeader>

          <div className="px-8 py-6 bg-white/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p>Job is now visible to all candidates</p>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p>Application tracking is active</p>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p>Email notifications are enabled</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 flex flex-col gap-4">
            <Button
              className="w-full bg-[#5C5470] hover:bg-[#352F44] text-white text-lg py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="w-full flex items-center justify-center gap-3 bg-[#0077b5] hover:bg-[#005983] text-white text-lg py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
              onClick={handleLinkedInAction}
              disabled={isLoading || isPostedToLinkedIn}
              type="button"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : isPostedToLinkedIn ? (
                'Already Posted to LinkedIn'
              ) : (
                <>
                  <Linkedin className="w-5 h-5" />
                  {isConnected ? 'Post job on LinkedIn' : 'Connect to LinkedIn'}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPostedModal; 