import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import TaxManagementTable from '@/components/financeDashboard/TaxManagementTable';

const TaxManagement: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <TaxManagementTable />
      </div>
    </DashboardLayout>
  );
};

export default TaxManagement;
