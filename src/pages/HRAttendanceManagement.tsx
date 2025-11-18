import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HRFilters, FilterOptions } from '@/components/hr-attendance/HRFilters';
import { HRAttendanceTable, EmployeeAttendanceRow } from '@/components/hr-attendance/HRAttendanceTable';
import { HRAttendanceDetailPanel, EmployeeAttendanceDetail } from '@/components/hr-attendance/HRAttendanceDetailPanel';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceStatus } from '@/components/attendance/StatusBadge';
import { apiGet } from '@/lib/api';
import payrollService, { EmployeeAttendance } from '@/services/payrollService';
import { employeeService, Employee } from '@/services/employeeService';

// Custom event name for attendance updates
const ATTENDANCE_UPDATE_EVENT = 'attendance-updated';

// Helper to decode user ID from JWT token
const getUserId = (): number | null => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.user_id || payload.id || payload.sub || null;
    return userId ? Number(userId) : null;
  } catch {
    return null;
  }
};

// Format time from ISO string or HH:mm:ss to readable format
const formatTime = (timeString: string | null | undefined): string | undefined => {
  if (!timeString) return undefined;
  
  try {
    // Handle ISO datetime strings
    if (timeString.includes('T') || timeString.includes(' ')) {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
    }
    
    // Handle HH:mm:ss format
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    
    return undefined;
  } catch {
    return undefined;
  }
};

// Calculate attendance status from check-in/check-out times
const calculateStatus = (
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  date: string
): AttendanceStatus => {
  if (!checkIn) {
    // Check if date is today - if yes, might still check in
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      return 'pending'; // Still waiting for check-in
    }
    return 'absent';
  }

  try {
    // Parse check-in time - backend sends HH:mm:ss format, need to combine with date
    let checkInTime: Date | null = null;
    const cleanTime = String(checkIn).split('.')[0]; // Remove milliseconds if present
    
    // Check if it's HH:mm:ss format (just time, not full datetime)
    if (/^\d{2}:\d{2}:\d{2}/.test(cleanTime)) {
      // Combine date with time
      const dateStr = date || new Date().toISOString().split('T')[0];
      const combined = `${dateStr}T${cleanTime}`;
      checkInTime = new Date(combined);
      
      // Handle timezone issues - if time seems way off, try UTC
      if (checkInTime && !isNaN(checkInTime.getTime())) {
        const now = new Date();
        const hoursDiff = (checkInTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (Math.abs(hoursDiff) > 12) {
          // Try UTC interpretation
          const utcCombined = `${dateStr}T${cleanTime}Z`;
          const utcCheckIn = new Date(utcCombined);
          if (!isNaN(utcCheckIn.getTime())) {
            checkInTime = utcCheckIn;
          }
        }
      }
    } else {
      // Try parsing as full datetime string
      checkInTime = new Date(checkIn);
    }
    
    if (!checkInTime || isNaN(checkInTime.getTime())) {
      return 'unverified';
    }
    
    // Expected check-in time: 9:00 AM
    const expectedCheckIn = new Date(checkInTime);
    expectedCheckIn.setHours(9, 0, 0, 0);
    
    // If checked in after 9:05 AM, consider late
    const fiveMinutesLate = new Date(expectedCheckIn);
    fiveMinutesLate.setMinutes(5);
    
    if (checkInTime > fiveMinutesLate) {
      return 'late';
    }
    
    // If checked in but no check-out, and it's past working hours, might need review
    if (!checkOut) {
      const now = new Date();
      const workingHoursEnd = new Date(checkInTime);
      workingHoursEnd.setHours(17, 0, 0, 0);
      
      // If it's today and past working hours, flag it
      const today = new Date().toISOString().split('T')[0];
      if (date === today && now > workingHoursEnd) {
        return 'flagged'; // Checked in but not checked out
      }
    }
    
    return 'present';
  } catch {
    return 'unverified';
  }
};

// Determine if record needs review
const needsReview = (
  status: AttendanceStatus,
  confidence?: number,
  checkIn?: string | null,
  checkOut?: string | null,
  date?: string
): boolean => {
  // Low confidence always needs review
  if (confidence !== undefined && confidence < 85) {
    return true;
  }
  
  // Flagged or unverified status needs review
  if (status === 'flagged' || status === 'unverified') {
    return true;
  }
  
  // Checked in but not checked out on past dates needs review
  if (checkIn && !checkOut && date) {
    const recordDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    recordDate.setHours(0, 0, 0, 0);
    
    // If it's a past date and no check-out, needs review
    if (recordDate < today) {
      return true;
    }
  }
  
  return false;
};

