import { useState, useEffect } from 'react';
import { linkedinService, LinkedInConnectionStatus } from '@/services/linkedinService';
import { toast } from '@/hooks/use-toast';

export const useLinkedInConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rawStatus, setRawStatus] = useState<LinkedInConnectionStatus | null>(null);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const access_token = localStorage.getItem('access_token');
      
      if (!access_token) {
        setError('No authentication token found');
        setIsConnected(false);
        return;
      }

  const status = await linkedinService.checkConnectionStatus();
  setRawStatus(status);

      // If backend includes an expires_at or a reason, treat expiry as disconnected
      let currentlyConnected = Boolean(status.isConnected);
      if (status.expires_at) {
        try {
          const exp = Date.parse(status.expires_at);
          if (!isNaN(exp) && exp < Date.now()) {
            currentlyConnected = false;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      // If backend explicitly reports a reason 'expired' mark as not connected
      if (status.reason && String(status.reason).toLowerCase() === 'expired') {
        currentlyConnected = false;
      }

  setIsConnected(currentlyConnected);

      // Provide helpful error/messages when not connected
      if (!currentlyConnected) {
        const msg = status.message || (status.reason ? `Reason: ${status.reason}` : 'Not connected to LinkedIn');
        setError(msg);
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMessage = 'Failed to check LinkedIn connection';
      setError(errorMessage);
      setIsConnected(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      setIsLoading(true);
      const access_token = localStorage.getItem('access_token');
      
      if (!access_token) {
        toast({
          title: "Authentication Error",
          description: "Please login to connect with LinkedIn",
          variant: "destructive",
        });
        return;
      }

      const status = await linkedinService.connectLinkedIn();
      // store raw status so consumers/debug UI can inspect
      setRawStatus(status);
      // update derived state based on returned status
      const currentlyConnected = Boolean(status?.isConnected);
      setIsConnected(currentlyConnected);

      if (status?.isConnected) {
        // connected
      } else {
        toast({
          title: "Error",
          description: status?.message || 'Failed to connect to LinkedIn',
          variant: "destructive",
        });
      }

      // return the status object for callers that expect it
      return status;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect to LinkedIn",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    rawStatus,
    checkConnection,
    connectLinkedIn
  };
}; 