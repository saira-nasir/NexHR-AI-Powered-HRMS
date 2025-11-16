import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirect } from '@/contexts/RedirectContext';
import { useEffect, useState } from 'react';
import { toast } from "@/components/ui/use-toast";

const ProtectedRoute = () => {
  const { isAuthenticated, accessToken, refreshAccessToken } = useAuth();
  const { setRedirectPath } = useRedirect();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        setIsLoading(false);
        return;
      }

      if (accessToken) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          setRedirectPath(location.pathname);
        }
      } else {
        setRedirectPath(location.pathname);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [accessToken, isAuthenticated, refreshAccessToken, location.pathname, setRedirectPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C5470]"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
