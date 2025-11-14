import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import JobCard from '@/components/jobPortal/job-card';
import { Button } from '@/components/ui/button';
import { useLinkedInConnection } from '@/hooks/useLinkedInConnection';
import { linkedinService } from '@/services/linkedinService';
import { useToast } from '@/hooks/use-toast';
import type { JobListing } from '@/types/jobPortal/types';
import HiringHandbookDrawer from '@/components/modals/HiringHandbookDrawer';
import HiringHandbook from '@/pages/HiringHandbook';
import { fetchCompanyJobs } from '@/services/jobPortalservice';
import { Loader2, Linkedin } from 'lucide-react';


const JobScreening: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // LinkedIn connection hook for showing connect button on this page
  const { isConnected: linkedInConnected, isLoading: linkedInLoading, error: linkedInError, checkConnection: checkLinkedInConnection, connectLinkedIn } = useLinkedInConnection();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  // Pagination state - initialize from URL if available
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const pageFromUrl = searchParams.get('page');
  const [currentPage, setCurrentPage] = useState(pageFromUrl ? parseInt(pageFromUrl, 10) : 1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const jobsPerPage = 6;

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const handleView = (job: JobListing) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Clear selected job after animation completes
    setTimeout(() => setSelectedJob(null), 400);
  };

  // Sync URL with page changes
  useEffect(() => {
    const pageFromUrl = searchParams.get('page');
    const pageNum = pageFromUrl ? parseInt(pageFromUrl, 10) : 1;
    
    // If URL has a page param and it's different from currentPage, sync it
    if (pageNum !== currentPage && pageNum >= 1) {
      setCurrentPage(pageNum);
    }
  }, [searchParams]);

  // Load jobs for current page
  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetchCompanyJobs(currentPage, jobsPerPage);
        console.log('Fetched jobs for page', currentPage, resp);
        setJobs(resp.jobs);
        setTotalJobs(resp.totalCount);
        setNextUrl(resp.next ?? null);
        setPrevUrl(resp.previous ?? null);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load jobs.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage]);

  const { toast } = useToast();

  // Handler to post a job to LinkedIn when no linkedin_post_url exists
  const handlePostOnLinkedIn = async (job: JobListing) => {
    try {
      toast({ title: 'Posting to LinkedIn...', description: `Posting "${job.title}"` });
      const resp = await linkedinService.postJobToLinkedIn(job.id);
      toast({ title: 'Posted', description: resp.message });

      // Refresh job list to pick up linkedin_post_url added by backend
      setLoading(true);
      try {
        const refreshed = await fetchCompanyJobs(currentPage, jobsPerPage);
        setJobs(refreshed.jobs);
        setTotalJobs(refreshed.totalCount);
        setNextUrl(refreshed.next ?? null);
        setPrevUrl(refreshed.previous ?? null);
      } catch (err) {
        console.error('Error refreshing jobs after LinkedIn post', err);
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to post job to LinkedIn', err);
      toast({ title: 'Failed to post', description: err?.response?.data?.message || err?.message || 'Unknown error' });
    }
  };

  const paginate = (page: number) => {
    setCurrentPage(page);
    // Update URL query param
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Navigate using next/previous URL if provided by API
  const goNext = () => {
    if (nextUrl) {
      // parse next page number from URL if possible
      const url = new URL(nextUrl);
      const p = url.searchParams.get('page');
      if (p) paginate(Number(p));
    } else {
      paginate(Math.min(totalPages, currentPage + 1));
    }
  };

  const goPrevious = () => {
    console.log('[goPrevious] currentPage:', currentPage, 'prevUrl:', prevUrl);
    if (prevUrl) {
      try {
        const url = new URL(prevUrl);
        const p = url.searchParams.get('page');
        console.log('[goPrevious] Parsed page from prevUrl:', p);
        if (p) {
          paginate(Number(p));
        } else {
          paginate(Math.max(1, currentPage - 1));
        }
      } catch (e) {
        console.error('[goPrevious] Error parsing prevUrl:', e);
        paginate(Math.max(1, currentPage - 1));
      }
    } else {
      console.log('[goPrevious] No prevUrl, using fallback');
      paginate(Math.max(1, currentPage - 1));
    }
  };
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Job Screening</h1>
                  <p className="text-md text-indigo-100 max-w-2xl">List of jobs available for screening. Click on a job to view candidates and screening details.</p>
                </div>
                {/* LinkedIn banner (moved here from Screening). Beautiful, compact card */}
                <div className="w-full lg:w-auto mt-4 lg:mt-0">
                  {!linkedInLoading && !linkedInConnected ? (
                    <div className="bg-white rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-indigo-50">
                          <Linkedin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Connect your LinkedIn</div>
                          <div className="text-xs text-gray-500">Enable posting and sourcing of candidates directly from LinkedIn.</div>
                          {linkedInError && <div className="text-xs text-red-500 mt-1">{linkedInError}</div>}
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-full shadow-md flex items-center gap-2"
                          onClick={async () => {
                            try {
                              const res = await connectLinkedIn();
                              setTimeout(() => checkLinkedInConnection(), 2000);
                              console.log('LinkedIn connect result', res);
                            } catch (err) {
                              console.error('Error starting LinkedIn connect', err);
                            }
                          }}
                        >
                          <Linkedin className="w-4 h-4" />
                          Connect LinkedIn
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkLinkedInConnection()}
                          className="px-4 py-2 rounded-full"
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                  ) : linkedInLoading ? (
                    <div className="bg-white rounded-xl p-3 shadow text-gray-700">Checking LinkedIn...</div>
                  ) : (
                    <div className="bg-white rounded-xl p-3 shadow text-gray-700">LinkedIn connected</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#5C5470]" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
                {error}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center text-gray-600 p-4 bg-white/50 rounded-lg">
                No jobs found.
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((j) => (
                    <JobCard key={j.id} job={j} isSaved={false} onToggleSave={() => {}} onView={handleView} showLinkedIn={linkedInConnected} onPostLinkedIn={handlePostOnLinkedIn} />
                  ))}
                </div>

                {/* Pagination - show Prev/Next when API indicates more pages (next/previous) or when totalPages > 1 */}
                {(totalPages > 1 || nextUrl || prevUrl) && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={goPrevious}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-white text-[#5C5470] hover:bg-[#F2F1F7] disabled:opacity-50 shadow-sm font-medium"
                      >
                        Prev
                      </button>

                      {totalPages > 1 && (
                        <>
                          {[...Array(totalPages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => paginate(index + 1)}
                              className={`px-3 py-2 rounded shadow-sm ${currentPage === index + 1 ? 'bg-[#DBD8E3] text-[#2A2438] font-semibold' : 'bg-white text-[#5C5470] hover:bg-[#F2F1F7]'}`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </>
                      )}

                      <button
                        onClick={goNext}
                        disabled={currentPage === totalPages && !nextUrl}
                        className="px-4 py-2 rounded bg-white text-[#5C5470] hover:bg-[#F2F1F7] disabled:opacity-50 shadow-sm font-medium"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hiring Handbook Drawer */}
      <HiringHandbookDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer}>
        <HiringHandbook selectedJob={selectedJob} jobStatus={selectedJob?.status || null} onClose={handleCloseDrawer} />
      </HiringHandbookDrawer>
    </DashboardLayout>
  );
};

export default JobScreening;
