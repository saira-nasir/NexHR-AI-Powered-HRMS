
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import { Link, useLocation } from 'react-router-dom';
import { Search, Calendar, Menu, PanelLeft, PanelRight, LogOut } from 'lucide-react';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Get stored sidebar state from localStorage or default to false (expanded)

  const storedSidebarState = localStorage.getItem('sidebarCollapsed');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    storedSidebarState ? JSON.parse(storedSidebarState) : false
  );
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Toggle mobile menu and collapse sidebar
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - position fixed on mobile to prevent content shift */}
      <div className={cn(
        "fixed z-50 h-full transition-transform duration-300 lg:relative",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Main Content - fixed margins on desktop, no offset on mobile */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 w-full",
        !mobileMenuOpen && sidebarCollapsed ? "lg:ml-[60px]" : "",
        !mobileMenuOpen && !sidebarCollapsed ? "lg:ml-[240px]" : ""
      )}>
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6">
            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileMenu}
              className="mr-3 rounded-full p-1.5 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            
            {/* Sidebar collapse button - only visible on larger screens */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex mr-4 rounded-full p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors"
            >
              {sidebarCollapsed ? <PanelRight size={18} /> : <PanelLeft size={18} />}
            </button>

            {/* Empty space to replace the removed navigation */}
            <div className="flex-1"></div>

            {/* Search and User */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-auto">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-40 md:w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <button className="rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors">
                <Calendar className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>

              <NotificationsDropdown />

              {/* Logout button */}
              <button 
                onClick={logout}
                className="rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors"
                title="Logout"
              >
                <LogOut className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>

              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User Profile"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - with proper padding on mobile */}
        <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-6 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
