import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Plus, Briefcase, Layers, Users, MoreVertical, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { resourceAllocationService, Project, Allocation } from '@/services/resourceAllocationService';
import { employeeService, Employee } from '@/services/employeeService';
import { toast } from 'sonner';

const ResourceAllocation = () => {
    // --- State ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProjectLoading, setIsProjectLoading] = useState(false); // New state for project detail loading
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; type: 'project' | 'allocation'; id: number | null }>({
        isOpen: false,
        type: 'project',
        id: null
    });

    // ... existing fetch functions ...

    const handleDeleteClick = (type: 'project' | 'allocation', id: number) => {
        setDeleteConfirmation({ isOpen: true, type, id });
    };

    const executeDelete = async () => {
        if (!deleteConfirmation.id) return;

        try {
            if (deleteConfirmation.type === 'project') {
                await resourceAllocationService.deleteProject(deleteConfirmation.id);
                setProjects(projects.filter(p => p.id !== deleteConfirmation.id));
                if (selectedProject?.id === deleteConfirmation.id) {
                    setSelectedProject(null);
                }
                toast.success('Project deleted successfully');
            } else {
                await resourceAllocationService.deleteAllocation(deleteConfirmation.id);
                if (selectedProject) {
                    setSelectedProject({
                        ...selectedProject,
                        allocations: selectedProject.allocations?.filter(a => a.id !== deleteConfirmation.id)
                    });
                    toast.success('Allocation removed successfully');
                }
            }
        } catch (error) {
            console.error(`Failed to delete ${deleteConfirmation.type}:`, error);
            toast.error(`Failed to delete ${deleteConfirmation.type}`);
        } finally {
            setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
        }
    };
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

    // Form State for Project (Create & Edit)
    const [currentProjectForm, setCurrentProjectForm] = useState<{
        id?: number;
        name: string;
        description: string;
        startDate: Date | undefined;
        endDate: Date | undefined;
        status: 'active' | 'completed' | 'on-hold';
    }>({
        name: '',
        description: '',
        startDate: undefined,
        endDate: undefined,
        status: 'active'
    });

    // Form State for Assignment
    const [newAssignment, setNewAssignment] = useState({
        employeeId: '',
        taskName: '',
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
    });

    // --- Effects ---

    useEffect(() => {
        fetchProjects();
        fetchEmployees();
    }, []);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await resourceAllocationService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await employeeService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    };

    const fetchProjectDetails = async (projectId: number) => {
        try {
            setIsProjectLoading(true); // Start loading
            const data = await resourceAllocationService.getProject(projectId);
            setSelectedProject(data);
        } catch (error) {
            console.error('Failed to fetch project details:', error);
            toast.error('Failed to load project details');
        } finally {
            setIsProjectLoading(false); // End loading
        }
    };

    // --- Handlers: Project ---

    const handleCreateProject = async () => {
        if (!currentProjectForm.name || !currentProjectForm.startDate || !currentProjectForm.endDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                name: currentProjectForm.name,
                description: currentProjectForm.description,
                start_date: format(currentProjectForm.startDate, 'yyyy-MM-dd'),
                end_date: format(currentProjectForm.endDate, 'yyyy-MM-dd'),
                status: currentProjectForm.status
            };

            const createdProject = await resourceAllocationService.createProject(payload);
            setProjects([...projects, createdProject]);
            toast.success('Project created successfully');
            setIsCreateModalOpen(false);
            resetProjectForm();
        } catch (error) {
            console.error('Failed to create project:', error);
            toast.error('Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProjectClick = (project: Project) => {
        setCurrentProjectForm({
            id: project.id,
            name: project.name,
            description: project.description,
            startDate: project.start_date ? new Date(project.start_date) : undefined,
            endDate: project.end_date ? new Date(project.end_date) : undefined,
            status: project.status
        });
        setIsEditProjectModalOpen(true);
    };

    const handleUpdateProject = async () => {
        if (!currentProjectForm.id || !currentProjectForm.name || !currentProjectForm.startDate || !currentProjectForm.endDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                name: currentProjectForm.name,
                description: currentProjectForm.description,
                start_date: format(currentProjectForm.startDate, 'yyyy-MM-dd'),
                end_date: format(currentProjectForm.endDate, 'yyyy-MM-dd'),
                status: currentProjectForm.status
            };

            const updatedProject = await resourceAllocationService.updateProject(currentProjectForm.id, payload);

            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
            if (selectedProject?.id === updatedProject.id) {
                // Preserve allocations while updating project details
                setSelectedProject({ ...selectedProject, ...updatedProject });
            }

            toast.success('Project updated successfully');
            setIsEditProjectModalOpen(false);
            resetProjectForm();
        } catch (error) {
            console.error('Failed to update project:', error);
            toast.error('Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetProjectForm = () => {
        setCurrentProjectForm({
            name: '',
            description: '',
            startDate: undefined,
            endDate: undefined,
            status: 'active'
        });
    };

    // --- Handlers: Assignment/Allocation ---

    const handleAssignMember = async () => {
        if (!selectedProject || !newAssignment.employeeId || !newAssignment.taskName || !newAssignment.startDate || !newAssignment.endDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Task
            const taskPayload = {
                project: selectedProject.id,
                name: newAssignment.taskName,
                description: `Task for ${newAssignment.taskName}`,
                status: 'pending' as const
            };
            const createdTask = await resourceAllocationService.createTask(taskPayload);

            // 2. Assign User to Task
            const assignmentPayload = {
                task_id: createdTask.id,
                user_ids: [parseInt(newAssignment.employeeId)],
                start_date: format(newAssignment.startDate, 'yyyy-MM-dd'),
                end_date: format(newAssignment.endDate, 'yyyy-MM-dd')
            };

            await resourceAllocationService.assignUsersToTask(assignmentPayload);

            toast.success('Member assigned successfully');

            // Refresh project details to show new allocation
            await fetchProjectDetails(selectedProject.id);

            setIsAssignModalOpen(false);
            setNewAssignment({
                employeeId: '',
                taskName: '',
                startDate: undefined,
                endDate: undefined
            });

        } catch (error) {
            console.error('Failed to assign member:', error);
            toast.error('Failed to create assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        fetchProjectDetails(project.id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'on-hold': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <Layers className="h-8 w-8 text-indigo-600" />
                            Resource Allocation
                        </h1>
                        <p className="text-gray-500 mt-1">Manage projects and assign tasks to your team efficiently.</p>
                    </div>
                    <Button
                        onClick={() => { resetProjectForm(); setIsCreateModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Project
                    </Button>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Project List Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-500" /> All Projects
                        </h2>

                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No projects found.</div>
                        ) : (
                            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                                {projects.map((project) => (
                                    <Card
                                        key={project.id}
                                        onClick={() => handleProjectClick(project)}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md border-2",
                                            selectedProject?.id === project.id
                                                ? "border-indigo-500 bg-indigo-50/30 shadow-md ring-1 ring-indigo-200"
                                                : "border-transparent bg-white hover:border-indigo-200"
                                        )}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-bold text-gray-900">{project.name}</CardTitle>
                                                <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide", getStatusColor(project.status))}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <CardDescription className="line-clamp-2 text-sm text-gray-500 mt-1">
                                                {project.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    {project.start_date ? format(new Date(project.start_date), 'MMM d') : '-'}
                                                </div>
                                                {(project.total_allocated_users !== undefined) && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {project.total_allocated_users} members
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Project Detail & Allocation Column */}
                    <div className="lg:col-span-2">
                        {isProjectLoading ? (
                            <Card className="h-full border-0 shadow-xl shadow-gray-200/50 bg-white ring-1 ring-gray-100 flex flex-col items-center justify-center">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                                <p className="text-gray-500 font-medium">Loading project details...</p>
                            </Card>
                        ) : selectedProject ? (
                            <Card className="h-full border-0 shadow-xl shadow-gray-200/50 bg-white ring-1 ring-gray-100 flex flex-col">
                                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white pb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-gray-900">{selectedProject.name}</CardTitle>
                                            <CardDescription className="text-base mt-2">{selectedProject.description}</CardDescription>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditProjectClick(selectedProject)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Project
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick('project', selectedProject.id); }} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex gap-6 mt-4 text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-semibold">Start Date</span>
                                            <span className="font-medium">{selectedProject.start_date ? format(new Date(selectedProject.start_date), 'PPP') : 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-semibold">End Date</span>
                                            <span className="font-medium">{selectedProject.end_date ? format(new Date(selectedProject.end_date), 'PPP') : 'N/A'}</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 p-6 bg-gray-50/30">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-800">Team Allocations</h3>
                                        <Button size="sm" onClick={() => setIsAssignModalOpen(true)} className="bg-white border hover:bg-gray-50 text-indigo-600 border-indigo-200 shadow-sm">
                                            <Plus className="h-3.5 w-3.5 mr-2" /> Assign Member
                                        </Button>
                                    </div>

                                    {!selectedProject.allocations || selectedProject.allocations.length === 0 ? (
                                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            <Users className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No team members assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedProject.allocations.map((alloc) => (
                                                <div key={alloc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group relative">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="h-10 w-10 border border-gray-100">
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-medium">
                                                                {alloc.user_name ? alloc.user_name.charAt(0).toUpperCase() : 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{alloc.user_name}</p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                                                    alloc.task_status === 'done' ? "bg-green-100 text-green-700" :
                                                                        alloc.task_status === 'inprogress' ? "bg-blue-100 text-blue-700" :
                                                                            "bg-gray-100 text-gray-700"
                                                                )}>
                                                                    {alloc.task_status === 'inprogress' ? 'In Progress' : (alloc.task_status || 'To Do')}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Task</p>
                                                                <p className="text-sm font-medium text-gray-800">{alloc.task_name}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col items-end gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleDeleteClick('allocation', alloc.id)} className="text-red-600 focus:text-red-600">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 p-12">
                                <Layers className="h-16 w-16 mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-600">No Project Selected</h3>
                                <p className="text-sm">Select a project from the list to view details and manage allocations.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Project Dialog - Reusable for both */}
                <Dialog open={isCreateModalOpen || isEditProjectModalOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateModalOpen(false);
                        setIsEditProjectModalOpen(false);
                        resetProjectForm();
                    }
                }}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{isEditProjectModalOpen ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                            <DialogDescription>
                                {isEditProjectModalOpen ? 'Update the project details below.' : 'Define the project details to start allocating resources.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Project Name</Label>
                                <Input
                                    value={currentProjectForm.name}
                                    onChange={(e) => setCurrentProjectForm({ ...currentProjectForm, name: e.target.value })}
                                    placeholder="e.g. Mobile App Revamp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={currentProjectForm.description}
                                    onChange={(e) => setCurrentProjectForm({ ...currentProjectForm, description: e.target.value })}
                                    placeholder="Brief overview of the project..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !currentProjectForm.startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {currentProjectForm.startDate ? format(currentProjectForm.startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={currentProjectForm.startDate} onSelect={(date) => setCurrentProjectForm({ ...currentProjectForm, startDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !currentProjectForm.endDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {currentProjectForm.endDate ? format(currentProjectForm.endDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={currentProjectForm.endDate} onSelect={(date) => setCurrentProjectForm({ ...currentProjectForm, endDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            {isEditProjectModalOpen && (
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={currentProjectForm.status}
                                        onValueChange={(val: any) => setCurrentProjectForm({ ...currentProjectForm, status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsCreateModalOpen(false);
                                setIsEditProjectModalOpen(false);
                                resetProjectForm();
                            }}>Cancel</Button>
                            <Button
                                onClick={isEditProjectModalOpen ? handleUpdateProject : handleCreateProject}
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditProjectModalOpen ? 'Update Project' : 'Create Project')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Member & Task Modal */}
                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Team Member</DialogTitle>
                            <DialogDescription>Create a task and assign an employee to it.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Task Name</Label>
                                <Input
                                    value={newAssignment.taskName}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, taskName: e.target.value })}
                                    placeholder="e.g. Develop Backend API"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Select Employee</Label>
                                <Select onValueChange={(val) => setNewAssignment({ ...newAssignment, employeeId: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fname} {emp.lname}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newAssignment.startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newAssignment.startDate ? format(newAssignment.startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={newAssignment.startDate} onSelect={(date) => setNewAssignment({ ...newAssignment, startDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newAssignment.endDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newAssignment.endDate ? format(newAssignment.endDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={newAssignment.endDate} onSelect={(date) => setNewAssignment({ ...newAssignment, endDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssignMember} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign Member'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => !open && setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {deleteConfirmation.type === 'project'
                                    ? "This action cannot be undone. This will permanently delete the project and all associated tasks and allocations."
                                    : "Are you sure you want to remove this team member from the task?"}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </DashboardLayout>
    );
};

export default ResourceAllocation;
