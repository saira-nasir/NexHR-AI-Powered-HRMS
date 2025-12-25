import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
import { useLocation } from 'react-router-dom';

import CandidateDetailDrawer from './CandidateDetailDrawer';

// New interface for API response
interface ApiCandidate {
  id: number;
  candidate_fname: string;
  candidate_lname: string;
  email: string;
  phone: string;
  status: string;
  applied_at: string;
  gender: string;
  address: string;
  dob: string;
  skills: Array<{ id: number; name: string }>;
  experiences: Array<{
    id: number;
    years_of_experience: string;
    previous_job_titles: string;
    company_name: string;
  }>;
  educations: Array<{
    id: number;
    education_level: string;
    institution_name: string;
    degree_detail: string;
    grades: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
}

interface ApiResponse {
  posted_by: string;
  applications: ApiCandidate[];
}

interface CurrentCandidatesProps {
  selectedJobId?: string | number | null;
}

const CurrentCandidates: React.FC<CurrentCandidatesProps> = ({ selectedJobId = null }) => {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  // Prefer explicit prop, then URL param. Do NOT default to 1.
  const jobIdFromUrl = search.get('jobId') || search.get('job_id') || search.get('id');
  const jobId = selectedJobId ? String(selectedJobId) : jobIdFromUrl;

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
  const [recruiter, setRecruiter] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadCandidates();
  }, [jobId]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, selectedStage, selectedJob]);

  const loadCandidates = async () => {
    try {
      setLoading(true);

      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/jobs/${jobId}/applications/`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Set recruiter from response
      setRecruiter(data.posted_by);

      // Transform API candidates to Candidate interface
      const transformedCandidates: Candidate[] = data.applications.map(app => {
        // Map API status to valid stage values
        // API returns: 'pending', 'shortlisted', 'rejected', etc.
        // Map 'shortlisted' to 'screened' for internal consistency, but keep original in apiData
        let stage: "applied" | "screened" | "assessment" | "interview" | "offer" | "hired" | "rejected" = 'applied';
        
        if (app.status === 'pending') {
          stage = 'applied';
        } else if (app.status === 'shortlisted') {
          stage = 'screened'; // Map shortlisted to screened
        } else if (app.status === 'rejected') {
          stage = 'rejected';
        } else if (['applied', 'screened', 'assessment', 'interview', 'offer', 'hired'].includes(app.status)) {
          stage = app.status as any;
        }

        return {
          id: String(app.id),
          name: `${app.candidate_fname} ${app.candidate_lname}`,
          email: app.email,
          phone: app.phone,
          appliedFor: 'Position', // Could be enhanced with job title if available
          appliedAt: app.applied_at,
          stage,
          score: 0, // Not provided by API, set to 0
          experienceYears: app.experiences.length > 0
            ? parseFloat(app.experiences[0].years_of_experience)
            : 0,
          recruiter: data.posted_by,
          location: app.address,
          education: app.educations.length > 0
            ? `${app.educations[0].education_level} - ${app.educations[0].institution_name}`
            : 'N/A',
          topSkills: app.skills.map(skill => skill.name),
          resumeUrl: '', // Not provided by API
          attachments: [], // Not provided by API
          interviewHistory: [], // Not provided by API
          notes: '',
          // Store additional data for detail view including original API status
          apiData: app,
          originalStatus: app.status // Keep track of original API status
        } as Candidate & { apiData: ApiCandidate; originalStatus: string };
      });

      setCandidates(transformedCandidates);
    } catch (error) {
      console.error('Error loading candidates:', error);
      // Don't fallback to mock data - just set empty candidates
      setCandidates([]);
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

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [candidateId]: true }));

      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/applications/${candidateId}/status/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map the status: shortlisted -> screened for internal use
      const mappedStage = newStatus === 'shortlisted' ? 'screened' : (newStatus === 'rejected' ? 'rejected' : 'applied');
      
      // Update local state with new status
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate =>
          candidate.id === candidateId
            ? { ...candidate, stage: mappedStage as any, originalStatus: newStatus } as any
            : candidate
        )
      );

      toast({
        title: 'Status Updated',
        description: `Candidate status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const getStageBadge = (stage: string) => {
    const stageConfig = {
      applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      // Shortlisted (screened) should appear green
      screened: { label: 'Shortlisted', color: 'bg-green-100 text-green-800 border-green-200' },
      assessment: { label: 'Assessment', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      interview: { label: 'Interview', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      offer: { label: 'Offer', color: 'bg-green-100 text-green-800 border-green-200' },
      hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
    };

    // If a candidate is marked for manual review (needs_review), don't show the review badge in the table
    if (stage === 'needs_review' || stage === 'review') return null;

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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Candidates</h3>
              <p className="text-gray-600 text-center">Please wait while we fetch the candidate data...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Candidates Found</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                {searchTerm || selectedStage !== 'all' || selectedJob !== 'all'
                  ? 'No candidates match your current filters. Try adjusting your search criteria.'
                  : 'There are no candidate applications at the moment. New applications will appear here.'}
              </p>
              {(searchTerm || selectedStage !== 'all' || selectedJob !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStage('all');
                    setSelectedJob('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
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
                    <th className="text-left p-4 font-medium text-gray-700">Email</th>
                    <th className="text-left p-4 font-medium text-gray-700">Phone</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
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
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{candidate.email}</td>
                      <td className="p-4 text-sm text-gray-600">{candidate.phone}</td>
                      <td className="p-4">
                        <Select
                          value={(candidate as any).originalStatus || (candidate.stage === 'screened' ? 'shortlisted' : candidate.stage)}
                          onValueChange={(value) => handleStatusChange(candidate.id, value)}
                          disabled={updatingStatus[candidate.id]}
                        >
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Select status">
                              {((candidate as any).originalStatus === 'shortlisted' || candidate.stage === 'screened') && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span>Shortlisted</span>
                                </div>
                              )}
                              {candidate.stage === 'rejected' && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  <span>Rejected</span>
                                </div>
                              )}
                              {candidate.stage !== 'screened' && candidate.stage !== 'rejected' && (
                                <span className="capitalize">{candidate.stage}</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[99999] bg-white">
                            <SelectItem value="shortlisted">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Shortlisted</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>Rejected</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
