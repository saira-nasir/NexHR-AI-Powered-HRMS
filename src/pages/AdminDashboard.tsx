import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinanceDashboardContent from '@/components/admin/FinanceDashboardContent';
import HRDashboardContent from '@/components/admin/HRDashboardContent';
import RolesPermissionsContent from '@/components/admin/RolesPermissionsContent';
import { Briefcase, DollarSign, Shield } from 'lucide-react';

/**
 * Admin Dashboard Page
 * 
 * Provides a unified dashboard for administrators with access to:
 * - HR Management (HR dashboard content)
 * - Accounts/Finance (Finance dashboard content)
 * - Roles & Permissions (Role and permission management)
 */
const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview and management of HR, Finance, and system access controls
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="hr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 bg-[#F3F4F6] rounded-full p-1 h-auto">
            <TabsTrigger
              value="hr"
              className="rounded-full px-6 py-3 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <span>HR Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="rounded-full px-6 py-3 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              <span>Accounts</span>
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="rounded-full px-6 py-3 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#6C63FF] hover:bg-white/60 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>Roles & Permissions</span>
            </TabsTrigger>
          </TabsList>

          {/* HR Management Tab Content */}
          <TabsContent value="hr" className="space-y-6 mt-6">
            <HRDashboardContent />
          </TabsContent>

          {/* Accounts (Finance) Tab Content */}
          <TabsContent value="accounts" className="space-y-6 mt-6">
            <FinanceDashboardContent />
          </TabsContent>

          {/* Roles & Permissions Tab Content */}
          <TabsContent value="roles" className="space-y-6 mt-6">
            <RolesPermissionsContent />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

