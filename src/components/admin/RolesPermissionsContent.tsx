import React, { useState, useEffect } from 'react';
import RoleList from '@/components/admin/RoleList';
import AddRoleModal from '@/components/admin/AddRoleModal';
import EditPermissionsModal from '@/components/admin/EditPermissionsModal';
// Use mock service for frontend testing (switch to real service when backend is ready)
import rolePermissionService from '@/services/rolePermissionService.mock';
import type { Role } from '@/services/rolePermissionService';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

/**
 * Roles & Permissions Content Component
 * Extracted to be reusable in AdminDashboard (without DashboardLayout wrapper)
 */
const RolesPermissionsContent: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [editPermissionsModalOpen, setEditPermissionsModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const fetchedRoles = await rolePermissionService.listRoles();
      setRoles(fetchedRoles || []);
    } catch (error: any) {
      console.error('Error loading roles:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load roles. Please try again.';
      
      toast({
        title: 'Error Loading Roles',
        description: errorMessage,
        variant: 'destructive',
      });
      // Set empty array on error to prevent UI issues
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoleSuccess = () => {
    loadRoles();
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRoleForEdit(role);
    setEditPermissionsModalOpen(true);
  };

  const handleEditPermissionsSuccess = () => {
    loadRoles();
    setSelectedRoleForEdit(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground mt-1">
            Create roles and manage permissions to control access across the platform
          </p>
        </div>
      </div>

      {/* Role List */}
      <RoleList
        roles={roles}
        loading={loading}
        onAddRole={() => setAddRoleModalOpen(true)}
        onEditPermissions={handleEditPermissions}
      />

      {/* Add Role Modal */}
      <AddRoleModal
        open={addRoleModalOpen}
        onOpenChange={setAddRoleModalOpen}
        onSuccess={handleAddRoleSuccess}
      />

      {/* Edit Permissions Modal */}
      <EditPermissionsModal
        open={editPermissionsModalOpen}
        onOpenChange={(open) => {
          setEditPermissionsModalOpen(open);
          if (!open) {
            setSelectedRoleForEdit(null);
          }
        }}
        roles={roles}
        onSuccess={handleEditPermissionsSuccess}
      />
    </>
  );
};

export default RolesPermissionsContent;

