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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Users, Filter, Briefcase, Building, Phone, Mail, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from '@/layouts/DashboardLayout';
import { employeeService, Employee, CompanyStats, CompanyRole } from '@/services/employeeService';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Employees = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [roles, setRoles] = useState<CompanyRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [roleUpdating, setRoleUpdating] = useState<Record<number, boolean>>({});
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 50;

    useEffect(() => {
        fetchData();
        fetchRoles();
    }, [currentPage]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await employeeService.getCompanyStatsAndUsers(currentPage, pageSize);
            setEmployees(data.results.employees);
            setStats(data.results.statistics);
            setTotalCount(data.count);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch employees and stats",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await employeeService.getCompanyRoles();
            setRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles", error);
        }
    };

    const handleRoleChange = async (userId: number, newRoleId: string) => {
        if (!newRoleId) return;
        const roleId = parseInt(newRoleId);

        // Find current user to check if they have a role
        const user = employees.find(e => e.id === userId);
        const hasRole = !!user?.role;

        // set per-row loading
        setRoleUpdating(prev => ({ ...prev, [userId]: true }));

        try {
            let result;
            if (hasRole) {
                result = await employeeService.updateUserRole(userId, roleId);
            } else {
                result = await employeeService.assignUserRole(userId, roleId);
            }

            toast({
                title: "Success",
                description: result.detail || "User role updated successfully",
            });

            // Refresh after update to reflect any server-side changes
            await fetchData();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update role",
                variant: "destructive",
            });
        } finally {
            setRoleUpdating(prev => ({ ...prev, [userId]: false }));
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
                    const { detail, message, total_rows } = result.data || {};
                    toast({
                        title: "Import Task Scheduled",
                        description: (
                            <div className="flex flex-col gap-1 mt-1">
                                <p className="font-medium">{detail || result.message}</p>
                                {message && <p className="text-sm text-gray-500">{message}</p>}
                                {total_rows && (
                                    <Badge variant="outline" className="w-fit mt-1">
                                        Processing {total_rows} rows
                                    </Badge>
                                )}
                            </div>
                        ),
                        duration: 6000,
                    });
                    // Refresh data after a delay
                    setTimeout(() => fetchData(), 2000);
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

    // Filter locally for now on top of the paginated list? 
    // The requirement said "search" is separate but "in the table u have to list all the fields... also this the paginated api".
    // Does the user want CLIENT-SIDE search on the current page or call the SEARCH api?
    // "stats of the company user api there are some other stats fields so use that... also this the paginated api so make sure to add the pagination logic as well on the table"
    // It doesn't explicitly mention the SEARCH API for the table filtering in this prompt. 
    // It says "u have to first call this api only not any other api".
    // So I should stick to the main listing API. 
    // I already have `filteredEmployees` in the previous code which did client-side filtering. 
    // I will keep client-side filtering for the current page contents if needed, or just remove search if it conflicts with "only call this api". 
    // But usually search is good. I'll implement client-side filtering for the CURRENT PAGE to keep it simple and compliant with "only call this api".

    const filteredEmployees = employees.filter(employee =>
        (employee.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.phone || '').includes(searchQuery)
    );

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

    const totalPages = Math.ceil(totalCount / pageSize);

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
                            <p className="text-gray-600">Company Overview & Directory</p>
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
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Total Employees</p>
                                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total_employees}</p>
                                    </div>
                                    <div className="p-3 bg-blue-500 rounded-full shadow-md">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600">Active Employees</p>
                                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.active_employees}</p>
                                    </div>
                                    <div className="p-3 bg-green-500 rounded-full shadow-md">
                                        <div className="w-6 h-6 border-4 border-white rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600">Departments</p>
                                        <p className="text-3xl font-bold text-purple-900 mt-2">{stats.departments_count}</p>
                                    </div>
                                    <div className="p-3 bg-purple-500 rounded-full shadow-md">
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-600">Branches</p>
                                        <p className="text-3xl font-bold text-orange-900 mt-2">{stats.branches_count}</p>
                                    </div>
                                    <div className="p-3 bg-orange-500 rounded-full shadow-md">
                                        <Building className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                                    Manage roles and view details
                                </CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Filter current page..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 transition-all duration-300"
                                    />
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
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">ID</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Employee</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Contact</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Role</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Department</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Branch</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Status</TableHead>
                                                <TableHead className="font-semibold text-gray-700 px-6 py-4 whitespace-nowrap">Joined</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmployees.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-12">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <Users className="w-12 h-12 text-gray-400" />
                                                            <p className="text-lg font-medium text-gray-600">No employees found</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredEmployees.map((employee) => (
                                                    <TableRow
                                                        key={employee.id}
                                                        className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                                                    >
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="font-mono text-gray-500">#{employee.id}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-[#5C5470] to-[#352F44] rounded-full flex items-center justify-center text-white font-semibold">
                                                                    {(employee.name || 'U').charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {employee.name || 'Unknown User'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Mail className="w-3 h-3" />
                                                                    {employee.email || 'No email'}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Phone className="w-3 h-3" />
                                                                    {employee.phone || 'No phone'}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <Select
                                                                value={employee.role?.id.toString() || ""}
                                                                onValueChange={(value) => handleRoleChange(employee.id, value)}
                                                                disabled={!!roleUpdating[employee.id]}
                                                            >
                                                                <SelectTrigger className="w-[180px]">
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <SelectValue placeholder={roleUpdating[employee.id] ? "Updating..." : "Select Role"} />
                                                                        {roleUpdating[employee.id] && (
                                                                            <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                                        )}
                                                                    </div>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {roles.map((role) => (
                                                                        <SelectItem key={role.id} value={role.id.toString()}>
                                                                            {role.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                {employee.department_name || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {employee.branch_name || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <Badge className={
                                                                employee.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                            }>
                                                                {employee.status || 'Unknown'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <CalendarIcon className="w-4 h-4" />
                                                                {employee.joining_date || '-'}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing page {currentPage} of {totalPages} ({totalCount} entries)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Employees;
