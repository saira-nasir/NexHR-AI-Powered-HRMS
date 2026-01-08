import React from "react";
import { FaGoogle } from "react-icons/fa";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from '@/lib/api';

interface GoogleCalendarConnectButtonProps {
  onSuccess?: () => void;
  className?: string;
  onStart?: () => void;
  onError?: (err?: any) => void;
}

const GoogleCalendarConnectButton: React.FC<GoogleCalendarConnectButtonProps> = ({ 
  onSuccess, 
  className = "",
  onStart,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const handleGoogleCalendarConnect = async () => {
    try {
      if (!(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        
        script.onload = () => {
          initGoogleCalendarAuth();
        };
      } else {
        initGoogleCalendarAuth();
      }
    } catch (error) {
      console.error("Google Calendar connect error:", error);
      toast({
        title: "Error",
        description: "Failed to initialize Google Calendar connection",
        variant: "destructive",
      });
      onError?.(error);
    }
  };

  const initGoogleCalendarAuth = () => {
    const googleAuth = (window as any).google?.accounts.oauth2;
    if (!googleAuth) {
      console.error("Google OAuth library is not loaded.");
      toast({
        title: "Error",
        description: "Google OAuth library is not loaded",
        variant: "destructive",
      });
      return;
    }

    const codeClient = googleAuth.initCodeClient({
      client_id: "1041267363925-onnkbnmhs0i2dvqj5memd3vqhnrlem05.apps.googleusercontent.com",
      scope: "openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      ux_mode: "popup",
      callback: async (response: any) => {
        if (response.error) {
          console.error("Google Calendar authorization failed", response);
          toast({
            title: "Error",
            description: "Failed to authorize Google Calendar",
            variant: "destructive",
          });
          onError?.(response);
          return;
        }

        try {
          console.log("Authorization code received:", response.code);
              // indicate processing both locally and to parent
              setIsProcessing(true);
              onStart?.();

          // Send authorization code to backend
          const accessToken = localStorage.getItem("access_token");

          if (!accessToken) {
            toast({
              title: "Error",
              description: "Please login first",
              variant: "destructive",
            });
            setIsProcessing(false);
            onError?.({ message: 'No access token' });
            return;
          }

          // Use central api helper to respect baseURL and interceptors
          const data = await apiPost('/auth/google-calendar/connect/', { code: response.code });

          toast({
            title: "Success",
            description: "Successfully connected Google Calendar",
            className: "bg-green-50 border-green-200",
          });

          // Wait a bit to ensure backend processes the connection, then refresh
          setTimeout(() => {
            onSuccess?.();
          }, 500);
          setIsProcessing(false);
        } catch (error) {
          console.error("Backend connection failed:", error);
          toast({
            title: "Error",
            description: "Failed to connect with the server",
            variant: "destructive",
          });
          onError?.(error);
          setIsProcessing(false);
        }
      },
    });

    codeClient.requestCode();
  };

  return (
    <button
      onClick={handleGoogleCalendarConnect}
      className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition duration-300 shadow-md font-medium ${className}`}
    >
      <FaGoogle className="w-5 h-5" />
      Connect Google Calendar
    </button>
  );
};

export default GoogleCalendarConnectButton;
