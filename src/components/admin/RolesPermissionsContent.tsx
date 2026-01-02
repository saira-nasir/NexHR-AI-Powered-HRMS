import React, { useState, useEffect } from 'react';
import RoleList from '@/components/admin/RoleList';
import AddRoleModal from '@/components/admin/AddRoleModal';
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

