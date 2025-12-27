import { useState, useEffect, useCallback } from "react";
import { MapPin, Briefcase, Clock, DollarSign, Calendar, ChevronDown, ChevronUp, Share2, ArrowLeft, Building2, Globe, Loader2 } from "lucide-react";
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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

// Component-local types
type Nullable<T> = T | null;

// JobDetail component
export default function JobDetail() {
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
    : (job?.description && job.description.length > 300)
      ? job.description.substring(0, 300) + "..."
      : (job?.description || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Job Details...</h3>
        <p className="text-gray-500">Please wait while we fetch the job information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load job details</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => jobIdParam && fetchJob(String(jobIdParam))}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-gray-500 hover:text-gray-900 -ml-2"
            onClick={() => navigate('/job-portal')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                  {job.job_title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{job.company_name}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location_type}
                  </div>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                size="lg"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8"
                onClick={() => navigate(`/application/${job.id}`)}
              >
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <Tabs defaultValue="description" className="w-full">
                  <div className="border-b border-gray-100 px-6">
                    <TabsList className="h-14 w-full justify-start gap-8 bg-transparent p-0">
                      <TabsTrigger
                        value="description"
                        className="h-full rounded-none border-b-2 border-transparent px-0 font-medium data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent"
                      >
                        Description
                      </TabsTrigger>
                      <TabsTrigger
                        value="requirements"
                        className="h-full rounded-none border-b-2 border-transparent px-0 font-medium data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent"
                      >
                        Requirements & Skills
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="description" className="p-6 sm:p-8 animate-in fade-in-50 duration-300">
                    <div className="prose prose-slate max-w-none">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">About the Role</h3>
                      <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {displayedDescription}
                      </div>

                      {job.description.length > 300 && (
                        <Button
                          variant="ghost"
                          className="mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-medium"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                        >
                          {showFullDescription ? (
                            <span className="flex items-center">Show Less <ChevronUp className="ml-1 w-4 h-4" /></span>
                          ) : (
                            <span className="flex items-center">Read More <ChevronDown className="ml-1 w-4 h-4" /></span>
                          )}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="p-6 sm:p-8 animate-in fade-in-50 duration-300">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          Experience Required
                        </h3>
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 inline-block">
                          <p className="font-medium text-blue-900">
                            {job.experience_level > 0
                              ? `${job.experience_level}+ Years of Experience`
                              : 'Entry Level / No Experience Required'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-blue-600" />
                          Skills & Tech Stack
                        </h3>
                        {job.required_skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {job.required_skills.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="secondary"
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border-0"
                              >
                                {skill.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No specific skills listed</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h3 className="font-bold text-gray-900 text-lg">Job Overview</h3>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">Salary Range</p>
                      <p className="text-gray-900 font-semibold">
                        {job.currency} {Number(job.salary_from).toLocaleString()} - {Number(job.salary_to).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Per {job.period}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">Location</p>
                      <p className="text-gray-900 font-semibold">{job.city || job.location_type}, {job.country}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.location_type}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">Job Type</p>
                      <p className="text-gray-900 font-semibold">{job.job_type}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">Deadline</p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(job.job_deadline).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 py-6 text-lg rounded-xl"
                  onClick={() => navigate(`/application/${job.id}`)}
                >
                  Apply for this Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}