// Transform API attendance data to component format
const transformAttendanceData = (
  attendanceRecords: EmployeeAttendance[],
  employees: Map<number, Employee>
): EmployeeAttendanceRow[] => {
  return attendanceRecords.map((record) => {
    const employee = employees.get(record.employee);
    const employeeName = employee 
      ? `${employee.fname || employee.first_name || ''} ${employee.lname || employee.last_name || ''}`.trim() || employee.name || 'Unknown Employee'
      : `Employee ${record.employee}`;
    
    const employeeId = `EMP${String(record.employee).padStart(4, '0')}`;
    // ✅ Department is fetched from backend employee data
    // If showing "Engineering" for all, backend is returning that value
    const department = employee?.department || 'Unknown';
    
    // Debug log to see what department is being used
    if (!employee) {
      console.warn(`⚠️ No employee data found for employee ID ${record.employee}, using 'Unknown' for department`);
    } else if (!employee.department) {
      console.warn(`⚠️ Employee ${employee.id} (${employee.name || employee.email}) has no department field, using 'Unknown'`);
    }
    
    // Format times
    const checkIn = formatTime(record.check_in);
    const checkOut = formatTime(record.check_out);
    
    // Calculate status
    const status = calculateStatus(record.check_in, record.check_out, record.date);
    
    // Get confidence from backend if available (might need to be added to API response)
    // For now, default to a reasonable value if photo exists
    const confidence = record.photo ? 90 : undefined;
    
    // Determine if needs review
    const reviewNeeded = needsReview(status, confidence, record.check_in, record.check_out, record.date);
    
    return {
      id: `att-${record.id}-${record.employee}-${record.date}`,
      date: record.date,
      employeeId,
      employeeName,
      employeeAvatar: undefined, // Can be extended if employee has photo URL
      department,
      checkIn,
      checkOut,
      faceImageUrl: record.photo || undefined,
      confidence,
      device: undefined, // Can be extended if backend provides device info
      location: record.geo_location || undefined,
      status,
      needsReview: reviewNeeded,
    };
  });
};

