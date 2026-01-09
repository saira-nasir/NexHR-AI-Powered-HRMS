// src/components/branches/BranchFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/services/branchDepartmentService';

interface BranchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: CreateBranchPayload | UpdateBranchPayload) => Promise<void>;
    branch?: Branch | null; // If provided, we're editing
}

const BranchFormModal: React.FC<BranchFormModalProps> = ({ isOpen, onClose, onSave, branch }) => {
    const [formData, setFormData] = useState<CreateBranchPayload>({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (branch) {
            setFormData({
                name: branch.name,
                address: branch.address || '',
                city: branch.city || '',
                state: branch.state || '',
                country: branch.country || '',
                zip_code: branch.zip_code || '',
            });
        } else {
            setFormData({
                name: '',
                address: '',
                city: '',
                state: '',
                country: '',
                zip_code: '',
            });
        }
    }, [branch, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Branch name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving branch:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{branch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
                    <DialogDescription>
                        {branch ? 'Update branch information' : 'Add a new branch to your organization'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Branch Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Main Office"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Business St"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Lahore"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state">State/Province</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="Punjab"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="Pakistan"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="zip_code">Zip Code</Label>
                                <Input
                                    id="zip_code"
                                    value={formData.zip_code}
                                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                    placeholder="54000"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (branch ? 'Update' : 'Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BranchFormModal;
