import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HRFilters, FilterOptions } from '@/components/hr-attendance/HRFilters';
import { HRAttendanceTable, EmployeeAttendanceRow } from '@/components/hr-attendance/HRAttendanceTable';
import { Button } from '@/components/ui/button';
import { Users, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceStatus } from '@/components/attendance/StatusBadge';
import payrollService, { EmployeeAttendance, PaginatedResponse } from '@/services/payrollService';


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

// Calculate attendance status - Simplified: has check-in = present, no check-in = absent
const calculateStatus = (checkIn: string | null | undefined): AttendanceStatus => {
  return checkIn ? 'present' : 'absent';
};

// Transform API attendance data to component format
// Uses embedded employee_details from the API response - no extra API calls needed
const transformAttendanceData = (attendanceRecords: EmployeeAttendance[]): EmployeeAttendanceRow[] => {
  return attendanceRecords.map((record) => {
    // Use employee_details directly from the attendance response
    const details = record.employee_details;
    const employeeName = details
      ? `${details.fname || ''} ${details.lname || ''}`.trim() || 'Unknown Employee'
      : `Employee ${record.employee}`;

    const employeeId = `EMP${String(record.employee).padStart(4, '0')}`;
    const department = details?.department || 'Unknown';
    const employeeAvatar = details?.avatar || undefined;

    // Format times
    const checkIn = formatTime(record.check_in);
    const checkOut = formatTime(record.check_out);

    // Calculate status - simple: has check-in = present
    const status = calculateStatus(record.check_in);

    return {
      id: `att-${record.id}-${record.employee}-${record.date}`,
      date: record.date,
      employeeId,
      employeeName,
      employeeAvatar,
      department,
      checkIn,
      checkOut,
      faceImageUrl: record.photo || undefined,
      confidence: undefined,
      device: undefined,
      location: record.geo_location || undefined,
      status,
      needsReview: false,
    };
  });
};

export function HRAttendanceManagement() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Initialize with Today
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    return {
      dateFrom: new Date(formatDate(today)),
      dateTo: new Date(formatDate(today)),
    };
  });

  // Fetch attendance data from API
  const fetchAttendanceData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Prepare filters for API
      const apiFilters: Record<string, unknown> = {
        page: currentPage,
        page_size: pageSize,
      };

      const dateFromStr = filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : null;
      const dateToStr = filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : null;

      if (dateFromStr) {
        apiFilters.date_from = dateFromStr;
      }
      if (dateToStr) {
        apiFilters.date_to = dateToStr;
      }

      console.log('📅 Fetching attendance with filters:', { dateFromStr, dateToStr, apiFilters });

      // Fetch attendance records (employee_details is included in response)
      const response = await payrollService.listAttendance(apiFilters as Parameters<typeof payrollService.listAttendance>[0]);

      let attendanceRecords: EmployeeAttendance[] = [];

      if (Array.isArray(response)) {
        attendanceRecords = response;
      } else {
        attendanceRecords = response.results;
      }

      console.log('📥 Raw API response:', attendanceRecords.length, 'records');

      // DEBUG: Log unique employees in the response to detect backend filtering
      const uniqueEmployeeIds = [...new Set(attendanceRecords.map(r => r.employee))];
      const uniqueEmployeeNames = attendanceRecords
        .filter((r, i, arr) => arr.findIndex(a => a.employee === r.employee) === i)
        .map(r => `${r.employee_details?.fname || ''} ${r.employee_details?.lname || ''} (ID: ${r.employee})`.trim());

      console.log('👥 Unique employees in response:', uniqueEmployeeIds.length, 'employees:', uniqueEmployeeNames);

      // WARN if backend seems to be filtering to single employee
      if (uniqueEmployeeIds.length === 1 && attendanceRecords.length > 0) {
        console.warn('⚠️ Backend returned records for only 1 employee. This may indicate backend filtering by company/user.');
        console.warn('⚠️ Ensure the backend /payroll/attendance/ endpoint returns ALL employees for HR role.');
      }

      // CLIENT-SIDE DATE FILTERING (safeguard since backend filtering may not work properly)
      // Filter records to only include those within the selected date range
      let filteredRecords = attendanceRecords;
      if (dateFromStr || dateToStr) {
        filteredRecords = attendanceRecords.filter((record) => {
          const recordDate = record.date; // Already in YYYY-MM-DD format
          if (dateFromStr && recordDate < dateFromStr) return false;
          if (dateToStr && recordDate > dateToStr) return false;
          return true;
        });
        console.log('🔍 After client-side date filtering:', filteredRecords.length, 'records (from', dateFromStr, 'to', dateToStr, ')');
      }

      // Update total counts based on filtered records
      setTotalRecords(filteredRecords.length);
      setTotalPages(Math.ceil(filteredRecords.length / pageSize) || 1);

      // Transform data - uses employee_details from response, no extra API calls
      const transformed = transformAttendanceData(filteredRecords);

      console.log('✅ Transformed attendance data:', transformed.map(r => ({
        id: r.id,
        date: r.date,
        employee: r.employeeName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status
      })));

      // Sort by date (newest first)
      transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAttendanceData(transformed);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load attendance data';
      setError(errorMessage);
      console.error('❌ Error fetching attendance:', errorMessage, err);

      if (showLoading) {
        toast.error('Failed to load attendance data', { description: errorMessage });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, filters.dateFrom, filters.dateTo]);


  // Fetch data when filters or page changes
  useEffect(() => {
    // We exclude fetchAttendanceData from dependencies to avoid loops when employees state changes.
    // fetchAttendanceData handles fetching employees internally if they are missing.
    fetchAttendanceData(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filters.dateFrom, filters.dateTo]);


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

  // Filter data based on filters (date filtering is now done in fetchAttendanceData)
  // This memo is kept for potential future filters (e.g., department, status, search)
  const filteredData = useMemo(() => {
    // Date filtering is already done in fetchAttendanceData
    // Just return the data directly for now
    return attendanceData;
  }, [attendanceData]);


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



  const handleResetFilters = () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    setFilters({
      dateFrom: new Date(formatDate(today)),
      dateTo: new Date(formatDate(today)),
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        {/* Header with Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Attendance Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage employee attendance records.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchAttendanceData(true)}
              disabled={loading}
              className="hover:bg-primary/5 hover:border-primary/30 transition-all w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters - Enhanced styling */}
          <HRFilters
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Loading State */}
        {loading && attendanceData.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Loading attendance data...</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch the records</p>
                </div>
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

        {/* Attendance Records Table */}
        {!loading && (
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-muted/30 to-muted/10 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  All Records
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {totalRecords}
                  </span>
                </CardTitle>
                {selectedRows.size > 0 && (
                  <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {selectedRows.size} selected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <HRAttendanceTable
                  data={filteredData}
                  selectedRows={selectedRows}
                  onRowSelect={handleRowSelect}
                  onSelectAll={handleSelectAll}
                />
              </ScrollArea>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                  <span className="font-medium text-foreground">{totalRecords}</span> records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hover:bg-primary/5"
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-3 py-1 rounded-md bg-muted/50">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="hover:bg-primary/5"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
      </div>
    </DashboardLayout>
  );
}
