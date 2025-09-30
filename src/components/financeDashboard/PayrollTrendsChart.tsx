import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PayrollData {
  month: string;
  amount: number;
  employees: number;
}

interface PayrollTrendsChartProps {
  data: PayrollData[];
}

const PayrollTrendsChart: React.FC<PayrollTrendsChartProps> = ({ data }) => {
  return (
    <Card className="rounded-lg border border-gray-100 bg-white hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-l-4 border-[#6C63FF]/20">
      <CardHeader>
        <CardTitle className="group-hover:text-[#6C63FF] transition-colors text-lg">Monthly Payroll Trends</CardTitle>
        <CardDescription className="text-sm text-gray-500">Payroll amounts and employee count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f6" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, "Payroll"]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="amount" fill="#6C63FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PayrollTrendsChart;