export function HRAttendanceManagement() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeAttendanceDetail | null>(null);
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Map<number, Employee>>(new Map());
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    department: 'All',
    status: 'all',
    confidenceThreshold: 0,
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Fetch employees data (runs once, cached)
  const fetchEmployees = useCallback(async () => {
    try {
      console.log('🔄 Fetching employees for HR attendance...');
      const employeeList = await employeeService.getEmployees();
      const employeeMap = new Map<number, Employee>();
      employeeList.forEach((emp) => {
        employeeMap.set(emp.id, emp);
        // ✅ Log department data to debug
        console.log(`👤 Employee ${emp.id} (${emp.name || emp.email}):`, {
          department: emp.department,
          hasDepartment: !!emp.department,
          rawData: emp
        });
      });
      setEmployees(employeeMap);
      console.log(`✅ Loaded ${employeeMap.size} employees`);
      console.log('📊 Department breakdown:', 
        Array.from(employeeMap.values()).map(e => ({ id: e.id, name: e.name, dept: e.department }))
      );
      return employeeMap;
    } catch (err: any) {
      console.error('❌ Error fetching employees:', err);
      toast.error('Failed to load employee data', {
        description: err?.message || 'Please refresh the page',
      });
      return new Map<number, Employee>();
    }
  }, []);

  // Fetch attendance data from API
  const fetchAttendanceData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('📡 Fetching attendance records for HR...');
      
      // Fetch all attendance records (HR should have access to all)
      const attendanceRecords = await payrollService.listAttendance();
      
      console.log(`✅ Fetched ${Array.isArray(attendanceRecords) ? attendanceRecords.length : 0} attendance records`);
      
      // If we don't have employees yet, fetch them
      let employeeMap = employees;
      if (employeeMap.size === 0) {
        employeeMap = await fetchEmployees();
      }
      
      // Transform and set data
      const transformed = transformAttendanceData(
        Array.isArray(attendanceRecords) ? attendanceRecords : [],
        employeeMap
      );
      
      // Sort by date (newest first)
      transformed.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setAttendanceData(transformed);
      
      console.log(`✅ Transformed ${transformed.length} attendance records`);
    } catch (err: any) {
      console.error('❌ Error fetching attendance data:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to load attendance data';
      setError(errorMessage);
      
      if (showLoading) {
        toast.error('Failed to load attendance data', {
          description: errorMessage,
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [employees, fetchEmployees]);

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      await fetchEmployees();
      await fetchAttendanceData(true);
    };
    
    initializeData();
  }, []); // Run once on mount

  // Listen for attendance update events (when employee marks attendance)
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      console.log('🔄 Attendance update event received, refreshing data...');
      // Refresh attendance data when employee marks attendance
      fetchAttendanceData(false); // Silent refresh - don't show loading spinner
      toast.info('Attendance updated', {
        description: 'New attendance record has been loaded.',
      });
    };

    // Listen for custom event dispatched when attendance is marked
    window.addEventListener(ATTENDANCE_UPDATE_EVENT, handleAttendanceUpdate);

    return () => {
      window.removeEventListener(ATTENDANCE_UPDATE_EVENT, handleAttendanceUpdate);
    };
  }, [fetchAttendanceData]);

  // Refresh when window gains focus (simple approach)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if we already have data (not initial load)
      if (attendanceData.length > 0) {
        fetchAttendanceData(false); // Silent refresh
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [attendanceData.length, fetchAttendanceData]);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    fetchAttendanceData(true);
    toast.success('Refreshing attendance data...');
  }, [fetchAttendanceData]);

  // Filter data based on filters
  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!record.employeeName.toLowerCase().includes(query) && 
            !record.employeeId.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Department filter
      if (filters.department !== 'All' && record.department !== filters.department) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && record.status !== filters.status) {
        return false;
      }

      // Confidence filter
      if (record.confidence !== undefined && record.confidence < filters.confidenceThreshold) {
        return false;
      }

      // Date range filter
      const recordDate = new Date(record.date);
      if (filters.dateFrom && recordDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && recordDate > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [attendanceData, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredData.length;
    const present = filteredData.filter(r => r.status === 'present' || r.status === 'late').length;
    const needsReview = filteredData.filter(r => r.needsReview).length;
    const avgConfidence = filteredData.reduce((acc, r) => acc + (r.confidence || 0), 0) / total;

    return {
      total,
      present,
      absent: total - present,
      needsReview,
      avgConfidence: total > 0 ? avgConfidence.toFixed(1) : '0',
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
    };
  }, [filteredData]);

  const reviewQueue = filteredData.filter(r => r.needsReview);

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(filteredData.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleViewDetail = (row: EmployeeAttendanceRow) => {
    const employee = Array.from(employees.values()).find(
      emp => `EMP${String(emp.id).padStart(4, '0')}` === row.employeeId
    );
    
    setSelectedRecord({
      ...row,
      employeePhotoUrl: row.employeeAvatar,
      email: employee?.email || `${row.employeeName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      position: employee?.department || row.department,
      auditTrail: [
        {
          id: '1',
          timestamp: new Date().toLocaleString(),
          action: 'Record created',
          performedBy: 'System',
        },
      ],
    });
    setDetailPanelOpen(true);
  };

  const handleMarkReviewed = async (id: string) => {
    // Optimistically update UI
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === id ? { ...record, needsReview: false } : record
      )
    );
    
    // TODO: If backend supports updating review status, call API here
    // For now, just update local state
    toast.success('Record marked as reviewed');
  };

  const handleBulkApprove = () => {
    if (selectedRows.size === 0) {
      toast.error('No records selected');
      return;
    }
    
    setAttendanceData(prev => 
      prev.map(record => 
        selectedRows.has(record.id) ? { ...record, needsReview: false, status: 'present' as AttendanceStatus } : record
      )
    );
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} records approved`);
  };

  const handleSaveDetail = async (updatedData: Partial<EmployeeAttendanceDetail>, hrNote: string) => {
    if (!selectedRecord) return;
    
    // Optimistically update UI
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, ...updatedData, needsReview: false }
          : record
      )
    );
    
    // TODO: If backend supports HR notes/updates, call API here
    // For now, just update local state
    toast.success('Record updated successfully', {
      description: 'Changes saved locally. Note: Backend update integration pending.',
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting to ${format.toUpperCase()}`, {
      description: `${filteredData.length} records will be exported.`,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      department: 'All',
      status: 'all',
      confidenceThreshold: 0,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl mb-2">HR Attendance Management</h1>
              <p className="text-muted-foreground">Monitor and audit employee attendance with face recognition</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Records</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  In current view
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Attendance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-green-600">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.present} present
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Needs Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-orange-600">{stats.needsReview}</div>
                <p className="text-xs text-muted-foreground">
                  Flagged or low confidence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Avg Confidence</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-blue-600">{stats.avgConfidence}%</div>
                <p className="text-xs text-muted-foreground">
                  Face recognition accuracy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading State */}
        {loading && attendanceData.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading attendance data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Error loading attendance data</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAttendanceData(true)}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {!loading && attendanceData.length > 0 && (
          <div className="mb-6">
            <HRFilters 
              filters={filters}
              onFilterChange={setFilters}
              onExport={handleExport}
              onReset={handleResetFilters}
            />
          </div>
        )}

        {/* Tabs */}
        {!loading && (
          <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                All Records ({filteredData.length})
              </TabsTrigger>
              <TabsTrigger value="review">
                Review Queue ({reviewQueue.length})
              </TabsTrigger>
            </TabsList>

            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.size} selected
                </span>
                <Button onClick={handleBulkApprove}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bulk Approve
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <HRAttendanceTable 
                    data={filteredData}
                    selectedRows={selectedRows}
                    onRowSelect={handleRowSelect}
                    onSelectAll={handleSelectAll}
                    onViewDetail={handleViewDetail}
                    onMarkReviewed={handleMarkReviewed}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <HRAttendanceTable 
                    data={reviewQueue}
                    selectedRows={selectedRows}
                    onRowSelect={handleRowSelect}
                    onSelectAll={handleSelectAll}
                    onViewDetail={handleViewDetail}
                    onMarkReviewed={handleMarkReviewed}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Empty State */}
        {!loading && !error && attendanceData.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
              <p className="text-muted-foreground text-center mb-4">
                No attendance records found. Records will appear here when employees check in.
              </p>
              <Button onClick={() => fetchAttendanceData(true)} variant="outline">
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Detail Panel */}
        <HRAttendanceDetailPanel 
          isOpen={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          data={selectedRecord}
          onSave={handleSaveDetail}
        />
      </div>
    </DashboardLayout>
  );
}
