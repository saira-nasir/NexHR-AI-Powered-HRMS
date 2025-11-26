import React, { useState } from 'react';
// removed DashboardLayout to render this page full-screen
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobListing } from '@/types/jobPortal/types';
import {
  Users,
  Search,
  Briefcase,
  Filter,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  Award,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
  Star
} from 'lucide-react';

// Import components
import CurrentCandidates from '@/components/hiringHandbook/CurrentCandidates';
import Screening from '@/components/hiringHandbook/Screening';

import { useLocation, useNavigate } from 'react-router-dom';

interface HiringHandbookProps {
  selectedJob?: JobListing | null;
  onClose?: () => void;
  jobStatus?: string | null;
}

const HiringHandbook: React.FC<HiringHandbookProps> = ({ selectedJob, onClose, jobStatus = null }) => {
  const [activeTab, setActiveTab] = useState('candidates');

  const tabs = [
    {
      id: 'candidates',
      label: 'Current Candidates',
      icon: Users,
      description: 'Manage and track candidate pipeline',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'screening',
      label: 'AI Screening',
      icon: Search,
      description: 'AI-powered candidate evaluation',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },

  ];

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab) || tabs[0];

  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);

  // Use selectedJob prop if available, otherwise fall back to URL params
  const jobId = selectedJob?.id
  const jobTitle = selectedJob?.title || search.get('jobTitle');
  const jobCompany = selectedJob?.company || search.get('jobCompany');
  const jobLocation = selectedJob?.location || search.get('jobLocation');
  const jobTags = selectedJob?.tags || (search.get('jobTags') || 'Full-time,Remote').split(',');
  const jobSalary = selectedJob ? `$${selectedJob.salary}/${selectedJob.salary_period}` : search.get('jobSalary');
  // If a jobStatus prop is provided, prefer it; otherwise fall back to URL params
  const urlJobStatus = search.get('jobStatus') || null;
  const effectiveJobStatus = jobStatus || urlJobStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-6 py-8 sm:px-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white">
                    Hiring Management
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Hiring Handbook
                </h1>
                <p className="text-xl text-indigo-100 max-w-2xl">
                  Streamline your hiring process with AI-powered screening, candidate management, and comprehensive analytics.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Candidate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-8 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top stats cards removed. Calendar/connection status is handled inside Assessment & Interview pages. */}

          {/* If a jobId is present in query params show a job detail banner */}
          {jobId && (
            <div className="mb-6 max-w-7xl mx-auto px-6">
              <Card className="border-0 shadow-md transform transition-all duration-300 ease-in-out hover:shadow-lg">
                <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-lg">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{jobTitle || `Job ${jobId}`}</h3>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm text-gray-600">{jobCompany || 'Company / Department'}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{jobLocation || 'Location'}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(Array.isArray(jobTags) ? jobTags : []).slice(0, 4).map((t, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border">{t}</span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded bg-green-50 text-green-700 text-sm font-medium">{jobSalary || 'Salary: N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-3">
                    <Button onClick={() => window.open(`/job-detail/${encodeURIComponent(jobId)}`, '_blank')} className="inline-flex items-center gap-2">
                      Details
                    </Button>
                    {onClose ? (
                      <Button variant="outline" onClick={onClose}>Close</Button>
                    ) : (
                      <Button variant="outline" onClick={() => navigate('/hiring/job-screening')}>Back to screenings</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab Navigation */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`${getActiveTab().bgColor} px-6 py-4 border-b`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getActiveTab().bgColor.replace('50', '100')}`}>
                  {(() => {
                    const Icon = getActiveTab().icon;
                    return <Icon className={`w-6 h-6 ${getActiveTab().iconColor}`} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getActiveTab().label}</h2>
                  <p className="text-sm text-gray-600">{getActiveTab().description}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2 h-auto p-1 bg-gray-100 rounded-none">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${isActive
                          ? `bg-white shadow-md ${tab.iconColor}`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="candidates" className="m-0">
                <CurrentCandidates selectedJobId={jobId} />
              </TabsContent>
              <TabsContent value="screening" className="m-0">
                {(() => { console.log('Rendering Screening -----------------', selectedJob, 'and jobStatus:', effectiveJobStatus); return null; })()}
                <Screening selectedJobId={jobId} initialJobStatus={effectiveJobStatus} isActive={activeTab === 'screening'} />
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiringHandbook;
