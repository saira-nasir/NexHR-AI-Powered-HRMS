import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import SalaryStructureTable from '@/components/financeDashboard/SalaryStructureTable';

const SalaryStructures: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SalaryStructureTable />
      </div>
    </DashboardLayout>
  );
};

export default SalaryStructures;
