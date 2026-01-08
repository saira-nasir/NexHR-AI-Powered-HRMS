import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/api';

interface Props {
  children: React.ReactNode;
}

const CompanyOnlyGuard: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiGet('/auth/dashboard-redirect/');
        const redirect = res?.redirect_to;

        if (redirect === 'company_register') {
          setChecking(false);
          return;
        }

        // If not allowed, navigate away to intended dashboard
        if (redirect === 'admin_dashboard') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Error checking company access:', err);
        // On error, be conservative and redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    };

    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm font-medium">Checking account status...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default CompanyOnlyGuard;
