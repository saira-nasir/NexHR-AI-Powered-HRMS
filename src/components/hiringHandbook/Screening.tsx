import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useJobScreeningStatus } from '@/hooks/useJobScreeningStatus';
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
  MessageSquare,
  Brain,
  Target,
  Zap,
  Award,
  Briefcase,
  GraduationCap,
  BarChart3,
  Users,
  Mail,
  Phone,
  Send,
  XCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Candidate, ScreeningResult } from '@/data/hiringHandbookData';

// API response types
interface BackendCandidate {
  id: string | number;
  candidate_fname: string;
  candidate_lname: string;
  email: string;
  phone: string;
  score?: number;
  status: string;
  applied_at: string;
  gender?: string;
  address?: string;
  dob?: string;
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
  // New fields returned by screening API
  similarity_score?: number;
  skills_coverage?: number;
  experience_score?: number;
  final_score?: number; // decimal between 0-1
  screening_summary?: {
    gaps?: string[];
    risks?: string[];
    strengths?: string[];
    skill_matches?: string[];
    experience_fit?: string;
    score_alignment?: string;
  } | string; // may be a stringified object or parsed object
}

interface ScreenedCandidate {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: string;
  appliedAt: string;
  skills: string[];
  experience: number;
  matchReasons?: string[];
  // additional optional fields for details view
  similarityScore?: number;
  skillsCoverage?: number;
  experienceScore?: number;
  education?: string;
  location?: string;
  notes?: string;
  raw?: BackendCandidate;
}

interface JobScreeningResponse {
  status: 'screening' | 'screened' | 'scheduled';
  message: string;
  threshold?: number;
  candidates: BackendCandidate[];
  count?: number;
  shortlisted?: number;
  rejected?: number;
}

// Job details from the backend
interface JobDetails {
  id: number;
  job_title: string;
  department: number;
  experience_level: number;
  salary_from: string;
  salary_to: string;
  currency: string;
  created_at: string;
  period: string;
  city: string | null;
  state: string | null;
  country: string | null;
  job_deadline: string;
  company_name: string;
  status: string; // e.g., "scheduled", "screening", "screened", etc.
}

type ScreeningProps = {
  selectedJobId?: string | number | null;
  initialJobStatus?: string | null;
  isActive?: boolean;
};

