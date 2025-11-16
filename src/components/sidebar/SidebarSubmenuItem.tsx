
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarSubmenu } from '../../types/sidebar/types';

interface SidebarSubmenuItemProps {
  item: SidebarSubmenu;
  isActive: (path: string) => boolean;
}

const SidebarSubmenuItem: React.FC<SidebarSubmenuItemProps> = ({ item, isActive }) => {
  const active = isActive(item.path);
  
  return (
    <Link
      to={item.path}
      className={cn(
        "relative flex items-center gap-2.5 py-1.5 pl-2 text-sm rounded-sm transition-colors hover:text-dark-purple-1 group",
        active 
          ? "text-primary font-medium" 
          : "text-english-violet"
      )}
    >
      {/* Active indicator line - changed to primary color (purple) */}
      {active && (
        <span className="absolute left-[-1.25rem] w-[2px] h-full bg-primary" />
      )}
      
      {/* Step Number Badge */}
      {item.step && (
        <span 
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold transition-all",
            active 
              ? "bg-primary text-white shadow-sm" 
              : "bg-lavender text-english-violet group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          {item.step}
        </span>
      )}
      
      <span className="truncate flex-1">{item.title}</span>
    </Link>
  );
};

export default SidebarSubmenuItem;
