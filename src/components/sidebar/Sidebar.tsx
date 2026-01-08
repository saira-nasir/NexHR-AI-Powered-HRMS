
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarProps } from '../../types/sidebar/types';
import { sidebarItems } from './sidebarItems';
import SidebarHeader from './SidebarHeader';
import SidebarSearch from './SidebarSearch';
import SidebarItem from './SidebarItem';
import SidebarFooter from './SidebarFooter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getUserRole } from '@/utils/roleUtils';

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = useSelector((state: RootState) => state.auth.permissions) || [];

  // Filter sidebar items according to user role and real-time permissions
  const getVisibleItems = () => {
    const role = getUserRole(user);

    return sidebarItems
      .map(item => {
        // Special handling for items with submenus
        if (item.submenu && item.submenu.length > 0) {
          // Filter submenu items based on permissions
          const filteredSub = item.submenu.filter(sub => {
            // Strict Permission Check for submenu
            if (sub.codename && !permissions.includes(sub.codename)) {
              return false;
            }

            // Role Check for submenu (only if no codename)
            if (!sub.codename && sub.allowedRoles) {
              const userRole = getUserRole(user);
              if (!userRole || !sub.allowedRoles.includes(userRole)) {
                return false;
              }
            }
            return true;
          });

          // Show main tab if ANY subtab is visible (regardless of main tab's own codename/permission)
          if (filteredSub.length > 0) {
            return { ...item, submenu: filteredSub };
          }
          
          // If no subtabs are visible, hide the main tab
          return null;
        }

        // For items without submenus:
        // Special case: Hide "My Scheduled Interviews" if user has "interview_scheduling" permission
        if (item.codename === 'my_scheduled_interviews' && permissions.includes('interview_scheduling')) {
          return null;
        }

        // Special case: Bank Info should be shown to everyone except Admin dashboard users
        if (item.path === '/bank-info' && role === 'Admin') {
          return null;
        }

        // 1. Strict Permission Check:
        // If item has a codename, it MUST be present in permissions list.
        if (item.codename && !permissions.includes(item.codename)) {
          return null;
        }

        // 2. Role Check (only if no codename)
        // If item has NO codename, we rely on allowedRoles.
        if (!item.codename && item.allowedRoles) {
          const userRole = getUserRole(user);
          if (!userRole || !item.allowedRoles.includes(userRole)) {
            return null;
          }
        }

        return { ...item };
      })
      .filter(Boolean) as typeof sidebarItems;
  };

  const visibleItems = getVisibleItems();

  // Initialize open menus based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const initialOpenMenus: Record<string, boolean> = {};

    sidebarItems.forEach(item => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some(subItem =>
          currentPath === subItem.path ||
          currentPath.startsWith(subItem.path + '/')
        );
        if (isSubmenuActive) {
          initialOpenMenus[item.title] = true;
        }
      }
    });

    setOpenMenus(initialOpenMenus);
  }, [location.pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (path: string) => {
    // Treat onboarding submenu (/onboarding) as active also when on /onboard/:applicationId
    if (path === '/onboarding' && location.pathname.startsWith('/onboard')) return true;
    return location.pathname === path ||
      location.pathname.startsWith(path + '/') ||
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-screen flex flex-col overflow-y-auto border-r border-gray-100 transition-all duration-300 ease-in-out bg-white z-30",
      collapsed ? "w-[60px]" : "w-[240px]"
    )}>
      <SidebarHeader collapsed={collapsed} />
      {/* <SidebarSearch collapsed={collapsed} /> */}

      <nav className={cn(
        "flex-1 px-2 py-2 space-y-1",
        collapsed && "px-1"
      )}>
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.title}
            item={item}
            isActive={isActive}
            collapsed={collapsed}
            openMenus={openMenus}
            toggleMenu={toggleMenu}
          />
        ))}
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
};

export default Sidebar;
