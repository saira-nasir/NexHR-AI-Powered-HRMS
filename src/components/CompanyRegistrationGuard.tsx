// src/components/CompanyRegistrationGuard.tsx
import { useEffect, useState, useRef } from 'react';
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
    const hasChecked = useRef(false);

    useEffect(() => {
        // Only check once on mount, not on every route change
        if (hasChecked.current) {
            setIsLoading(false);
            return;
        }

        const checkRedirectLogic = async () => {
            try {
                const response = await apiGet('/auth/dashboard-redirect/') as RedirectResponse;

                console.log("Redirect Logic:", response);

                // Mark as checked
                hasChecked.current = true;

                // If user needs to register company, redirect to /company
                if (response.redirect_to === 'company_register') {
                    if (!location.pathname.includes('/company')) {
                        navigate('/company', { replace: true });
                    }
                    setIsLoading(false);
                    return;
                }

                // If admin user and currently on /dashboard or /company, redirect to admin dashboard
                if (response.redirect_to === 'admin_dashboard') {
                    // Only redirect if user is on generic /dashboard or /company
                    // Don't redirect if they're already navigating to a specific protected route
                    if (location.pathname === '/dashboard' || location.pathname.includes('/company')) {
                        navigate('/admin-dashboard', { replace: true });
                    }
                    setIsLoading(false);
                    return;
                }

                // Regular dashboard users
                if (response.redirect_to === 'dashboard' || ['hr_dashboard', 'employee_dashboard'].includes(response.redirect_to)) {
                    // Only redirect if user is on /company or /admin-dashboard but shouldn't be
                    if (location.pathname.includes('/company') || location.pathname === '/admin-dashboard') {
                        navigate('/dashboard', { replace: true });
                    }
                    setIsLoading(false);
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Error checking dashboard redirect:", error);
                hasChecked.current = true;
                setIsLoading(false);
            }
        };

        checkRedirectLogic();
    }, []); // Run only once on mount

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