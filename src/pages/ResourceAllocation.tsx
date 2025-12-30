import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Plus, Briefcase, Layers, Users, CheckCircle2, MoreVertical, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Types ---
interface Project {
    id: string;
    name: string;
    description: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    status: 'active' | 'completed' | 'on-hold';
    assignments: Assignment[];
}

interface Assignment {
    id: string;
    employeeId: string;
    employeeName: string;
    role: string;
    task: string;
    progress: number;
}

// Mock Employees Data
const MOCK_EMPLOYEES = [
    { id: '1', name: 'Alice Johnson', role: 'Frontend Developer', avatar: '' },
    { id: '2', name: 'Bob Smith', role: 'Backend Developer', avatar: '' },
    { id: '3', name: 'Charlie Brown', role: 'UI/UX Designer', avatar: '' },
    { id: '4', name: 'Diana Prince', role: 'Project Manager', avatar: '' },
    { id: '5', name: 'Evan Wright', role: 'QA Engineer', avatar: '' },
];

const ResourceAllocation = () => {
    // State
    const [projects, setProjects] = useState<Project[]>([
        {
            id: '1',
            name: 'Website Redesign',
            description: 'Revamping the corporate website with new branding.',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: 'active',
            assignments: [
                { id: '101', employeeId: '1', employeeName: 'Alice Johnson', role: 'Frontend Developer', task: 'Implement Landing Page', progress: 45 },
                { id: '102', employeeId: '3', employeeName: 'Charlie Brown', role: 'UI/UX Designer', task: 'Design System', progress: 80 },
            ]
        }
    ]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Form State for New Project
    const [newProject, setNewProject] = useState<Partial<Project>>({
        name: '',
        description: '',
        startDate: undefined,
        endDate: undefined,
        status: 'active'
    });

    // Form State for New Assignment
    const [newAssignment, setNewAssignment] = useState({
        employeeId: '',
        task: '',
    });

    // --- Handlers ---

    const handleCreateProject = () => {
        if (!newProject.name || !newProject.startDate) return; // Basic validation

        const project: Project = {
            id: Math.random().toString(36).substr(2, 9),
            name: newProject.name,
            description: newProject.description || '',
            startDate: newProject.startDate,
            endDate: newProject.endDate,
            status: 'active',
            assignments: []
        };

        setProjects([...projects, project]);
        setIsCreateModalOpen(false);
        setNewProject({ name: '', description: '', startDate: undefined, endDate: undefined, status: 'active' });
    };

    const handleAssignMember = () => {
        if (!selectedProject || !newAssignment.employeeId || !newAssignment.task) return;

        const employee = MOCK_EMPLOYEES.find(e => e.id === newAssignment.employeeId);
        if (!employee) return;

        const assignment: Assignment = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: employee.id,
            employeeName: employee.name,
            role: employee.role,
            task: newAssignment.task,
            progress: 0
        };

        const updatedProjects = projects.map(p => {
            if (p.id === selectedProject.id) {
                return { ...p, assignments: [...p.assignments, assignment] };
            }
            return p;
        });

        setProjects(updatedProjects);
        // Update selected project view instantly
        setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
        setIsAssignModalOpen(false);
        setNewAssignment({ employeeId: '', task: '' });
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
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Project
                    </Button>
                </div>

                {/* Filters / Search Bar (Visual only for now) */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search projects..." className="pl-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                    <Button variant="outline" className="gap-2 text-gray-600">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Project List Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-500" /> Active Projects
                        </h2>
                        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                            {projects.map((project) => (
                                <Card
                                    key={project.id}
                                    onClick={() => setSelectedProject(project)}
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
                                                {project.startDate ? format(project.startDate, 'MMM d') : ''}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5" />
                                                {project.assignments.length} members
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Project Detail & Allocation Column */}
                    <div className="lg:col-span-2">
                        {selectedProject ? (
                            <Card className="h-full border-0 shadow-xl shadow-gray-200/50 bg-white ring-1 ring-gray-100 flex flex-col">
                                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white pb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-gray-900">{selectedProject.name}</CardTitle>
                                            <CardDescription className="text-base mt-2">{selectedProject.description}</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-6 mt-4 text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-semibold">Start Date</span>
                                            <span className="font-medium">{selectedProject.startDate ? format(selectedProject.startDate, 'PPP') : 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-semibold">End Date</span>
                                            <span className="font-medium">{selectedProject.endDate ? format(selectedProject.endDate, 'PPP') : 'N/A'}</span>
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

                                    {selectedProject.assignments.length === 0 ? (
                                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            <Users className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No team members assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedProject.assignments.map((assign) => (
                                                <div key={assign.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="h-10 w-10 border border-gray-100">
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-700">{assign.employeeName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{assign.employeeName}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{assign.role}</p>
                                                            <div className="mt-3 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Assigned Task</p>
                                                                <p className="text-sm font-medium text-gray-800">{assign.task}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Progress Circle Mock */}
                                                    <div className="relative h-10 w-10 flex items-center justify-center rounded-full border-2 border-indigo-100 bg-indigo-50/50">
                                                        <span className="text-[10px] font-bold text-indigo-700">{assign.progress}%</span>
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

                {/* Create Project Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>Define the project details to start allocating resources.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Project Name</Label>
                                <Input
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="e.g. Mobile App Revamp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Brief overview of the project..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newProject.startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newProject.startDate ? format(newProject.startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={newProject.startDate} onSelect={(date) => setNewProject({ ...newProject, startDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newProject.endDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newProject.endDate ? format(newProject.endDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={newProject.endDate} onSelect={(date) => setNewProject({ ...newProject, endDate: date })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700">Create Project</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Member Modal */}
                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Team Member</DialogTitle>
                            <DialogDescription>Select an employee and assign a specific task.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Employee</Label>
                                <Select onValueChange={(val) => setNewAssignment({ ...newAssignment, employeeId: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOCK_EMPLOYEES.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name} - {emp.role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Task / Responsibility</Label>
                                <Input
                                    value={newAssignment.task}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, task: e.target.value })}
                                    placeholder="e.g. Design Database Schema"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssignMember} className="bg-indigo-600 hover:bg-indigo-700">Assign Member</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default ResourceAllocation;
