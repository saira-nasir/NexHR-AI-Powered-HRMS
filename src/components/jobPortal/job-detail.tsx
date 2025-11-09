import { useState, useEffect, useCallback } from "react";
import { MapPin, Briefcase, Clock, DollarSign, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useParams, useNavigate } from 'react-router-dom';

// Job details API response shape (partial)
interface JobApiResponse {
  id: number;
  company_name: string;
  job_title: string;
  job_type: string;
  location_type: string;
  job_deadline: string;
  city: string | null;
  state: string | null;
  country: string | null;
  salary_from: string;
  salary_to: string;
  currency: string;
  period: string;
  description: string;
  experience_level: number;
  required_skills: Array<{ id: number; name: string }>;
  created_at: string;
}

// Job interface
interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  jobType: string;
  postedDate: string;
  applicationDeadline: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}

// Component-local types
type Nullable<T> = T | null;


// JobDetail component
export default function JobDetail() {
  const [activeTab, setActiveTab] = useState<string>("description");
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
  const [job, setJob] = useState<Nullable<JobApiResponse>>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const navigate = useNavigate();
  const jobIdParam = params.jobId ?? null;

  const fetchJob = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const baseApi = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : 'http://127.0.0.1:8000/api';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${baseApi}/jobs/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch job details: ${res.status}`);
      }
      const data: JobApiResponse = await res.json();
      setJob(data);
    } catch (err: any) {
      console.error('Error fetching job details', err);
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (jobIdParam) {
      fetchJob(String(jobIdParam));
    }
  }, [jobIdParam, fetchJob]);

  const displayedDescription = showFullDescription 
    ? (job?.description || '') 
    : (job?.description && job.description.length > 150) 
      ? job.description.substring(0, 150) + "..." 
      : (job?.description || '');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Header */}
            <div>
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Right: Description skeleton */}
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-11/12 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-10/12 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-9/12 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-8/12 animate-pulse" />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <div className="h-6 bg-gray-100 rounded px-3 animate-pulse" style={{width: '64px'}} />
                <div className="h-6 bg-gray-100 rounded px-3 animate-pulse" style={{width: '84px'}} />
                <div className="h-6 bg-gray-100 rounded px-3 animate-pulse" style={{width: '56px'}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white p-8 rounded-2xl shadow border border-red-100">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Unable to load job details</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (jobIdParam) fetchJob(String(jobIdParam));
              }}
              className="px-4 py-2 bg-[#352f44] text-white rounded-md"
            >
              Retry
            </button>
            <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Job Details */}
          <div className="p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-[#dbd8e3] rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src='/images/company-logo.png'
                alt={`${job?.company_name || 'Company'} logo`}
                className="object-cover w-12 h-12"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#352f44] mb-2">{job?.job_title || 'Job Title'}</h1>
              <p className="text-xl text-gray-600">{job?.company_name || 'Company'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center text-gray-600">
              <MapPin size={20} className="mr-3 text-[#352f44]" />
              <span className="text-lg">{job?.location_type || 'Location'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign size={20} className="mr-3 text-[#352f44]" />
              <span className="text-lg">{job ? `${job.currency} ${job.salary_from} - ${job.salary_to} / ${job.period}` : 'Salary'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Briefcase size={20} className="mr-3 text-[#352f44]" />
              <span className="text-lg">{job?.job_type || 'Job Type'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-[#dbd8e3] p-5 rounded-xl">
              <div className="flex items-center space-x-3">
                <Clock size={24} className="text-[#352f44]" />
                <div>
                  <p className="text-sm text-gray-600">Posted</p>
                  <p className="font-medium text-[#352f44]">{job ? new Date(job.created_at).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#dbd8e3] p-5 rounded-xl">
              <div className="flex items-center space-x-3">
                <Calendar size={24} className="text-[#352f44]" />
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium text-[#352f44]">{job ? new Date(job.job_deadline).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>
          
            <div className="mt-8">
            <button
              onClick={() => {
                // navigate to application page with job id in the route param
                if (job) navigate(`/application/${job.id}`);
              }}
              className="w-full bg-[#352f44] hover:bg-[#2a2535] text-white font-medium py-3 px-8 rounded-xl transition-all duration-300"
            >
              Apply Now
            </button>
          </div>
          </div>
        
          {/* Right Column - Description & Requirements */}
          <div className="p-8">
            <div className="flex border-b">
            <button
              className={`flex-1 py-5 px-6 text-center font-medium text-lg transition-all duration-300 ${
                activeTab === "description"
                  ? "text-[#352f44] border-b-2 border-[#352f44]"
                  : "text-gray-500 hover:text-[#352f44]"
              }`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={`flex-1 py-5 px-6 text-center font-medium text-lg transition-all duration-300 ${
                activeTab === "requirements"
                  ? "text-[#352f44] border-b-2 border-[#352f44]"
                  : "text-gray-500 hover:text-[#352f44]"
              }`}
              onClick={() => setActiveTab("requirements")}
            >
              Requirements
            </button>
          </div>
          
          <div className="p-8">
            {activeTab === "description" && (
              <div>
                <h2 className="text-2xl font-bold text-[#352f44] mb-6">Job Description</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{displayedDescription}</p>
                {job?.description && job.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="flex items-center text-[#352f44] font-medium mb-8 hover:opacity-80 transition-opacity"
                  >
                    {showFullDescription ? (
                      <>
                        Show Less <ChevronUp size={18} className="ml-1" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown size={18} className="ml-1" />
                      </>
                    )}
                  </button>
                )}
                
                {job?.required_skills && job.required_skills.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-[#352f44] mb-4">Required Skills</h3>
                    <ul className="flex flex-wrap gap-2 mb-6">
                      {job.required_skills.map((s) => (
                        <li key={s.id} className="px-3 py-1 bg-[#dbd8e3] rounded-full text-gray-700">{s.name}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            
            {activeTab === "requirements" && (
              <div>
                <h2 className="text-2xl font-bold text-[#352f44] mb-6">Requirements & Experience</h2>
                <p className="text-gray-700 mb-4">Experience Level: {job?.experience_level ?? '-'}</p>
                <p className="text-gray-700">{job?.description}</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}