const Screening: React.FC<ScreeningProps> = ({ selectedJobId = null, initialJobStatus = null, isActive = false }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState({
    skills: 25,
    experience: 25,
    education: 50 // Fixed at 50%, not editable
  });
  const [threshold, setThreshold] = useState(70);
  const [jobStatus, setJobStatus] = useState<'scheduled' | 'screening' | 'screened'>('scheduled');
  const [jobMessage, setJobMessage] = useState('');
  const [jobCounts, setJobCounts] = useState({ count: 0, shortlisted: 0, rejected: 0 });
  const [screeningsLeft, setScreeningsLeft] = useState<number | null>(null);
  const [screenedCandidates, setScreenedCandidates] = useState<ScreenedCandidate[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [thresholdLoading, setThresholdLoading] = useState(false); // Separate state for threshold button
  const [candidatesLoaded, setCandidatesLoaded] = useState(false); // Track if candidates have been loaded
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [lastActive, setLastActive] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Use custom hook to manage job screening status
  const { 
    jobStatus: fetchedJobStatus, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useJobScreeningStatus(selectedJobId, isActive);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    open: boolean;
    candidate: any | null;
    action: 'boost' | 'reject' | null;
  }>({ open: false, candidate: null, action: null });

  // Helper function to transform backend candidate to frontend format
  const transformCandidate = (backendCandidate: BackendCandidate): ScreenedCandidate => {
    // Attempt to extract a readable notes string from screening_summary
    let notes = '';
    let parsedScreeningSummary: any = null;
    if (backendCandidate.screening_summary) {
      try {
        // If it's already an object, use it directly
        if (typeof backendCandidate.screening_summary === 'object') {
          parsedScreeningSummary = backendCandidate.screening_summary;
        } else {
          // screening_summary might be a python-style dict string using single quotes. Try to convert to JSON safely.
          const maybeJson = backendCandidate.screening_summary.replace(/'/g, '"');
          parsedScreeningSummary = JSON.parse(maybeJson);
        }
        
        // Create a compact summary for the notes field
        if (parsedScreeningSummary && typeof parsedScreeningSummary === 'object') {
          // Prefer the 'score_alignment' or 'strengths' fields for a short note
          if (parsedScreeningSummary.score_alignment) notes = String(parsedScreeningSummary.score_alignment).slice(0, 300);
          else if (parsedScreeningSummary.strengths && Array.isArray(parsedScreeningSummary.strengths)) notes = String(parsedScreeningSummary.strengths.slice(0, 3).join('; ')).slice(0, 300);
          else notes = JSON.stringify(parsedScreeningSummary).slice(0, 300);
        } else {
          notes = String(parsedScreeningSummary).slice(0, 300);
        }
      } catch (e) {
        // Fallback to raw string if parsing fails
        notes = String(backendCandidate.screening_summary).slice(0, 300);
      }
    }

    const education = (backendCandidate.educations && backendCandidate.educations.length > 0)
      ? backendCandidate.educations[0].education_level || backendCandidate.educations[0].degree_detail || ''
      : '';

    const similarity = typeof backendCandidate.similarity_score === 'number' ? backendCandidate.similarity_score : undefined;
    const skillsCov = typeof backendCandidate.skills_coverage === 'number' ? backendCandidate.skills_coverage : undefined;
    const expScore = typeof backendCandidate.experience_score === 'number' ? backendCandidate.experience_score : undefined;
    const finalScoreDecimal = typeof backendCandidate.final_score === 'number' ? backendCandidate.final_score : backendCandidate.score;

    // Create a modified raw object with parsed screening_summary
    const rawWithParsedSummary = {
      ...backendCandidate,
      screening_summary: parsedScreeningSummary || backendCandidate.screening_summary
    };

    return {
      id: backendCandidate.id,
      name: `${backendCandidate.candidate_fname || ''} ${backendCandidate.candidate_lname || ''}`.trim() || 'Unknown',
      email: backendCandidate.email || '',
      phone: backendCandidate.phone || '',
      // map final_score (0-1) to 0-100. If not provided, fall back to score field.
      score: finalScoreDecimal ? Math.round(Number(finalScoreDecimal) * 100) : (backendCandidate.score ? Math.round(Number(backendCandidate.score) * 100) : 0),
      status: backendCandidate.status || 'pending',
      appliedAt: backendCandidate.applied_at || new Date().toISOString(),
      skills: (backendCandidate.skills || []).map(s => s.name),
      experience: backendCandidate.experiences && backendCandidate.experiences.length > 0
        ? parseFloat(backendCandidate.experiences[0].years_of_experience || '0')
        : 0,
      matchReasons: [],
      similarityScore: similarity,
      skillsCoverage: skillsCov,
      experienceScore: expScore,
      education: education,
      location: backendCandidate.address || '',
      notes: notes,
      raw: rawWithParsedSummary
    };
  };

  // Helper function to map job status to screening status
  const mapJobStatusToScreeningStatus = (status: string | null): 'screening' | 'screened' | 'not_started' => {
    if (!status) return 'not_started';
    const statusLower = status.toLowerCase();
    if (statusLower === 'screening') return 'screening';
    if (statusLower === 'screened') return 'screened';
    // Map 'scheduled' to 'not_started'
    if (statusLower === 'scheduled') return 'not_started';
    return 'not_started';
  };

  // Sync fetched job status from custom hook with local state
  // Only update the button state, don't fetch candidates automatically
  useEffect(() => {
    if (fetchedJobStatus) {
      setJobStatus(fetchedJobStatus);
    }
  }, [fetchedJobStatus]);

  // Handle tab activation: load candidates when tab becomes active
  useEffect(() => {
    console.log('Tab activation useEffect triggered:', {
      isActive,
      lastActive,
      jobStatus,
      fetchedJobStatus,
      selectedJobId,
      candidatesLoaded
    });
    
    if (isActive && !lastActive) {
      // Tab became active
      console.log('Tab became active, checking conditions...');
      if ((jobStatus === 'screened' || fetchedJobStatus === 'screened') && selectedJobId && !candidatesLoaded) {
        console.log('Conditions met, calling fetchCandidatesByThreshold...');
        // Initial load - GET request without payload
        fetchCandidatesByThreshold(threshold, false, true); // isInitialLoad = true
      } else {
        console.log('Conditions NOT met:', {
          statusCheck: jobStatus === 'screened' || fetchedJobStatus === 'screened',
          hasJobId: !!selectedJobId,
          notLoaded: !candidatesLoaded
        });
      }
    }
    // If tab was active and is now inactive, reset override toggle to false
    if (!isActive && lastActive) {
      console.log('Tab became inactive');
      setOverrideExisting(false);
    }
    setLastActive(isActive);
  }, [isActive, lastActive, jobStatus, fetchedJobStatus, selectedJobId, candidatesLoaded, threshold]);

  // Fetch job screening status and candidates from GET endpoint
  const fetchJobStatus = async () => {
    const rawJobId = selectedJobId ?? candidates[0]?.appliedFor;
    console.log('fetchJobStatus called with rawJobId:', rawJobId);
    
    let jobId: string | null = null;
    if (rawJobId != null) {
      const asString = String(rawJobId);
      if (/^\d+$/.test(asString)) {
        jobId = asString;
      } else {
        console.warn('Screening: job id is not numeric, skipping backend call. Received:', asString);
        return;
      }
    }

    if (!jobId) {
      console.warn('No valid job ID available, skipping fetchJobStatus');
      return;
    }

    const token = localStorage.getItem('access_token');
    const baseApi = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : 'http://127.0.0.1:8000/api';
    const url = `${baseApi}/jobs/${jobId}/candidates/`;

    console.log('Fetching job status from:', url);

    try {
      setApiLoading(true);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      console.log('API Response status:', res.status);

      if (!res.ok) {
        console.error('Failed to fetch job status:', res.status);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        
        // If endpoint doesn't exist (404), keep default state
        if (res.status === 404) {
          console.warn('Candidates endpoint not found - using default state');
          // Backend does not return a `not_started` status. Use `scheduled` as the local default
          // which maps to the UI state for jobs that haven't started screening.
          setJobStatus('scheduled');
          setJobMessage('No screening data available yet');
        }
        return;
      }

      const data: JobScreeningResponse = await res.json();
      console.log('API Response data:', JSON.stringify(data, null, 2));
      
      // Update state with response
      console.log('Setting jobStatus to:', data.status);
      
      if (data.status) {
        setJobStatus(data.status);
      } else {
        console.warn('API response missing status field, keeping current status:', jobStatus);
      }
      
      if (data.message) {
        setJobMessage(data.message);
      }
      
      if (data.candidates) {
        // Transform backend candidates to frontend format
        setScreenedCandidates(data.candidates.map(transformCandidate));
      }
      
      if (data.count !== undefined) {
        setJobCounts({
          count: data.count,
          shortlisted: data.shortlisted || 0,
          rejected: data.rejected || 0
        });
      }
      
      if (data.threshold !== undefined) {
        setThreshold(data.threshold * 100); // Convert decimal to percentage
      }

      // If backend returns remaining screenings, pick it up; otherwise default when status is 'screened'
      // Support both `remaining_screenings` and `screenings_left` field names from backend
      // If not present and status is 'screened' ensure we have a sensible default (4)
      const remaining = (data as any).remaining_screenings ?? (data as any).screenings_left;
      if (typeof remaining === 'number') {
        setScreeningsLeft(remaining);
      } else if (data.status === 'screened' && screeningsLeft === null) {
        setScreeningsLeft(4);
      }
    } catch (err) {
      console.error('Network error fetching job status:', err);
    } finally {
      setApiLoading(false);
    }
  };

  // Apply threshold filter via POST endpoint or just GET for initial load
  const fetchCandidatesByThreshold = async (thresholdPercent: number, overrideExistingFlag: boolean = false, isInitialLoad: boolean = false) => {
    console.log('fetchCandidatesByThreshold called:', { thresholdPercent, overrideExistingFlag, isInitialLoad });
    
    const rawJobId = selectedJobId ?? candidates[0]?.appliedFor;
    let jobId: string | null = null;
    if (rawJobId != null) {
      const asString = String(rawJobId);
      if (/^\d+$/.test(asString)) {
        jobId = asString;
      } else {
        console.warn('Screening: job id is not numeric, skipping backend call. Received:', asString);
        return;
      }
    }

    if (!jobId) {
      console.warn('No valid jobId, skipping API call');
      return;
    }

    console.log('Making API call with jobId:', jobId);
    const token = localStorage.getItem('access_token');
    const baseApi = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : 'http://127.0.0.1:8000/api';
    const url = `${baseApi}/jobs/${jobId}/candidates/`;

    try {
      setThresholdLoading(true);
      
      // For initial load, use GET without payload. For applying threshold, use POST
      console.log('Request method:', isInitialLoad ? 'GET' : 'POST');
      const res = await fetch(url, isInitialLoad ? {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      } : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(overrideExistingFlag ? { 
          threshold: Number((thresholdPercent / 100).toFixed(2)), 
          override_existing: true 
        } : { 
          threshold: Number((thresholdPercent / 100).toFixed(2)) 
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('API error:', res.status, txt);
        if (!isInitialLoad) {
          toast({ title: 'Filter failed', description: `Server responded ${res.status}: ${txt}`, variant: 'destructive' });
        }
        return;
      }

      const data: JobScreeningResponse = await res.json();
      console.log('API response:', data);
      
      // Update state with response
      if (data.status) setJobStatus(data.status);
      if (data.message) setJobMessage(data.message);
      
      // Transform backend candidates to frontend format
      setScreenedCandidates((data.candidates || []).map(transformCandidate));
      
      if (data.count !== undefined) {
        setJobCounts({
          count: data.count,
          shortlisted: data.shortlisted || 0,
          rejected: data.rejected || 0
        });
      }

      // Set threshold from last_threshold in response
      const lastThreshold = (data as any).last_threshold;
      if (lastThreshold !== undefined) {
        setThreshold(Math.round(Number(lastThreshold) * 100));
      } else if (data.threshold !== undefined) {
        setThreshold(Math.round(Number(data.threshold) * 100));
      }

      setCandidatesLoaded(true);
      console.log('Candidates loaded successfully, count:', data.candidates?.length);

      // Only show toast if user explicitly clicked apply threshold
      if (!isInitialLoad) {
        toast({ title: 'Filter applied', description: data.message || 'Candidates filtered by threshold' });
      }
    } catch (err: any) {
      console.error('Network error fetching candidates by threshold:', err);
      if (!isInitialLoad) {
        toast({ title: 'Network error', description: String(err?.message || err), variant: 'destructive' });
      }
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleRunScreening = async () => {
    // Validate that skills + experience sum to 50
    const total = Number(weights.skills) + Number(weights.experience);
    if (total !== 50) {
      toast({ title: 'Invalid weights', description: 'Skills and Experience weights must sum to 50%', variant: 'destructive' });
      return;
    }

    // Prepare payload - backend expects decimals (e.g., 0.35)
    const payload = {
      w_skills: Number((weights.skills / 100).toFixed(2)),
      w_exp: Number((weights.experience / 100).toFixed(2))
    };

    // Determine job id
    const rawJobId = selectedJobId ?? candidates[0]?.appliedFor;
    let jobId: string | null = null;
    if (rawJobId != null) {
      const asString = String(rawJobId);
      if (/^\d+$/.test(asString)) {
        jobId = asString;
      } else {
        toast({ title: 'Invalid job id', description: 'Selected job id is invalid for screening', variant: 'destructive' });
        return;
      }
    }

    if (!jobId) {
      toast({ title: 'No job selected', description: 'Select a job before running screening', variant: 'destructive' });
      return;
    }

  const token = localStorage.getItem('access_token');
  const baseApi = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : 'http://127.0.0.1:8000/api';
  const url = `${baseApi}/jobs/${jobId}/screen/`;

    try {
      setLoading(true);
      setApiLoading(true);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        toast({ title: 'Screening failed', description: `Server responded with ${res.status}: ${txt}`, variant: 'destructive' });
        return;
      }

      const data = await res.json();

      // Expected response shape:
      // { message: 'Screening queued for job 123', custom_weights: { w_skills: 0.35, w_exp: 0.15 } }
      if (data && data.message) {
        setJobMessage(data.message);
        // After queuing, backend likely sets job status to 'screening'
        setJobStatus('screening');
        toast({ title: 'Screening queued', description: data.message });
        
        // Refetch status from backend to confirm the status change
        refetchStatus();
      } else {
        toast({ title: 'Screening', description: 'Screening request submitted' });
      }

      // Optionally update weights shown from server's custom_weights
      if (data.custom_weights) {
        const s = Math.round((data.custom_weights.w_skills || 0) * 100);
        const e = Math.round((data.custom_weights.w_exp || 0) * 100);
        setWeights({ skills: s, experience: e, education: 50 });
      }

      // Update remaining screenings if backend returns it, otherwise decrement local counter if set
      const remainingFromBackend = (data as any).remaining_screenings ?? (data as any).screenings_left;
      if (typeof remainingFromBackend === 'number') {
        setScreeningsLeft(remainingFromBackend);
      } else if (screeningsLeft !== null) {
        setScreeningsLeft(Math.max(0, (screeningsLeft || 0) - 1));
      }

    } catch (error: any) {
      console.error('Error running screening:', error);
      toast({ title: 'Network error', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  // Accept any because transformed candidates come from the backend shape
  const handleOverride = (candidate: any, action: 'boost' | 'reject') => {
    setOverrideModal({ open: true, candidate, action });
  };

  const handleOverrideSubmit = async (reason: string) => {
    if (!overrideModal.candidate || !overrideModal.action) return;

    try {
      // NOTE: mockApi removed. For now we simply close the modal and refresh the latest job status.
      setOverrideModal({ open: false, candidate: null, action: null });
      // Refresh results by refetching current job status
      refetchStatus();
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

  return (
    <div className="space-y-6">{/*  Screening Configuration */}
      {/* Screening Configuration */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Screening Configuration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Configure scoring weights for intelligent candidate evaluation</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">Job Description vs Resume Similarity</h4>
                <p className="text-sm text-orange-800">
                  The similarity weight between job description and resume is <span className="font-bold">fixed at 50%</span>. 
                  You can tune the remaining <span className="font-bold">50%</span> between Skills and Experience below.
                </p>
                {jobStatus === 'screened' && (
                  <p className="text-sm text-orange-800 mt-3">
                    {screeningsLeft === null
                      ? 'You have 4 screening runs remaining for this job.'
                      : screeningsLeft > 0
                        ? `You have ${screeningsLeft} screening run${screeningsLeft > 1 ? 's' : ''} remaining for this job.`
                        : 'No screening runs remaining for this job.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Weights Configuration */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills Weight */}
              <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Skills Match</h3>
                      <p className="text-sm text-gray-600">Technical abilities</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="text-3xl font-bold text-blue-600">{weights.skills}%</span>
                    </div>
                    <Slider
                      value={[weights.skills]}
                      onValueChange={(value) => {
                        const newSkills = value[0];
                        const remaining = 50 - newSkills;
                        if (remaining >= 0 && remaining <= 50) {
                          setWeights({
                            skills: newSkills,
                            experience: remaining,
                            education: 50
                          });
                        }
                      }}
                      max={50}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Adjustable: 0-50% (Remaining goes to Experience)</p>
                </CardContent>
              </Card>

              {/* Experience Weight */}
              <Card className="border-2 border-green-100 hover:border-green-300 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Experience</h3>
                      <p className="text-sm text-gray-600">Work history</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="text-3xl font-bold text-green-600">{weights.experience}%</span>
                    </div>
                    <Slider
                      value={[weights.experience]}
                      onValueChange={(value) => {
                        const newExperience = value[0];
                        const remaining = 50 - newExperience;
                        if (remaining >= 0 && remaining <= 50) {
                          setWeights({
                            skills: remaining,
                            experience: newExperience,
                            education: 50
                          });
                        }
                      }}
                      max={50}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Adjustable: 0-50% (Remaining goes to Skills)</p>
                </CardContent>
              </Card>
            </div>

            {/* Run Screening Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleRunScreening} 
                disabled={
                  loading || 
                  statusLoading ||
                  jobStatus === 'screening' || 
                  screeningsLeft === 0
                }
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Loading status...
                  </>
                ) : jobStatus === 'screening' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Screening in Progress...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Running AI Screening...
                  </>
                ) : jobStatus === 'screened' || jobStatus === 'scheduled' ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-3" />
                    Run AI Screening
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-3" />
                    Run AI Screening
                  </>
                )}
              </Button>
              
            </div>
          </div>
        </CardContent>
      </Card>

      {(jobStatus === 'screening' || jobStatus === 'screened') && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  {jobStatus === 'screening' ? (
                    <Clock className="w-6 h-6 text-yellow-600 animate-pulse" />
                  ) : (
                    <Target className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {jobStatus === 'screening' ? 'Screening In Progress' : 'Screened Candidates'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{jobMessage}</p>
                </div>
              </div>
              {jobStatus === 'screened' && jobCounts.count > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Total: {jobCounts.count}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Shortlisted: {jobCounts.shortlisted}
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    Rejected: {jobCounts.rejected}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Threshold Slider Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-sm font-medium text-gray-700">Minimum Score Threshold</span>
                      <span className="text-4xl font-bold text-yellow-600">{threshold}</span>
                    </div>
                    <Slider
                      value={[threshold]}
                      onValueChange={(value) => setThreshold(value[0])}
                      max={100}
                      min={30}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Lower (30)</span>
                    <span>Higher (100)</span>
                  </div>
                </div>
                <div className="w-px h-32 bg-yellow-300"></div>
                  <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-700 font-medium">≥ {threshold}: Auto-approve</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-700 font-medium">{Math.max(0, threshold - 20)}-{threshold - 1}: Review</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-700 font-medium">{"<"} {Math.max(0, threshold - 20)}: Reject</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="inline-flex items-center text-sm gap-2">
                      <Switch
                        checked={overrideExisting}
                        onCheckedChange={(v) => setOverrideExisting(Boolean(v))}
                        className="mt-0.5"
                      />
                      <span className="select-none">Override existing decisions</span>
                    </label>
                  </div>

                  <Button 
                    onClick={() => fetchCandidatesByThreshold(threshold, overrideExisting, false)}
                    className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700"
                    disabled={thresholdLoading}
                  >
                    {thresholdLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {candidatesLoaded ? 'Applying...' : 'Loading candidates...'}
                      </div>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {candidatesLoaded ? 'Apply Threshold Filter' : 'Load Candidates'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Screened Candidates Display */}
            {screenedCandidates.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Filtered Candidates</h3>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {screenedCandidates.filter(c => 
                        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.phone || '').includes(searchQuery)
                      ).length} Found
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {screenedCandidates.filter(c => c.status === "approved").length} Approved
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {screenedCandidates.filter(c => c.status === "needs_review").length} Review
                    </Badge>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                      <XCircle className="w-3 h-3 mr-1" />
                      {screenedCandidates.filter(c => c.status === "rejected").length} Rejected
                    </Badge>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-gray-300 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Candidates Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Candidate
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Experience
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Skills
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            AI Score
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {screenedCandidates
                          .filter(c => 
                            (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.phone || '').includes(searchQuery)
                          )
                          .map((candidate, index) => (
                            <motion.tr
                              key={candidate.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              {/* Candidate Name */}
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(candidate.name || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{candidate.name}</p>
                                    <p className="text-xs text-gray-500">Applied {new Date(candidate.appliedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    {candidate.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    {candidate.phone}
                                  </div>
                                </div>
                              </td>

                              {/* Experience */}
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5">
                                  <Briefcase className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700">{candidate.experience} years</span>
                                </div>
                              </td>

                              {/* Skills */}
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(candidate.skills || []).slice(0, 3).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {(candidate.skills || []).length > 3 && (
                                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                                      +{candidate.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* AI Score */}
                              <td className="px-4 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`text-2xl font-bold ${
                                    candidate.score >= threshold ? "text-green-600" :
                                    candidate.score >= threshold - 20 ? "text-yellow-600" :
                                    "text-red-600"
                                  }`}>
                                    {candidate.score}
                                  </span>
                                  <span className="text-xs text-gray-500">/ 100</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-4 text-center">
                                <Badge 
                                  variant={
                                    candidate.status === "approved" ? "default" :
                                    candidate.status === "needs_review" ? "secondary" :
                                    "destructive"
                                  }
                                  className="text-xs font-medium"
                                >
                                  {candidate.status === "approved" ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                   candidate.status === "needs_review" ? <AlertCircle className="w-3 h-3 mr-1" /> :
                                   <XCircle className="w-3 h-3 mr-1" />}
                                  {candidate.status.replace('_', ' ')}
                                </Badge>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCandidate(candidate)}
                                    className="text-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    View
                                  </Button>
                                  {candidate.status === "approved" && (
                                    <Button 
                                      size="sm"
                                      className="text-xs bg-green-600 hover:bg-green-700"
                                    >
                                      <Send className="w-3.5 h-3.5 mr-1" />
                                      Contact
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No Candidates Match Current Threshold</p>
                <p className="text-sm">Try adjusting the threshold slider above to see more results</p>
              </div>
            )}
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
              {overrideModal.candidate.name} - {overrideModal.candidate.appliedAt ? new Date(overrideModal.candidate.appliedAt).toLocaleDateString() : ''}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {(selectedCandidate.name || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-sm text-gray-600">Applied {selectedCandidate.appliedAt ? new Date(selectedCandidate.appliedAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-2 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Final Score</p>
                  <p className="text-3xl font-bold text-purple-600">{selectedCandidate.score}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Similarity</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCandidate.similarityScore ? Math.round(selectedCandidate.similarityScore * 100) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Skills</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCandidate.skillsCoverage !== undefined ? Math.round(selectedCandidate.skillsCoverage * 100) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Experience</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedCandidate.experienceScore !== undefined ? Math.round(selectedCandidate.experienceScore * 100) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact & Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-medium">{selectedCandidate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="font-medium">{selectedCandidate.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Experience</p>
                  <p className="font-medium">{selectedCandidate.experience} years</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Education</p>
                  <p className="font-medium">{selectedCandidate.education || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* AI Screening Analysis */}
            {selectedCandidate.raw?.screening_summary && (
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Screening Analysis
                </h4>

                {/* Strengths */}
                {selectedCandidate.raw.screening_summary.strengths && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Strengths
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {selectedCandidate.raw.screening_summary.strengths.map((strength: string, idx: number) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Skill Matches */}
                {selectedCandidate.raw.screening_summary.skill_matches && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Skill Matches
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.raw.screening_summary.skill_matches.map((skill: string, idx: number) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700 border-blue-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gaps */}
                {selectedCandidate.raw.screening_summary.gaps && (
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Gaps
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {selectedCandidate.raw.screening_summary.gaps.map((gap: string, idx: number) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Risks */}
                {selectedCandidate.raw.screening_summary.risks && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Risks
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {selectedCandidate.raw.screening_summary.risks.map((risk: string, idx: number) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Experience Fit */}
                {selectedCandidate.raw.screening_summary.experience_fit && (
                  <Card>
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-gray-700 mb-2">Experience Fit</h5>
                      <p className="text-sm text-gray-700">{selectedCandidate.raw.screening_summary.experience_fit}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Score Alignment */}
                {selectedCandidate.raw.screening_summary.score_alignment && (
                  <Card>
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-gray-700 mb-2">Score Alignment</h5>
                      <p className="text-sm text-gray-700">{selectedCandidate.raw.screening_summary.score_alignment}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Top Skills */}
            <div className="mb-6">
              <h5 className="font-semibold text-gray-700 mb-2">Candidate Skills</h5>
              <div className="flex flex-wrap gap-2">
                {(selectedCandidate.skills || []).map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-50">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => handleOverride(selectedCandidate, 'boost')}
                variant="outline"
                className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Boost Candidate
              </Button>
              <Button
                onClick={() => handleOverride(selectedCandidate, 'reject')}
                variant="destructive"
                className="flex-1"
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
