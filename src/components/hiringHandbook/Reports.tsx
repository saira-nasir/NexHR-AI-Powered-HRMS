import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Award,
  Download,
  FileText,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Star,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  Mail
} from 'lucide-react';
import { Candidate, AuditEntry, mockApi } from '@/data/hiringHandbookData';

const Reports: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidatesData, auditData] = await Promise.all([
        mockApi.getCandidates(),
        mockApi.getAuditLog()
      ]);
      setCandidates(candidatesData);
      setAuditLog(auditData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageCount = (stage: string) => {
    return candidates.filter(c => c.stage === stage).length;
  };

  const getJobCount = (job: string) => {
    return candidates.filter(c => c.appliedFor === job).length;
  };

  const getAverageScore = () => {
    if (candidates.length === 0) return 0;
    const total = candidates.reduce((sum, c) => sum + c.score, 0);
    return Math.round(total / candidates.length);
  };

  const getStageColor = (stage: string) => {
    const colors = {
      applied: 'bg-blue-500',
      screened: 'bg-yellow-500',
      assessment: 'bg-purple-500',
      interview: 'bg-orange-500',
      offer: 'bg-green-500',
      hired: 'bg-emerald-500',
      rejected: 'bg-red-500'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500';
  };

  const getStagePercentage = (stage: string) => {
    if (candidates.length === 0) return 0;
    return Math.round((getStageCount(stage) / candidates.length) * 100);
  };

  const getRecentActivityIcon = (action: string) => {
    if (action.includes('email')) return <Mail className="w-4 h-4 text-blue-500" />;
    if (action.includes('override')) return <AlertCircle className="w-4 h-4 text-orange-500" />;
    if (action.includes('advance')) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalCandidates = candidates.length;
  const shortlisted = getStageCount('interview') + getStageCount('offer');
  const hired = getStageCount('hired');
  const averageScore = getAverageScore();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hiring Analytics</h2>
              <p className="text-sm text-gray-600">Comprehensive insights into your hiring pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900">{totalCandidates}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+12% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                <p className="text-3xl font-bold text-gray-900">{shortlisted}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+8% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-3xl font-bold text-gray-900">{hired}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+15% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                <p className="text-3xl font-bold text-gray-900">{averageScore}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+5% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stage Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Pipeline Stages</CardTitle>
                <p className="text-sm text-gray-600">Distribution across hiring stages</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {['applied', 'screened', 'assessment', 'interview', 'offer', 'hired', 'rejected'].map((stage) => {
                const count = getStageCount(stage);
                const percentage = getStagePercentage(stage);
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">{stage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStageColor(stage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 min-w-[3rem]">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Applications by Position */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-green-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <BarChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Applications by Position</CardTitle>
                <p className="text-sm text-gray-600">Most popular job openings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from(new Set(candidates.map(c => c.appliedFor))).map((job) => {
                const count = getJobCount(job);
                const percentage = Math.round((count / totalCandidates) * 100);
                return (
                  <div key={job} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{job}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-600"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 min-w-[2rem]">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Score Distribution</CardTitle>
              <p className="text-sm text-gray-600">Candidate performance analysis</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { range: '90-100', label: 'Excellent', color: 'bg-emerald-500', count: candidates.filter(c => c.score >= 90).length },
              { range: '80-89', label: 'Great', color: 'bg-green-500', count: candidates.filter(c => c.score >= 80 && c.score < 90).length },
              { range: '70-79', label: 'Good', color: 'bg-blue-500', count: candidates.filter(c => c.score >= 70 && c.score < 80).length },
              { range: '60-69', label: 'Fair', color: 'bg-yellow-500', count: candidates.filter(c => c.score >= 60 && c.score < 70).length }
            ].map((category) => (
              <div key={category.range} className="text-center">
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white font-bold text-lg">{category.count}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{category.label}</p>
                <p className="text-xs text-gray-600">{category.range}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
                <p className="text-sm text-gray-600">Latest actions in the hiring pipeline</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {auditLog.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0">
                  {getRecentActivityIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.action}</p>
                  <p className="text-xs text-gray-600">{entry.details}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export Reports</h3>
                <p className="text-sm text-gray-600">Download comprehensive hiring analytics</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Excel Export
              </Button>
              <Button variant="outline" size="sm">
                <PieChart className="w-4 h-4 mr-2" />
                CSV Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
