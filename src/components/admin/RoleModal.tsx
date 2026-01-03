import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import rolePermissionService, { Role } from '@/services/rolePermissionService';

interface RoleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    roleToEdit?: Role | null; // If provided, we are in Edit mode
}

/**
 * Role Modal Component
 * Handles creating NEW roles and EDITING existing roles
 */
const RoleModal: React.FC<RoleModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    roleToEdit,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const isEditMode = !!roleToEdit;

    useEffect(() => {
        if (open) {
            if (roleToEdit) {
                setFormData({
                    name: roleToEdit.name,
                    description: roleToEdit.description || '',
                });
            } else {
                resetForm();
            }
        }
    }, [open, roleToEdit]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Role name is required',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && roleToEdit) {
                // Update Role
                await rolePermissionService.updateRole(roleToEdit.id, {
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                });
                toast({
                    title: 'Success',
                    description: `Role "${formData.name}" updated successfully`,
                });
            } else {
                // Create Role
                await rolePermissionService.createRole({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                });
                toast({
                    title: 'Success',
                    description: `Role "${formData.name}" created successfully`,
                });
            }

            resetForm();
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Error saving role:', error);
            const errorMessage =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.message ||
                `Failed to ${isEditMode ? 'update' : 'create'} role. Please try again.`;

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                {/* Header with Gradient */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#6C63FF] via-[#7B73FF] to-[#8B82FF] px-6 pt-6 pb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-white text-2xl">
                            {isEditMode ? 'Edit Role' : 'Add New Role'}
                        </DialogTitle>
                        <DialogDescription className="text-white/90 mt-2">
                            {isEditMode
                                ? 'Update role details.'
                                : 'Create a new role. You can assign permissions after creation.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 bg-gradient-to-b from-slate-50/50 to-white">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-semibold">
                            Role Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., Chief, Manager, Supervisor"
                            required
                            disabled={loading}
                            className="h-11 border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Brief description of this role's purpose..."
                            rows={3}
                            disabled={loading}
                            className="border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm resize-none"
                        />
                    </div>

                    <DialogFooter className="border-t border-gray-200 pt-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-[#6C63FF] to-[#7B73FF] hover:from-[#5B52FF] hover:to-[#6C63FF] shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Role' : 'Create Role')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RoleModal;
