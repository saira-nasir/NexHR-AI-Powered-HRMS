// src/pages/BranchesDepartments.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Briefcase,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import branchDepartmentService, { Branch, Department } from '@/services/branchDepartmentService';
import BranchFormModal from '@/components/branches/BranchFormModal';
import DepartmentFormModal from '@/components/branches/DepartmentFormModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BranchesDepartments: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set());

    // Modal states
    const [branchModalOpen, setBranchModalOpen] = useState(false);
    const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>();

    // Delete confirmation states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'branch' | 'department'; id: number; name: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [branchesData, departmentsData] = await Promise.all([
                branchDepartmentService.getBranches(),
                branchDepartmentService.getDepartments(),
            ]);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
            // Expand all branches by default
            if (Array.isArray(branchesData)) {
                setExpandedBranches(new Set(branchesData.map(b => b.id)));
            }
        } catch (error) {
            toast.error('Failed to load data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBranch = (branchId: number) => {
        setExpandedBranches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(branchId)) {
                newSet.delete(branchId);
            } else {
                newSet.add(branchId);
            }
            return newSet;
        });
    };

    const getDepartmentsForBranch = (branchId: number) => {
        return departments.filter(dept => dept.branch === branchId);
    };

    // Branch CRUD handlers
    const handleCreateBranch = async (payload: any) => {
        try {
            await branchDepartmentService.createBranch(payload);
            toast.success('Branch created successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create branch');
            throw error;
        }
    };

    const handleUpdateBranch = async (payload: any) => {
        if (!editingBranch) return;
        try {
            await branchDepartmentService.updateBranch(editingBranch.id, payload);
            toast.success('Branch updated successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update branch');
            throw error;
        }
    };

    const handleDeleteBranch = async (id: number) => {
        try {
            await branchDepartmentService.deleteBranch(id);
            toast.success('Branch deleted successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete branch');
        }
    };

    // Department CRUD handlers
    const handleCreateDepartment = async (payload: any) => {
        try {
            await branchDepartmentService.createDepartment(payload);
            toast.success('Department created successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create department');
            throw error;
        }
    };

    const handleUpdateDepartment = async (payload: any) => {
        if (!editingDepartment) return;
        try {
            await branchDepartmentService.updateDepartment(editingDepartment.id, payload);
            toast.success('Department updated successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update department');
            throw error;
        }
    };

    const handleDeleteDepartment = async (id: number) => {
        try {
            await branchDepartmentService.deleteDepartment(id);
            toast.success('Department deleted successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete department');
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'branch') {
            handleDeleteBranch(deleteTarget.id);
        } else {
            handleDeleteDepartment(deleteTarget.id);
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 bg-black opacity-10"></div>
                    <div className="relative px-6 py-8 sm:px-8 sm:py-12">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                                        Branches & Departments
                                    </h1>
                                    <p className="text-md text-indigo-100 max-w-2xl">
                                        Manage your organization's branches and departments
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={() => {
                                        setEditingBranch(null);
                                        setBranchModalOpen(true);
                                    }}
                                    className="bg-white text-indigo-600 hover:bg-indigo-50"
                                >
                                    <Plus className="mr-2 h-5 w-5" />
                                    Create Branch
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-8 sm:px-8">
                    <div className="max-w-7xl mx-auto">
                        {branches.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No branches yet</h3>
                                    <p className="text-gray-600 mb-4">Get started by creating your first branch</p>
                                    <Button onClick={() => setBranchModalOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Branch
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {branches.map((branch) => {
                                    const branchDepartments = getDepartmentsForBranch(branch.id);
                                    const isExpanded = expandedBranches.has(branch.id);

                                    return (
                                        <Card key={branch.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <Building2 className="h-5 w-5 text-indigo-600" />
                                                            {branch.name}
                                                        </CardTitle>
                                                        {(branch.city || branch.state) && (
                                                            <CardDescription className="flex items-center gap-1 mt-2">
                                                                <MapPin className="h-3 w-3" />
                                                                {[branch.city, branch.state, branch.country]
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </CardDescription>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingBranch(branch);
                                                                setBranchModalOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setDeleteTarget({ type: 'branch', id: branch.id, name: branch.name });
                                                                setDeleteConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            Departments ({branchDepartments.length})
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => toggleBranch(branch.id)}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="space-y-2">
                                                        {branchDepartments.length === 0 ? (
                                                            <p className="text-sm text-gray-500 text-center py-4">
                                                                No departments yet
                                                            </p>
                                                        ) : (
                                                            branchDepartments.map((dept) => (
                                                                <div
                                                                    key={dept.id}
                                                                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <span className="text-sm">{dept.name}</span>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-7 w-7"
                                                                            onClick={() => {
                                                                                setEditingDepartment(dept);
                                                                                setSelectedBranchId(branch.id);
                                                                                setDepartmentModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-7 w-7"
                                                                            onClick={() => {
                                                                                setDeleteTarget({ type: 'department', id: dept.id, name: dept.name });
                                                                                setDeleteConfirmOpen(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full mt-2"
                                                            onClick={() => {
                                                                setEditingDepartment(null);
                                                                setSelectedBranchId(branch.id);
                                                                setDepartmentModalOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Department
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <BranchFormModal
                isOpen={branchModalOpen}
                onClose={() => {
                    setBranchModalOpen(false);
                    setEditingBranch(null);
                }}
                onSave={editingBranch ? handleUpdateBranch : handleCreateBranch}
                branch={editingBranch}
            />

            <DepartmentFormModal
                isOpen={departmentModalOpen}
                onClose={() => {
                    setDepartmentModalOpen(false);
                    setEditingDepartment(null);
                    setSelectedBranchId(undefined);
                }}
                onSave={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}
                department={editingDepartment}
                branches={branches}
                defaultBranchId={selectedBranchId}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {deleteTarget?.type}{' '}
                            <strong>"{deleteTarget?.name}"</strong>.
                            {deleteTarget?.type === 'branch' && ' All departments in this branch will also be deleted.'}
                            {' '}This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default BranchesDepartments;
