import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Payroll, Payslip } from '@/services/payrollService';

type EmployeeMap = Record<number, { name: string; email?: string }>;

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
    <div className="bg-card border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Statutory</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrolls.map((p) => {
            const slip = findPayslip(p.id);
            const emp = employees[p.employee];
            const employeeLabel = emp ? (emp.name || emp.email || String(p.employee)) : String(p.employee);
            return (
              <TableRow key={p.id}>
                <TableCell>{employeeLabel}</TableCell>
                <TableCell>
                  {p.period_start} → {p.period_end}
                </TableCell>
                <TableCell className="text-right">${Number(p.gross_salary || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(p.tax_amount || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(p.statutory_deductions || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(p.total_deductions || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(p.net_salary || 0).toLocaleString()}</TableCell>
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
                <TableCell>{p.paid_on || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCalculate(p.id)}>Calculate</Button>
                    {p.payment_status !== 'PAID' ? (
                      <Button size="sm" onClick={() => onPay(p.id)}>Pay</Button>
                    ) : slip?.payslip_pdf_url ? (
                      <a
                        href={slip.payslip_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-sm self-center"
                      >
                        View Payslip
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm self-center">No payslip</span>
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


