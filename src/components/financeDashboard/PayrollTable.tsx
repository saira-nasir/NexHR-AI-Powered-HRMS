import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calculator, Download } from 'lucide-react';
import { Payroll, Payslip } from '@/services/payrollService';

type EmployeeMap = Record<number, { name: string; email?: string; department?: string }>;

interface PayrollTableProps {
  payrolls: Payroll[];
  payslips: Payslip[];
  employees?: EmployeeMap;
  onCalculate: (payrollId: number) => Promise<void> | void;
  onPay: (payrollId: number) => Promise<void> | void;
}

const PayrollTable: React.FC<PayrollTableProps> = ({ payrolls, payslips, employees = {}, onCalculate, onPay }) => {
  const findPayslip = (payrollId: number) => payslips.find(ps => ps.payroll === payrollId);

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <TableHead className="text-white font-semibold">Employee</TableHead>
            <TableHead className="text-white font-semibold">Period</TableHead>
            <TableHead className="text-right text-white font-semibold">Gross</TableHead>
            <TableHead className="text-right text-white font-semibold">Tax</TableHead>
            <TableHead className="text-right text-white font-semibold">Statutory</TableHead>
            <TableHead className="text-right text-white font-semibold">Deductions</TableHead>
            <TableHead className="text-right text-white font-semibold">Net</TableHead>
            <TableHead className="text-white font-semibold">Status</TableHead>
            <TableHead className="text-white font-semibold">Paid On</TableHead>
            <TableHead className="text-right text-white font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrolls.map((p, idx) => {
            const slip = findPayslip(p.id);
            const emp = employees[p.employee];
            const employeeLabel = emp ? (emp.name || emp.email || String(p.employee)) : String(p.employee);
            return (
              <TableRow 
                key={p.id} 
                className={`transition-colors hover:bg-purple-50 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold text-gray-900">{employeeLabel}</div>
                    {emp?.department && (
                      <div className="text-xs text-gray-500">ID: {p.employee} • {emp.department}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {p.period_start} → {p.period_end}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.period_end
                      ? new Date(p.period_end).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-green-700">
                  ${Number(p.gross_salary || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  ${Number(p.tax_amount || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-orange-600">
                  ${Number(p.statutory_deductions || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-orange-600">
                  ${Number(p.total_deductions || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-blue-700">
                  ${Number(p.net_salary || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={p.payment_status === 'PAID' ? 'default' : p.payment_status === 'FAILED' ? 'destructive' : 'secondary'}
                    className={
                      p.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : p.payment_status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {p.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {p.paid_on ? new Date(p.paid_on).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onCalculate(p.id)}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      <Calculator className="w-3 h-3 mr-1" />
                      Calc
                    </Button>
                    {p.payment_status === 'PENDING' ? (
                      <Button 
                        size="sm" 
                        onClick={() => onPay(p.id)}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                      >
                        Pay
                      </Button>
                    ) : p.payment_status === 'PAID' ? (
                      slip?.payslip_pdf_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 text-xs font-medium bg-transparent"
                          onClick={() => window.open(slip.payslip_pdf_url, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </Button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="h-8 px-3 bg-green-100 text-green-800 text-xs font-medium"
                        >
                          Paid
                        </Badge>
                      )
                    ) : p.payment_status === 'FAILED' ? (
                      <Badge
                        variant="secondary"
                        className="h-8 px-3 bg-red-100 text-red-800 text-xs font-medium"
                      >
                        Failed
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="h-8 px-3 bg-gray-100 text-gray-800 text-xs font-medium"
                      >
                        Unknown
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {payrolls.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">No payrolls available.</div>
      )}
    </div>
  );
};

export default PayrollTable;


