import { useState, useEffect, useCallback } from 'react';

type JobStatus = 'scheduled' | 'screening' | 'screened';

interface JobStatusResponse {
  job_id: number;
  status: JobStatus;
  last_threshold?: number;
  screening_count?: number;
}

interface UseJobScreeningStatusReturn {
  jobStatus: JobStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastThreshold?: number | null;
  screeningCount?: number | null;
}

/**
 * Custom hook to fetch and manage job screening status
 * @param jobId - The ID of the job to fetch status for
 * @param enabled - Whether to enable automatic fetching (default: true)
 * @param pollingInterval - Interval in ms to poll for updates when status is 'screening' (default: 5000)
 */
export const useJobScreeningStatus = (
  jobId: string | number | null | undefined,
  enabled: boolean = true,
  pollingInterval: number = 30000
): UseJobScreeningStatusReturn => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastThreshold, setLastThreshold] = useState<number | null>(null);
  const [screeningCount, setScreeningCount] = useState<number | null>(null);

  const fetchJobStatus = useCallback(async () => {
    // Validate job ID
    if (!jobId) {
      setError('No job ID provided');
      return;
    }

    const jobIdString = String(jobId);
    if (!/^\d+$/.test(jobIdString)) {
      setError('Invalid job ID format');
      return;
    }

    const token = localStorage.getItem('access_token');
    const baseApi = import.meta.env.VITE_API_URL 
      ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') 
      : 'http://127.0.0.1:8000/api';
    
    const url = `${baseApi}/jobs/${jobIdString}/status/`;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job status endpoint not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

  const data: JobStatusResponse = await response.json();
      
      if (data.status) {
        setJobStatus(data.status);
        if (typeof (data as any).last_threshold === 'number') {
          setLastThreshold((data as any).last_threshold as number);
        }
        if (typeof (data as any).screening_count === 'number') {
          setScreeningCount((data as any).screening_count as number);
        }
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMessage);
      console.error('Error fetching job status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Initial fetch when enabled
  useEffect(() => {
    if (enabled && jobId) {
      fetchJobStatus();
    }
  }, [enabled, jobId, fetchJobStatus]);

  // Polling when status is 'screening'
  useEffect(() => {
    if (!enabled || !jobId || jobStatus !== 'screening') {
      return;
    }

    const intervalId = setInterval(() => {
      fetchJobStatus();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [enabled, jobId, jobStatus, pollingInterval, fetchJobStatus]);

  return {
    jobStatus,
    isLoading,
    error,
    refetch: fetchJobStatus,
    lastThreshold,
    screeningCount
  };
};
