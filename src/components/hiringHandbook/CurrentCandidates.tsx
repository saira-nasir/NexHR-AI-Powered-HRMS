import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Award,
  Download,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  FileText,
  Plus,
  Sparkles,
  TrendingUp,
  Users2,
  Briefcase,
  Users
} from 'lucide-react';
import { Candidate, mockApi } from '@/data/hiringHandbookData';
// @ts-expect-error: CandidateDetailDrawer type declarations missing
import CandidateDetailDrawer from './CandidateDetailDrawer';

const CurrentCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, selectedStage, selectedJob]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await mockApi.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = candidates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.appliedFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stage filter
    if (selectedStage !== 'all') {
      filtered = filtered.filter(candidate => candidate.stage === selectedStage);
    }

    // Job filter
    if (selectedJob !== 'all') {
      filtered = filtered.filter(candidate => candidate.appliedFor === selectedJob);
    }

    setFilteredCandidates(filtered);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailDrawer(true);
  };

  const handleAdvanceStage = async (candidateId: string) => {
    try {
      await mockApi.advanceCandidate(candidateId);
      await loadCandidates(); // Reload to get updated data
    } catch (error) {
      console.error('Error advancing candidate:', error);
    }
  };

  const getStageBadge = (stage: string) => {
    const stageConfig = {
      applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      screened: { label: 'Screened', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      assessment: { label: 'Assessment', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      interview: { label: 'Interview', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      offer: { label: 'Offer', color: 'bg-green-100 text-green-800 border-green-200' },
      hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = stageConfig[stage as keyof typeof stageConfig] || stageConfig.applied;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const uniqueJobs = Array.from(new Set(candidates.map(c => c.appliedFor)));
  const uniqueStages = ['applied', 'screened', 'assessment', 'interview', 'offer', 'hired', 'rejected'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Candidate Pipeline</h2>
                <p className="text-sm text-gray-600">Manage and track all your candidates</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search candidates by name, role, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Jobs</option>
                  {uniqueJobs.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Stages</option>
                  {uniqueStages.map(stage => (
                    <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8"
              >
                <Briefcase className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCandidates.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {selectedCandidates.length} candidate(s) selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
                <Button variant="outline" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  Advance Stage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates Display */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Candidates ({filteredCandidates.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>Pipeline efficiency: 87%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">Name</th>
                    <th className="text-left p-4 font-medium text-gray-700">Role</th>
                    <th className="text-left p-4 font-medium text-gray-700">Applied</th>
                    <th className="text-left p-4 font-medium text-gray-700">Stage</th>
                    <th className="text-left p-4 font-medium text-gray-700">Score</th>
                    <th className="text-left p-4 font-medium text-gray-700">Recruiter</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => handleSelectCandidate(candidate.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{candidate.appliedFor}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(candidate.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">{getStageBadge(candidate.stage)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-12 h-2 bg-gradient-to-r ${getScoreGradient(candidate.score)} rounded-full`}></div>
                          <span className={`font-bold ${getScoreColor(candidate.score)}`}>
                            {candidate.score}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{candidate.recruiter}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCandidate(candidate)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdvanceStage(candidate.id)}
                            disabled={candidate.stage === 'hired' || candidate.stage === 'rejected'}
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.appliedFor}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => handleSelectCandidate(candidate.id)}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-1.5 bg-gradient-to-r ${getScoreGradient(candidate.score)} rounded-full`}></div>
                        <span className={`font-bold text-sm ${getScoreColor(candidate.score)}`}>
                          {candidate.score}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stage</span>
                      {getStageBadge(candidate.stage)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience</span>
                      <span className="text-sm font-medium">{candidate.experienceYears} years</span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCandidate(candidate)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdvanceStage(candidate.id)}
                          disabled={candidate.stage === 'hired' || candidate.stage === 'rejected'}
                          className="flex-1 text-xs"
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          Advance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <CandidateDetailDrawer
          candidate={selectedCandidate}
          open={showDetailDrawer}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedCandidate(null);
          }}
          onAdvanceStage={handleAdvanceStage}
        />
      )}
    </div>
  );
};

export default CurrentCandidates;
