import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HRFilters, FilterOptions } from '@/components/hr-attendance/HRFilters';
import { HRAttendanceTable, EmployeeAttendanceRow } from '@/components/hr-attendance/HRAttendanceTable';
import { HRAttendanceDetailPanel, EmployeeAttendanceDetail } from '@/components/hr-attendance/HRAttendanceDetailPanel';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceStatus } from '@/components/attendance/StatusBadge';

// Generate mock employee attendance data
const generateMockHRData = (): EmployeeAttendanceRow[] => {
  const employees = [
    { id: 'EMP1001', name: 'Sarah Johnson', dept: 'Engineering', avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100' },
    { id: 'EMP1002', name: 'Michael Chen', dept: 'Marketing', avatar: 'https://images.unsplash.com/photo-1698986668651-295fda8e61bc?w=100' },
    { id: 'EMP1003', name: 'Emily Davis', dept: 'HR', avatar: 'https://images.unsplash.com/photo-1621857387607-3511f7cb033a?w=100' },
    { id: 'EMP1004', name: 'James Wilson', dept: 'Sales', avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100' },
    { id: 'EMP1005', name: 'Lisa Anderson', dept: 'Finance', avatar: 'https://images.unsplash.com/photo-1698986668651-295fda8e61bc?w=100' },
    { id: 'EMP1006', name: 'David Martinez', dept: 'Engineering', avatar: 'https://images.unsplash.com/photo-1621857387607-3511f7cb033a?w=100' },
    { id: 'EMP1007', name: 'Jessica Brown', dept: 'Marketing', avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100' },
    { id: 'EMP1008', name: 'Robert Taylor', dept: 'Operations', avatar: 'https://images.unsplash.com/photo-1698986668651-295fda8e61bc?w=100' },
  ];

  const records: EmployeeAttendanceRow[] = [];
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    employees.forEach((emp, idx) => {
      const statuses: AttendanceStatus[] = ['present', 'late', 'present', 'present', 'flagged'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-100
      
      const checkInHour = status === 'late' ? 9 : 8;
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkOutHour = 17 + Math.floor(Math.random() * 2);
      const checkOutMinute = Math.floor(Math.random() * 60);
      
      records.push({
        id: `att-${date.getTime()}-${emp.id}`,
        date: date.toISOString().split('T')[0],
        employeeId: emp.id,
        employeeName: emp.name,
        employeeAvatar: emp.avatar,
        department: emp.dept,
        checkIn: `${checkInHour}:${String(checkInMinute).padStart(2, '0')} ${checkInHour < 12 ? 'AM' : 'PM'}`,
        checkOut: `${checkOutHour > 12 ? checkOutHour - 12 : checkOutHour}:${String(checkOutMinute).padStart(2, '0')} PM`,
        faceImageUrl: emp.avatar,
        confidence,
        device: `Terminal ${String.fromCharCode(65 + (idx % 3))}`,
        location: `Floor ${Math.floor(idx / 3) + 1}`,
        status,
        needsReview: confidence < 85 || status === 'flagged',
      });
    });
  }

  return records;
};

export function HRAttendanceManagement() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeAttendanceDetail | null>(null);
  const [attendanceData, setAttendanceData] = useState(generateMockHRData());
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    department: 'All',
    status: 'all',
    confidenceThreshold: 0,
    dateFrom: undefined,
    dateTo: undefined,
  });

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
    setSelectedRecord({
      ...row,
      employeePhotoUrl: row.employeeAvatar,
      email: `${row.employeeName.toLowerCase().replace(' ', '.')}@company.com`,
      position: 'Senior Engineer',
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

  const handleMarkReviewed = (id: string) => {
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === id ? { ...record, needsReview: false } : record
      )
    );
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

  const handleSaveDetail = (updatedData: Partial<EmployeeAttendanceDetail>, hrNote: string) => {
    if (!selectedRecord) return;
    
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, ...updatedData, needsReview: false }
          : record
      )
    );
    
    toast.success('Record updated successfully', {
      description: 'Audit trail has been recorded.',
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}</span>
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

        {/* Filters */}
        <div className="mb-6">
          <HRFilters 
            filters={filters}
            onFilterChange={setFilters}
            onExport={handleExport}
            onReset={handleResetFilters}
          />
        </div>

        {/* Tabs */}
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
