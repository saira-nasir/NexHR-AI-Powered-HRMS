import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Settings, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  CheckCircle,
  X,
  AlertCircle,
  User,
  Star,
  MessageSquare
} from 'lucide-react';
import { Candidate, ScreeningResult, mockApi } from '@/data/hiringHandbookData';

const Screening: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState('Frontend Engineer');
  const [weights, setWeights] = useState({
    skills: 40,
    experience: 35,
    education: 25
  });
  const [threshold, setThreshold] = useState(60);
  const [showResults, setShowResults] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    open: boolean;
    candidate: Candidate | null;
    action: 'boost' | 'reject' | null;
  }>({ open: false, candidate: null, action: null });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const data = await mockApi.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const handleRunScreening = async () => {
    try {
      setLoading(true);
      const result = await mockApi.runScreening(selectedJob, weights, threshold);
      setScreeningResults(result.results);
      setShowResults(true);
    } catch (error) {
      console.error('Error running screening:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = (candidate: Candidate, action: 'boost' | 'reject') => {
    setOverrideModal({ open: true, candidate, action });
  };

  const handleOverrideSubmit = async (reason: string) => {
    if (!overrideModal.candidate || !overrideModal.action) return;

    try {
      await mockApi.overrideCandidate(overrideModal.candidate.id, overrideModal.action, reason);
      setOverrideModal({ open: false, candidate: null, action: null });
      // Refresh results
      await handleRunScreening();
    } catch (error) {
      console.error('Error applying override:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const uniqueJobs = Array.from(new Set(candidates.map(c => c.appliedFor)));

  return (
    <div className="space-y-6 p-6">
      {/* Screening Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Screening Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Job Position</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueJobs.map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Score Threshold: {threshold}
              </label>
              <Slider
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Weights Configuration */}
          <div>
            <label className="block text-sm font-medium mb-4">Scoring Weights</label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Skills Match</span>
                  <span className="text-sm font-medium">{weights.skills}%</span>
                </div>
                <Slider
                  value={[weights.skills]}
                  onValueChange={(value) => setWeights(prev => ({ ...prev, skills: value[0] }))}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Experience</span>
                  <span className="text-sm font-medium">{weights.experience}%</span>
                </div>
                <Slider
                  value={[weights.experience]}
                  onValueChange={(value) => setWeights(prev => ({ ...prev, experience: value[0] }))}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Education</span>
                  <span className="text-sm font-medium">{weights.education}%</span>
                </div>
                <Slider
                  value={[weights.education]}
                  onValueChange={(value) => setWeights(prev => ({ ...prev, education: value[0] }))}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleRunScreening} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run AI Screening
          </Button>
        </CardContent>
      </Card>

      {/* Screening Results */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Screening Results ({screeningResults.length} candidates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {screeningResults
                .sort((a, b) => b.score - a.score)
                .map((result) => {
                  const candidate = candidates.find(c => c.id === result.candidateId);
                  if (!candidate) return null;

                  return (
                    <div key={result.candidateId} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{candidate.name}</h3>
                            <p className="text-sm text-gray-600">{candidate.appliedFor}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </div>
                          {getScoreBadge(result.score)}
                        </div>
                      </div>

                      {/* Explainability */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">Why this score?</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.reasons.map((reason, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOverride(candidate, 'boost')}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Boost
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOverride(candidate, 'reject')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <TrendingDown className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Override Modal */}
      {overrideModal.open && overrideModal.candidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {overrideModal.action === 'boost' ? 'Boost' : 'Reject'} Candidate
            </h3>
            <p className="text-gray-600 mb-4">
              {overrideModal.candidate.name} - {overrideModal.candidate.appliedFor}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason (required)</label>
                <Input
                  placeholder={`Why are you ${overrideModal.action}ing this candidate?`}
                  id="override-reason"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const reason = (document.getElementById('override-reason') as HTMLInputElement)?.value;
                    if (reason.trim()) {
                      handleOverrideSubmit(reason);
                    }
                  }}
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOverrideModal({ open: false, candidate: null, action: null })}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selectedCandidate.name}</h3>
              <Button
                variant="ghost"
                onClick={() => setSelectedCandidate(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium">{selectedCandidate.appliedFor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-medium">{selectedCandidate.experienceYears} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Education</p>
                <p className="font-medium">{selectedCandidate.education}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{selectedCandidate.location}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Top Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.topSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700">{selectedCandidate.notes}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleOverride(selectedCandidate, 'boost')}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Boost Candidate
              </Button>
              <Button
                onClick={() => handleOverride(selectedCandidate, 'reject')}
                variant="destructive"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Reject Candidate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screening;
