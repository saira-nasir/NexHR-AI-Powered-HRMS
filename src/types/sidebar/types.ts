
import { ElementType } from 'react';

export type SidebarSubmenu = {
  title: string;
  path: string;
  allowedRoles?: string[];
  step?: number;
};

export type SidebarMenuItem = {
  title: string;
  path: string;
  icon: ElementType;
  submenu?: SidebarSubmenu[];
  allowedRoles?: string[];
};

export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}
