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
// Use mock service for frontend testing (switch to real service when backend is ready)
import rolePermissionService from '@/services/rolePermissionService';

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Add Role Modal Component
 * Allows admin to create a new role with name and optional description
 */
const AddRoleModal: React.FC<AddRoleModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

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
      await rolePermissionService.createRole({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: `Role "${formData.name}" created successfully`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating role:', error);
      const data = error?.response?.data;
      let errorMessage = 'Failed to create role. Please try again.';

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data) {
        errorMessage = data.detail || data.message || undefined as any;
        if (!errorMessage) {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          if (Array.isArray(val)) errorMessage = val.join(' ');
          else if (typeof val === 'string') errorMessage = val;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

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
            <DialogTitle className="text-white text-2xl">Add New Role</DialogTitle>
            <DialogDescription className="text-white/90 mt-2">
              Create a new role. You can assign permissions to this role after creation.
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
              {loading ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoleModal;

