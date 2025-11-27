import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaceThumbnail } from '../attendance/FaceThumbnail';
import { StatusBadge, AttendanceStatus } from '../attendance/StatusBadge';
import { ConfidenceBadge } from '../attendance/ConfidenceBadge';
import { Button } from '../ui/button';
import { Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';

export interface EmployeeAttendanceRow {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  checkIn?: string;
  checkOut?: string;
  faceImageUrl?: string;
  confidence?: number;
  device?: string;
  location?: string;
  status: AttendanceStatus;
  needsReview: boolean;
}

interface HRAttendanceTableProps {
  data: EmployeeAttendanceRow[];
  selectedRows: Set<string>;
  onRowSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onViewDetail: (row: EmployeeAttendanceRow) => void;
  onMarkReviewed: (id: string) => void;
}

export function HRAttendanceTable({
  data,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onViewDetail,
  onMarkReviewed
}: HRAttendanceTableProps) {
  const allSelected = data.length > 0 && selectedRows.size === data.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>

            <TableHead>Device</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={`${row.needsReview ? 'bg-orange-50' : ''} ${selectedRows.has(row.id) ? 'bg-blue-50' : ''}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => onRowSelect(row.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={row.employeeAvatar} alt={row.employeeName} />
                      <AvatarFallback className="text-xs">
                        {row.employeeName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">{row.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{row.employeeId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.department}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.checkIn || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{row.checkOut || '-'}</TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {row.device || '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} size="sm" />
                </TableCell>
                <TableCell>
                  {row.needsReview ? (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Review
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      OK
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(row)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {row.needsReview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkReviewed(row.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
