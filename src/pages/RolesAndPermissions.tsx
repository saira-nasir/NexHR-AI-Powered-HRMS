import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import RolesPermissionsContent from '@/components/admin/RolesPermissionsContent';

/**
 * Roles & Permissions Page (Standalone)
 * Can be used as a standalone page or embedded in AdminDashboard
 */
const RolesAndPermissions: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <RolesPermissionsContent />
      </div>
    </DashboardLayout>
  );
};

export default RolesAndPermissions;

