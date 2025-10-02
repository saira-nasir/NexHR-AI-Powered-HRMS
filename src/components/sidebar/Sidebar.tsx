
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

  // Filter sidebar items according to user role. If no user, default to showing only items without allowedRoles
  const getVisibleItems = () => {
    const role = getUserRole(user);
    return sidebarItems
      .map(item => {
        // If item has allowedRoles and user role not included -> skip
        if (item.allowedRoles && (!role || !item.allowedRoles.includes(role))) return null;

        // Filter submenu if present
        let submenu = item.submenu;
        if (submenu && submenu.length > 0) {
          const filteredSub = submenu.filter(sub => {
            if (!sub.allowedRoles) return true;
            return role && sub.allowedRoles.includes(role);
          });
          submenu = filteredSub;
        }

        return { ...item, submenu };
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
      <SidebarSearch collapsed={collapsed} />
      
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
