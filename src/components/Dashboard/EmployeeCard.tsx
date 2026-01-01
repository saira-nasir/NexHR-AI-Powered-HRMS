import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Phone, Mail } from 'lucide-react';
import { getUserRole } from '@/utils/roleUtils';


const EmployeeCard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);

  if (!user) return <div>Loading...</div>;

  const firstName = user.firstName || user.fname || '';
  const lastName = user.lastName || user.lname || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const isVerified = Boolean((user as any).is_verified);
  const department = (user as any).department || 'No department';
  const phone = user.phone || (user as any).mobile || '';
  const email = user.email || '';
  const rawStatus = (user as any).status || 'active';
  const statusText = typeof rawStatus === 'string' && rawStatus.length > 0
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
    : 'Active';

  // Get user role using the utility function
  const userRole = getUserRole(user);

  // Use profile_pic_url from user profile if available; otherwise render lottie animation
  const profilePicUrl = (user as any).profile_pic_url || (user as any).profile_pic || null;
  const employeeName = fullName || (user as any).name || '';

  // Lottie container (only used when profilePicUrl is null)
  const lottieContainer = useRef<HTMLDivElement | null>(null);
  const lottieAnimRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadLottie = async () => {
      if (profilePicUrl) return; // no lottie when we have a profile picture
      try {
        const lottieModule = await import('lottie-web');
        const lottie = (lottieModule as any).default || lottieModule;
        if (lottieContainer.current && mounted) {
          const anim = lottie.loadAnimation({
            container: lottieContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/lottieFiles/profile_pic.json',
          });
          lottieAnimRef.current = anim;
        }
      } catch (err) {
        console.error('Failed to load profile pic lottie:', err);
      }
    };

    loadLottie();

    return () => {
      mounted = false;
      if (lottieAnimRef.current && typeof lottieAnimRef.current.destroy === 'function') {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    };
  }, [profilePicUrl]);

  return (
    <div className="hr-card col-span-1 row-span-2 overflow-hidden flex flex-col animate-scale-in h-full">
      {/* Avatar: show profile_pic_url when available, otherwise show Lottie animation */}
      <div className="relative h-56 w-full overflow-hidden flex items-center justify-center bg-transparent">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={employeeName}
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div ref={lottieContainer} className="w-full h-full flex items-center justify-center" />
        )}

        <div className="absolute bottom-4 left-4 rounded-lg bg-black/20 backdrop-blur-sm px-3 py-1 text-white text-sm font-medium">
          <span>{isVerified ? 'Verified' : 'Not Verified'}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold">{employeeName}</h3>
          <p className="text-muted-foreground text-sm">{userRole}</p>
        </div>

        <div className="flex space-x-3 justify-center mb-6">
          <a href={`tel:${phone}`} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors p-2">
            <Phone className="h-5 w-5" />
          </a>
          <a href={`mailto:${email}`} className="rounded-full bg-muted hover:bg-muted/80 transition-colors p-2">
            <Mail className="h-5 w-5" />
          </a>
        </div>

      </div>
    </div>
  );
};

export default EmployeeCard;