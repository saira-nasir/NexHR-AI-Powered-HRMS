// src/components/CompanyRegistrationGuard.tsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { apiGet } from '@/lib/api'; 
import { Loader2 } from 'lucide-react';

interface RedirectResponse {
  redirect_to: string;
  message?: string;
  status?: string;
}

const CompanyRegistrationGuard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkRedirectLogic = async () => {
            try {
                // ✅ FIX: Changed from '/dashboard-redirect/' to '/auth/dashboard-redirect/'
                // Assuming your apiGet helper appends '/api', the result is '/api/auth/dashboard-redirect/'
                const response = await apiGet('/auth/dashboard-redirect/') as RedirectResponse;

                console.log("Redirect Logic:", response);

                if (response.redirect_to === 'company_register') {
                    if (!location.pathname.includes('/company')) {
                        navigate('/company', { replace: true });
                    }
                    return; 
                } 
                
                if (['hr_dashboard', 'employee_dashboard'].includes(response.redirect_to)) {
                    if (location.pathname.includes('/company')) {
                        navigate('/dashboard', { replace: true });
                    }
                    setIsLoading(false);
                }

            } catch (error) {
                console.error("Error checking dashboard redirect:", error);
                setIsLoading(false); 
            }
        };

        checkRedirectLogic();
    }, [navigate, location]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground text-sm font-medium">Verifying Account Status...</p>
            </div>
        );
    }

    return <Outlet />;
};

export default CompanyRegistrationGuard;