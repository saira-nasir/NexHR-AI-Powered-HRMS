import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Shield } from 'lucide-react';
// Use mock service for frontend testing (switch to real service when backend is ready)
import rolePermissionService from '@/services/rolePermissionService.mock';
import type { Role, Permission } from '@/services/rolePermissionService';

interface EditPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSuccess?: () => void;
}

/**
 * Edit Permissions Modal Component
 * Allows admin to assign permissions to roles, grouped by categories
 * Based on the reference design with role selector and category-based permissions
 */
const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({
  open,
  onOpenChange,
  roles,
  onSuccess,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const { toast } = useToast();

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    allPermissions.forEach((permission) => {
      const category = permission.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    return grouped;
  }, [allPermissions]);

  // Load all permissions when modal opens
  useEffect(() => {
    if (open) {
      loadPermissions();
    }
  }, [open]);

  // Load role permissions when role is selected
  useEffect(() => {
    if (open && selectedRoleId) {
      loadRolePermissions(Number(selectedRoleId));
    } else {
      setSelectedPermissionIds(new Set());
    }
  }, [open, selectedRoleId]);

  const loadPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const permissions = await rolePermissionService.listPermissions();
      setAllPermissions(permissions || []);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load permissions. Please try again.';
      
      toast({
        title: 'Error Loading Permissions',
        description: errorMessage,
        variant: 'destructive',
      });
      // Set empty array on error to prevent UI issues
      setAllPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    try {
      const role = await rolePermissionService.getRole(roleId);
      const permissionIds = role.permissions?.map((p) => p.id) || role.permission_ids || [];
      setSelectedPermissionIds(new Set(permissionIds));
    } catch (error: any) {
      console.error('Error loading role permissions:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load role permissions. Please try again.';
      
      toast({
        title: 'Error Loading Role Permissions',
        description: errorMessage,
        variant: 'destructive',
      });
      setSelectedPermissionIds(new Set());
    }
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await rolePermissionService.updateRolePermissions(Number(selectedRoleId), {
        permission_ids: Array.from(selectedPermissionIds),
      });

      const selectedRole = roles.find((r) => r.id === Number(selectedRoleId));
      toast({
        title: 'Success',
        description: `Permissions updated for "${selectedRole?.name || 'role'}"`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update permissions. Please try again.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === Number(selectedRoleId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedRole
              ? `Edit Permissions for ${selectedRole.name}`
              : 'Edit Permissions'}
          </DialogTitle>
          <DialogDescription>
            Select or deselect permissions for this role. Changes will be saved
            when you click Save Changes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Role Selector */}
          <div className="space-y-2">
            <Label htmlFor="role-select">Select Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={loading || loadingPermissions}
            >
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions by Category */}
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading permissions...</p>
              </div>
            </div>
          ) : selectedRoleId ? (
            Object.entries(permissionsByCategory).length > 0 ? (
              Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {permissions.length} permission{permissions.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => {
                      const isChecked = selectedPermissionIds.has(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg border transition-all
                            ${isChecked 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          onClick={() => !loading && handlePermissionToggle(permission.id, !isChecked)}
                        >
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked === true)
                            }
                            disabled={loading}
                            className="pointer-events-none"
                          />
                          <Label
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm font-normal cursor-pointer flex-1 leading-relaxed"
                          >
                            {permission.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Shield className="h-12 w-12 text-muted-foreground/50" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">No permissions available</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your system administrator to configure permissions
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Shield className="h-12 w-12 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Select a role</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a role from the dropdown above to view and edit its permissions
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedRoleId && selectedPermissionIds.size > 0 && (
              <span>
                {selectedPermissionIds.size} permission{selectedPermissionIds.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !selectedRoleId || loadingPermissions}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPermissionsModal;

