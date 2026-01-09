// src/components/branches/DepartmentFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Branch, Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/services/branchDepartmentService';

interface DepartmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => Promise<void>;
    department?: Department | null; // If provided, we're editing
    branches: Branch[]; // List of branches for dropdown
    defaultBranchId?: number; // Pre-select branch when adding from specific branch
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    department,
    branches,
    defaultBranchId
}) => {
    const [formData, setFormData] = useState<CreateDepartmentPayload>({
        name: '',
        branch: defaultBranchId,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name,
                branch: department.branch,
            });
        } else {
            setFormData({
                name: '',
                branch: defaultBranchId,
            });
        }
    }, [department, defaultBranchId, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Department name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving department:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{department ? 'Edit Department' : 'Create New Department'}</DialogTitle>
                    <DialogDescription>
                        {department ? 'Update department information' : 'Add a new department to a branch'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Department Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Engineering"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="branch">Branch *</Label>
                            <Select
                                value={formData.branch?.toString()}
                                onValueChange={(value) => setFormData({ ...formData, branch: parseInt(value) })}
                            >
                                <SelectTrigger id="branch">
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (department ? 'Update' : 'Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DepartmentFormModal;
