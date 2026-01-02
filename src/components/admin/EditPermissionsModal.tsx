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
import rolePermissionService, { Role, Permission } from '@/services/rolePermissionService';

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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#6C63FF] via-[#7B73FF] to-[#8B82FF] px-6 pt-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-white text-2xl">
              {selectedRole
                ? `Edit Permissions for ${selectedRole.name}`
                : 'Edit Permissions'}
            </DialogTitle>
            <DialogDescription className="text-white/90 mt-2">
              Select or deselect permissions for this role. Changes will be saved
              when you click Save Changes.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6 bg-gradient-to-b from-slate-50/50 to-white">
          {/* Role Selector */}
          <div className="space-y-2">
            <Label htmlFor="role-select" className="text-base font-semibold text-foreground">Select Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={loading || loadingPermissions}
            >
              <SelectTrigger 
                id="role-select" 
                className="w-full h-11 border-primary/20 focus:border-primary focus:ring-primary/20 bg-white shadow-sm hover:border-primary/40 transition-colors"
              >
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
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{category}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {permissions.length} permission{permissions.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => {
                      const isChecked = selectedPermissionIds.has(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className={`
                            group relative flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200
                            ${isChecked 
                              ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md shadow-primary/10' 
                              : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:shadow-sm'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.02]'}
                          `}
                          onClick={() => !loading && handlePermissionToggle(permission.id, !isChecked)}
                        >
                          {isChecked && (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg"></div>
                          )}
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked === true)
                            }
                            disabled={loading}
                            className="pointer-events-none relative z-10"
                          />
                          <Label
                            htmlFor={`permission-${permission.id}`}
                            className={`text-sm font-medium cursor-pointer flex-1 leading-relaxed relative z-10 ${
                              isChecked ? 'text-primary' : 'text-foreground'
                            }`}
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
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-muted/20 to-muted/10 border border-muted/20">
                    <Shield className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg text-foreground">No permissions available</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Contact your system administrator to configure permissions
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg text-foreground">Select a role</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Choose a role from the dropdown above to view and edit its permissions
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedRoleId && selectedPermissionIds.size > 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20">
                <Shield className="h-3.5 w-3.5" />
                {selectedPermissionIds.size} permission{selectedPermissionIds.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !selectedRoleId || loadingPermissions}
              className="bg-gradient-to-r from-[#6C63FF] to-[#7B73FF] hover:from-[#5B52FF] hover:to-[#6C63FF] shadow-md hover:shadow-lg transition-all duration-200"
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

