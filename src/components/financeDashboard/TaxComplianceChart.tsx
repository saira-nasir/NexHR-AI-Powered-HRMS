import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TaxComplianceData {
  name: string;
  value: number;
  color: string;
}

interface TaxComplianceChartProps {
  data: TaxComplianceData[];
}

const TaxComplianceChart: React.FC<TaxComplianceChartProps> = ({ data }) => {
  return (
    <Card className="rounded-lg border border-gray-100 bg-white hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 group border-l-4 border-[#6C63FF]/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="group-hover:text-[#6C63FF] transition-colors text-lg">Tax Compliance Status</CardTitle>
        <CardDescription className="text-sm text-gray-500">Current tax compliance overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-6">
          {/* fixed-size chart area to avoid automatic label overflow */}
          <div style={{ width: 140, height: 140 }} className="mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // remove the built-in labels to prevent overlap and render a compact legend instead
                  outerRadius={60}
                  fill="#6C63FF"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* compact legend to the right of the chart */}
          <div className="flex-1">
            <ul className="space-y-2">
              {data.map((d, i) => {
                const total = data.reduce((s, it) => s + it.value, 0) || 1;
                const percent = Math.round((d.value / total) * 100);
                return (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{d.name}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{percent}%</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxComplianceChart;
