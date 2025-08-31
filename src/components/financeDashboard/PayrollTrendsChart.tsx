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
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader>
        <CardTitle className="group-hover:text-primary transition-colors">Monthly Payroll Trends</CardTitle>
        <CardDescription>Payroll amounts and employee count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PayrollTrendsChart;
