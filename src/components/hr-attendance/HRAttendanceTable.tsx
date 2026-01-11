import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { StatusBadge, AttendanceStatus } from '../attendance/StatusBadge';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Users } from 'lucide-react';

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
}

export function HRAttendanceTable({
  data,
  selectedRows,
  onRowSelect,
  onSelectAll,
}: HRAttendanceTableProps) {
  const allSelected = data.length > 0 && selectedRows.size === data.length;

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="font-semibold text-foreground/80">Date</TableHead>
            <TableHead className="font-semibold text-foreground/80">Employee</TableHead>
            <TableHead className="font-semibold text-foreground/80">Department</TableHead>
            <TableHead className="font-semibold text-foreground/80">Check In</TableHead>
            <TableHead className="font-semibold text-foreground/80">Check Out</TableHead>
            <TableHead className="font-semibold text-foreground/80">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <span>No attendance records found</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={row.id}
                className={`
                  transition-all duration-200 
                  ${selectedRows.has(row.id) ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
                  ${index % 2 === 0 ? 'bg-muted/20' : 'bg-background'}
                  hover:bg-primary/5 hover:shadow-sm
                `}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => onRowSelect(row.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {new Date(row.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                      <AvatarImage src={row.employeeAvatar} alt={row.employeeName} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {row.employeeName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{row.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{row.employeeId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-muted/50 font-normal">{row.department}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={row.checkIn ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                    {row.checkIn || '-'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={row.checkOut ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                    {row.checkOut || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} size="sm" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
