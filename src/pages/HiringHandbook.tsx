import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
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
import Templates from '@/components/hiringHandbook/Templates';
import Reports from '@/components/hiringHandbook/Reports';

const HiringHandbook: React.FC = () => {
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
    { 
      id: 'templates', 
      label: 'Email Templates', 
      icon: FileText,
      description: 'Manage communication templates',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    { 
      id: 'reports', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Hiring insights and reports',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
  ];

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <DashboardLayout>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Candidates</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">24</div>
                  <p className="text-xs text-gray-500 mt-1">Active applications</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+12% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">In Pipeline</CardTitle>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">18</div>
                  <p className="text-xs text-gray-500 mt-1">Under review</p>
                  <div className="flex items-center mt-2">
                    <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-xs text-yellow-600">75% completion rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">6</div>
                  <p className="text-xs text-gray-500 mt-1">Scheduled this week</p>
                  <div className="flex items-center mt-2">
                    <Star className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-xs text-purple-600">4.8 avg rating</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Hired</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">3</div>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+50% success rate</span>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-gray-100 rounded-none">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <TabsTrigger 
                          key={tab.id} 
                          value={tab.id} 
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                            isActive 
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
                  <CurrentCandidates />
                </TabsContent>
                <TabsContent value="screening" className="m-0">
                  <Screening />
                </TabsContent>
                <TabsContent value="templates" className="m-0">
                  <Templates />
                </TabsContent>
                <TabsContent value="reports" className="m-0">
                  <Reports />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HiringHandbook;
