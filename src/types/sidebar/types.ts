
import { ElementType } from 'react';

export type SidebarSubmenu = {
  title: string;
  path: string;
  allowedRoles?: string[];
  step?: number;
  codename?: string;
};

export type SidebarMenuItem = {
  title: string;
  path: string;
  icon: ElementType;
  submenu?: SidebarSubmenu[];
  allowedRoles?: string[];
  codename?: string;
};

export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  searchQuery?: string;
}
