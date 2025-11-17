import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download, Eye, Edit, Trash2, Plus, Users, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from '@/layouts/DashboardLayout';
import { employeeService, Employee } from '@/services/employeeService';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Employees = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const data = await employeeService.getEmployees();
            setEmployees(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch employees",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "text/csv") {
            try {
                setIsImporting(true);
                const result = await employeeService.importEmployees(file);
                if (result.success) {
                    toast({
                        title: "Success",
                        description: result.message,
                    });
                    // Refresh the employee list
                    fetchEmployees();
                } else {
                    toast({
                        title: "Import Failed",
                        description: result.message,
                        variant: "destructive",
                    });
                }
            } catch (error) {
                toast({
                    title: "Server Error",
                    description: "Could not connect to the server",
                    variant: "destructive",
                });
            } finally {
                setIsImporting(false);
            }
        } else {
            toast({
                title: "Invalid File",
                description: "Please select a valid CSV file",
                variant: "destructive",
            });
        }
        e.target.value = "";
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            // Simulate export delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast({
                title: "Export Successful",
                description: "Employee data exported to CSV successfully!",
            });
        } catch (error) {
            toast({
                title: "Export Failed",
                description: "Failed to export employee data",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const filteredEmployees = employees.filter(employee =>
        (employee.fname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.lname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.phone || '').includes(searchQuery)
    );

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const LoadingSkeleton = () => (
        <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-[#5C5470] to-[#352F44] rounded-xl">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
                            <p className="text-gray-600">Manage your workforce efficiently</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        
                        {/* <Button
                            variant="outline"
                            className="flex items-center gap-2 border-[#5C5470] text-[#5C5470] hover:bg-[#5C5470] hover:text-white transition-all duration-300"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <div className="w-4 h-4 border-2 border-[#5C5470] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export'}
                        </Button> */}
                        
                        <Button
                            className="flex items-center gap-2 bg-gradient-to-r from-[#5C5470] to-[#352F44] hover:from-[#352F44] hover:to-[#5C5470] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={handleImport}
                            disabled={isImporting}
                        >
                            {isImporting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isImporting ? 'Importing...' : 'Import Employees'}
                        </Button>
                        
                        <Button className="flex items-center gap-2 bg-[#5C5470] hover:bg-[#352F44] text-white shadow-lg hover:shadow-xl transition-all duration-300">
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Total Employees</p>
                                    <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
                                </div>
                                <div className="p-3 bg-blue-500 rounded-full">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Active</p>
                                    <p className="text-2xl font-bold text-green-900">{employees.length}</p>
                                </div>
                                <div className="p-3 bg-green-500 rounded-full">
                                    <div className="w-6 h-6 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600">Departments</p>
                                    <p className="text-2xl font-bold text-purple-900">{new Set(employees.map(e => e.branch)).size}</p>
                                </div>
                                <div className="p-3 bg-purple-500 rounded-full">
                                    <Filter className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-600">Companies</p>
                                    <p className="text-2xl font-bold text-orange-900">{new Set(employees.map(e => e.company)).size}</p>
                                </div>
                                <div className="p-3 bg-orange-500 rounded-full">
                                    <div className="w-6 h-6 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Employees Table */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#5C5470] to-[#352F44] text-white">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Employee Directory
                                </CardTitle>
                                <CardDescription className="text-white/80">
                                    Manage and view all employee information
                                </CardDescription>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search employees by name, email, or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 transition-all duration-300"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-white/80">
                                    <span>Found {filteredEmployees.length} employees</span>
                                    {searchQuery && (
                                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                            Filtered
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6">
                                <LoadingSkeleton />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4">ID</TableHead>
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4">Employee</TableHead>
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4">Contact</TableHead>
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4">Company</TableHead>
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4">Branch</TableHead>
                                            <TableHead className="font-semibold text-gray-700 px-6 py-4 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEmployees.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12">
                                                    <div className="flex flex-col items-center space-y-3">
                                                        <Users className="w-12 h-12 text-gray-400" />
                                                        <p className="text-lg font-medium text-gray-600">No employees found</p>
                                                        <p className="text-gray-500">
                                                            {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first employee'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEmployees.map((employee, index) => (
                                                <TableRow 
                                                    key={employee.id} 
                                                    className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                                                >
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-[#5C5470]/10 text-[#5C5470] border-[#5C5470]/20">
                                                            #{employee.id}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-[#5C5470] to-[#352F44] rounded-full flex items-center justify-center text-white font-semibold">
                                                                {(employee.fname || 'U').charAt(0)}{(employee.lname || 'N').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {`${employee.fname || 'Unknown'} ${employee.lname || 'User'}`}
                                                                </p>
                                                                <p className="text-sm text-gray-500">Employee</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{employee.email || 'No email'}</p>
                                                            <p className="text-sm text-gray-500">{employee.phone || 'No phone'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            {employee.company || 'No company'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                            {employee.branch || 'No branch'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                                                                title="Edit Employee"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                                                title="Delete Employee"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Employees; 