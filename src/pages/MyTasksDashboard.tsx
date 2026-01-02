import React, { useState, useEffect } from 'react';
import { employeeTaskService, EmployeeProject } from '@/services/employeeTaskService';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MyTasksDashboard = () => {
    const [projects, setProjects] = useState<EmployeeProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

    useEffect(() => {
        fetchMyTasks();
    }, []);

    const fetchMyTasks = async () => {
        setIsLoading(true);
        try {
            const data = await employeeTaskService.getMyTasks();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            toast.error('Failed to load your tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (allocationId: number, newStatus: 'todo' | 'inprogress' | 'done', projectId: number) => {
        setUpdatingTaskId(allocationId);
        try {
            await employeeTaskService.updateTaskStatus(allocationId, newStatus);

            // Update local state
            setProjects(prevProjects => prevProjects.map(project => {
                if (project.project_id === projectId) {
                    return {
                        ...project,
                        tasks: project.tasks.map(task =>
                            task.allocation_id === allocationId
                                ? { ...task, task_status: newStatus }
                                : task
                        )
                    };
                }
                return project;
            }));

            toast.success(`Task status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update task status');
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'done': return 'success';
            case 'inprogress': return 'warning';
            case 'todo': return 'default';
            default: return 'outline';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
            case 'inprogress': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
            case 'todo': return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 p-6 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-indigo-600" />
                            My Tasks
                        </h1>
                        <p className="text-gray-500 mt-1">Track and update your assigned project tasks.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchMyTasks}
                        disabled={isLoading}
                        className="bg-white"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Refresh
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Tasks Assigned</h3>
                        <p className="text-gray-500 mt-1">You don't have any active tasks assigned to you right now.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {projects.map((project) => (
                            <Card key={project.project_id} className="border-0 shadow-sm ring-1 ring-gray-200 bg-white overflow-hidden">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold text-gray-900">{project.project_name}</CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>{format(new Date(project.start_date || new Date()), 'MMM d, yyyy')} - {format(new Date(project.end_date || new Date()), 'MMM d, yyyy')}</span>
                                                <Badge variant="outline" className="ml-2 uppercase text-xs font-semibold bg-white">{project.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {project.tasks.map((task) => (
                                            <div key={task.allocation_id} className="p-6 hover:bg-gray-50/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-start justify-between lg:justify-start lg:gap-3">
                                                        <h4 className="font-semibold text-gray-900 text-lg">{task.task_name}</h4>
                                                        <Badge className={cn("capitalize px-2.5 py-0.5", getStatusColor(task.task_status))}>
                                                            {task.task_status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {format(new Date(task.allocation_start), 'MMM d')} → {format(new Date(task.allocation_end), 'MMM d')}
                                                        </span>
                                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border",
                                                            task.allocation_status === 'active' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"
                                                        )}>
                                                            {task.allocation_status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2 lg:pt-0">
                                                    <span className="text-sm font-medium text-gray-500 mr-2">Update Status:</span>
                                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => handleStatusChange(task.allocation_id, 'todo', project.project_id)}
                                                            disabled={updatingTaskId === task.allocation_id}
                                                            className={cn(
                                                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                                task.task_status === 'todo' || !task.task_status
                                                                    ? "bg-white text-gray-700 shadow-sm"
                                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                                            )}
                                                        >
                                                            To Do
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(task.allocation_id, 'inprogress', project.project_id)}
                                                            disabled={updatingTaskId === task.allocation_id}
                                                            className={cn(
                                                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                                task.task_status === 'inprogress'
                                                                    ? "bg-white text-blue-600 shadow-sm"
                                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                                            )}
                                                        >
                                                            In Progress
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(task.allocation_id, 'done', project.project_id)}
                                                            disabled={updatingTaskId === task.allocation_id}
                                                            className={cn(
                                                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                                task.task_status === 'done'
                                                                    ? "bg-white text-green-600 shadow-sm"
                                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                                            )}
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyTasksDashboard;
