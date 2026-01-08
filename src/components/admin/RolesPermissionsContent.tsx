import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleList from '@/components/admin/RoleList';
import RoleModal from '@/components/admin/RoleModal';
import EditPermissionsModal from '@/components/admin/EditPermissionsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rolePendingDelete, setRolePendingDelete] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    // Open confirmation modal instead of native confirm
    setRolePendingDelete(role);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!rolePendingDelete) return;
    const role = rolePendingDelete;
    setDeleteLoading(true);
    try {
      await rolePermissionService.deleteRole(role.id);
      toast({
        title: 'Success',
        description: `Role "${role.name}" deleted successfully`,
      });
      setRolePendingDelete(null);
      setDeleteModalOpen(false);
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete role. It may be in use.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B6B] via-[#FF7A7A] to-[#FF8A8A] px-6 pt-6 pb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-white text-2xl">Confirm Delete</DialogTitle>
              <DialogDescription className="text-white/90 mt-2">
                Are you sure you want to delete the role "{rolePendingDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 bg-gradient-to-b from-slate-50/50 to-white">
              <DialogFooter className="border-t border-gray-200 pt-4 mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-[#FF6B6B] to-[#FF4C4C] text-white"
                onClick={confirmDeleteRole}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RolesPermissionsContent;

