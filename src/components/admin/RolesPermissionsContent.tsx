import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleList from '@/components/admin/RoleList';
import RoleModal from '@/components/admin/RoleModal';
import EditPermissionsModal from '@/components/admin/EditPermissionsModal';
import rolePermissionService, { Role } from '@/services/rolePermissionService';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';


/**
 * Roles & Permissions Content Component
 * Extracted to be reusable in AdminDashboard (without DashboardLayout wrapper)
 */
const RolesPermissionsContent: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForDetailsEdit, setRoleForDetailsEdit] = useState<Role | null>(null);
  const [editPermissionsModalOpen, setEditPermissionsModalOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const { toast } = useToast();
  const { reloadUser } = useAuth();

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
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSaveSuccess = () => {
    loadRoles();
    setRoleForDetailsEdit(null); // Reset after save
  };

  const handleAddRole = () => {
    setRoleForDetailsEdit(null); // Ensure add mode
    setRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setRoleForDetailsEdit(role);
    setRoleModalOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await rolePermissionService.deleteRole(role.id);
      toast({
        title: 'Success',
        description: `Role "${role.name}" deleted successfully`,
      });
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role. It may be in use.',
        variant: 'destructive',
      });
    }
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRoleForPermissions(role);
    setEditPermissionsModalOpen(true);
  };

  const handleEditPermissionsSuccess = async () => {
    loadRoles();
    setSelectedRoleForPermissions(null);
    // Refresh current user permissions to reflect changes immediately in Sidebar if applicable
    await reloadUser();
  };

  return (
    <>
      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#6C63FF] via-[#7B73FF] to-[#8B82FF] p-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-24 -mb-24"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight text-white">Roles & Permissions</h2>
            <p className="text-white/90 mt-1.5 text-base">
              Create roles and manage permissions to control access across the platform
            </p>
          </div>
        </div>
      </div>

      {/* Role List */}
      <RoleList
        roles={roles}
        loading={loading}
        onAddRole={handleAddRole}
        onEditPermissions={handleEditPermissions}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
      />

      {/* Role Modal (Add/Edit) */}
      <RoleModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        onSuccess={handleRoleSaveSuccess}
        roleToEdit={roleForDetailsEdit}
      />

      {/* Edit Permissions Modal */}
      <EditPermissionsModal
        open={editPermissionsModalOpen}
        onOpenChange={(open) => {
          setEditPermissionsModalOpen(open);
          if (!open) {
            setSelectedRoleForPermissions(null);
          }
        }}
        roles={roles}
        initialRoleId={selectedRoleForPermissions?.id}
        onSuccess={handleEditPermissionsSuccess}
      />
    </>
  );
};

export default RolesPermissionsContent;

