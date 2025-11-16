
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarMenuItem } from '../../types/sidebar/types';
import SidebarSubmenuItem from './SidebarSubmenuItem';

interface SidebarItemProps {
  item: SidebarMenuItem;
  isActive: (path: string) => boolean;
  collapsed: boolean;
  openMenus: Record<string, boolean>;
  toggleMenu: (title: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  collapsed,
  openMenus,
  toggleMenu,
}) => {
  const hasSubMenu = item.submenu && item.submenu.length > 0;
  const isOpen = openMenus[item.title] || false;
  const active = hasSubMenu 
    ? item.submenu?.some(subItem => isActive(subItem.path)) 
    : isActive(item.path);

  return (
    <div className={cn("mb-1", collapsed && "relative group")}>
      {/* Main menu item */}
      {hasSubMenu ? (
        <button
          onClick={() => !collapsed && toggleMenu(item.title)}
          className={cn(
            "w-full flex items-center py-2 px-3 rounded-md text-sm transition-colors",
            active 
              ? "text-primary font-medium bg-ghost-white" 
              : "text-gray-700 hover:text-dark-purple-1 hover:bg-lavender",
            collapsed ? "justify-center" : "justify-between"
          )}
          aria-expanded={isOpen && !collapsed}
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center justify-center w-5 h-5",
              active && "text-primary"
            )}>
              {React.createElement(item.icon, { size: 18 })}
            </span>
            {!collapsed && <span>{item.title}</span>}
          </div>
          
          {!collapsed && hasSubMenu && (
            <span className={cn("transition-transform", isOpen ? "rotate-180" : "")}>
              <ChevronDown size={14} />
            </span>
          )}
          
          {/* Submenu dropdown for collapsed sidebar */}
          {collapsed && hasSubMenu && (
            <div className="absolute left-full top-0 ml-2 w-48 bg-white shadow-lg rounded-md py-2 z-50 hidden group-hover:block border border-gray-100">
              <div className="py-1 px-3 font-medium border-b border-gray-100 mb-1">
                {item.title}
              </div>
              {item.submenu?.map((subItem) => (
                <Link
                  key={subItem.title}
                  to={subItem.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-lavender",
                    isActive(subItem.path) && "bg-ghost-white font-medium text-primary"
                  )}
                >
                  {subItem.step && (
                    <span 
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold",
                        isActive(subItem.path)
                          ? "bg-primary text-white shadow-sm"
                          : "bg-lavender text-english-violet"
                      )}
                    >
                      {subItem.step}
                    </span>
                  )}
                  <span className="flex-1">{subItem.title}</span>
                </Link>
              ))}
            </div>
          )}
        </button>
      ) : (
        <Link
          to={item.path}
          className={cn(
            "flex items-center py-2 px-3 rounded-md text-sm transition-colors",
            active 
              ? "text-primary font-medium bg-ghost-white" 
              : "text-gray-700 hover:text-dark-purple-1 hover:bg-lavender",
            collapsed && "justify-center"
          )}
        >
          <span className={cn(
            "flex items-center justify-center w-5 h-5",
            active && "text-primary"
          )}>
            {React.createElement(item.icon, { size: 18 })}
          </span>
          {!collapsed && <span className="ml-3">{item.title}</span>}
        </Link>
      )}

      {/* Submenu items for expanded sidebar */}
      {!collapsed && hasSubMenu && isOpen && (
        <div className="ml-2 pl-4 border-l border-primary mt-1 space-y-1">
          {item.submenu?.map((subItem) => (
            <SidebarSubmenuItem
              key={subItem.title}
              item={subItem}
              isActive={isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
