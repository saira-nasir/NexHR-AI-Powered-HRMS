// src/layouts/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, PanelLeft, PanelRight, LogOut } from 'lucide-react';
import ProfileDrawer from '@/components/header/ProfileDrawer';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Chatbot } from '@/components/Chatbot/Chatbot'; // ✅ integrated Chatbot

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const storedSidebarState = localStorage.getItem('sidebarCollapsed');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    storedSidebarState ? JSON.parse(storedSidebarState) : false
  );
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const getInitials = () => {
    const fname = user?.firstName || '';
    const lname = user?.lastName || '';
    const first = fname.trim() ? fname.trim().split(' ')[0][0] : '';
    const last = lname.trim() ? lname.trim().split(' ')[0][0] : '';
    const initials = `${first}${last}`.toUpperCase();
    if (initials) return initials;
    // fallback to email first char
    return (user?.email?.[0] || '?').toUpperCase();
  };
  
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed z-50 h-full transition-transform duration-300 lg:relative",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Main area */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 w-full",
        !mobileMenuOpen && sidebarCollapsed ? "lg:ml-[60px]" : "",
        !mobileMenuOpen && !sidebarCollapsed ? "lg:ml-[240px]" : ""
      )}>
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6">
            <button 
              onClick={toggleMobileMenu}
              className="mr-3 rounded-full p-1.5 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex mr-4 rounded-full p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors"
            >
              {sidebarCollapsed ? <PanelRight size={18} /> : <PanelLeft size={18} />}
            </button>

            <div className="flex-1"></div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-auto">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-40 md:w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              {/* Calendar icon removed per design request */}

              <NotificationsDropdown />

              <button 
                onClick={logout}
                className="rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors"
                title="Logout"
              >
                <LogOut className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>

              <div className="flex items-center">
                <Avatar
                  role="button"
                  tabIndex={0}
                  title="Profile"
                  onClick={() => setProfileOpen(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProfileOpen(true); }}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {/* If user has an avatar URL in their profile, show it; otherwise show initials */}
                  {/* @ts-ignore optional image */}
                  {user && (user as any).avatarUrl ? (
                    <AvatarImage src={(user as any).avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                  ) : (
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  )}
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-6 pb-24">
          {children}
          <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </main>
      </div>

      {/* ✅ Chatbot floating globally across dashboard */}
      <Chatbot />
    </div>
  );
};

export default DashboardLayout;
