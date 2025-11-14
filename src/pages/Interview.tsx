import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import InterviewScoringForm from '@/components/interview-scoring-form/InterviewScoringForm';

const Interview: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <InterviewScoringForm />
      </div>
    </DashboardLayout>
  );
};

export default Interview;

