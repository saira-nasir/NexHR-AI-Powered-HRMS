// services/job-service.ts
import { JobListing } from "@/types/jobPortal/types";
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Interfaces for job application data
export interface Skill {
  name: string;
}

export interface Experience {
  years_of_experience: number;
  previous_job_titles: string;
  company_name: string;
}

export interface Education {
  education_level: string;
  institution_name: string;
  degree_detail: string;
  grades: string;
  start_date: string;
  end_date: string;
  description: string;
}

// Updated payload structure matching backend requirements
export interface JobApplicationData {
  job: number;
  candidate_fname: string;
  candidate_lname: string;
  email: string;
  phone: string;
  status: string; // "pending" for new applications
  gender: string; // lowercase: "male", "female", "other"
  address: string;
  dob: string;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  // Note: resume_text is auto-filled by backend when resume_file is uploaded
}

class ApplicationService {
  private getAuthHeader() {
    const access_token = localStorage.getItem('access_token');
    return access_token
      ? {
          Authorization: `Bearer ${access_token}`,
        }
      : {};
  }

  async submitApplication(applicationData: FormData, jobId?: string | number): Promise<{ success: boolean; message?: string; applicationId?: string; errorData?: any }> {
    try {
      // Always post to /applications/ endpoint; jobId should be included in FormData
      const endpoint = `${API_BASE_URL}/applications/`;
      console.log('Sending FormData to:', endpoint);
      console.log('FormData contents:');
      for (let [key, value] of applicationData.entries()) {
        console.log(key, value);
      }
      const response = await axios.post(endpoint, applicationData, {
        headers: {
          ...this.getAuthHeader(),
          // Don't set Content-Type - let browser set it for multipart/form-data
        },
      });

      if (response.status === 201) {
        return {
          success: true,
          applicationId: response.data.id || response.data.application_id,
          message: 'Application submitted successfully',
        };
      }

      return {
        success: false,
        message: 'Failed to submit application',
      };
    } catch (error: any) {
      console.error('Error submitting application:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);

      const rawErrorData = error.response?.data;
      // Prefer a string message for UI; keep structured data separately
      const message = typeof rawErrorData === 'string'
        ? rawErrorData
        : (rawErrorData?.message || rawErrorData?.detail || JSON.stringify(rawErrorData || 'Failed to submit application'));

      return {
        success: false,
        message,
        errorData: rawErrorData,
      };
    }
  }

  // (JSON submit method removed — keep FormData multipart submission for file uploads)

  async getApplication(applicationId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/${applicationId}/`, {
        headers: this.getAuthHeader(),
      });

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        message: 'Failed to fetch application',
      };
    } catch (error: any) {
      console.error('Error fetching application:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch application',
      };
    }
  }

  async getApplicationsByJob(jobId: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/?job=${jobId}`, {
        headers: this.getAuthHeader(),
      });

      if (response.status === 200) {
        return {
          success: true,
          data: response.data.results || response.data,
        };
      }

      return {
        success: false,
        message: 'Failed to fetch applications',
      };
    } catch (error: any) {
      console.error('Error fetching applications:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch applications',
      };
    }
  }
}

export const applicationService = new ApplicationService();

export interface ApiJobResponse {
  id: number;
    job_title: string;
    Department: string;
    experience_level: string;
    salary_from: string;
    salary_to: string;
    currency: string;
    created_at: string;
    period: string;
    city: string;
    state: string;
    country: string;
    job_deadline: string;
    company_name: string;
    status?: string;
  linkedin_post_url?: string | null;
    
}

export interface PaginatedJobsResponse {
    results: ApiJobResponse[];
    count: number;
    next: string | null;
    previous: string | null;
}

// Function to transform API response to our JobListing format
export const transformApiJob = (apiJob: ApiJobResponse): JobListing => {
  // Calculate average salary for display (return as number)
  const salaryFrom = parseFloat(apiJob.salary_from as unknown as string || '0');
  const salaryTo = parseFloat(apiJob.salary_to as unknown as string || '0');
  const averageSalaryNumber = (salaryFrom + salaryTo) / 2;

    // Format the date (created_at)
    const createdDate = new Date(apiJob.created_at);
    const formattedDate = `${createdDate.toLocaleString('default', { month: 'short' })} ${createdDate.getDate()}, ${createdDate.getFullYear()}`;

  // Prefer backend numeric id when available (stringified) so other APIs can use it
  const id = apiJob.id ? String(apiJob.id) : `job-${apiJob.job_title.replace(/\s+/g, '-').toLowerCase()}-${createdDate.getTime()}`;

  // Build a clean location string (omit null/empty parts)
  const locationParts = [apiJob.city, apiJob.state, apiJob.country].filter(part => part && String(part).trim() && String(part) !== 'null');
  const location = locationParts.length > 0 ? locationParts.join(', ') : '';

  // Build tags and omit null/undefined
  const tags: string[] = [];
  if (apiJob.experience_level !== null && apiJob.experience_level !== undefined) {
    tags.push(String(apiJob.experience_level));
  }
  if ((apiJob.salary_from || apiJob.salary_to) && apiJob.currency) {
    tags.push(`${apiJob.currency} ${apiJob.salary_from}-${apiJob.salary_to}`);
  }

  return {
    id,
    title: apiJob.job_title,
    company: apiJob.company_name,
    date: formattedDate,
    salary: Number(averageSalaryNumber),
    location,
    salary_period: `${apiJob.period}`,
    tags,
    status: apiJob.status || undefined
    ,
    linkedin_post_url: apiJob.linkedin_post_url ?? null
  };
};

// Function to fetch jobs with pagination
export const fetchJobs = async (page: number = 1, pageSize: number = 6): Promise<{
    jobs: JobListing[];
    totalCount: number;
}> => {
    try {
  // Use configured API base URL (falls back to local dev server)
  const response = await fetch(`${API_BASE_URL}/jobs/list/?page=${page}&page_size=${pageSize}`);

        if (!response.ok) {
            throw new Error(`Error fetching jobs: ${response.status}`);
        }

        const data: PaginatedJobsResponse = await response.json();

        // Transform the API response to our JobListing format
        console.log("==================kkkk===========",data)
        const jobs = data.results.map(transformApiJob);

        return {
            jobs,
            totalCount: data.count
        };
    } catch (error) {
        console.error("Failed to fetch jobs:", error);
        return {
            jobs: [],
            totalCount: 0
        };
    }
}

// Fetch jobs for company endpoint with pagination
export const fetchCompanyJobs = async (page: number = 1, pageSize: number = 6): Promise<{
    jobs: JobListing[];
    totalCount: number;
    next: string | null;
    previous: string | null;
}> => {
    try {
  const url = `${API_BASE_URL}/jobs/company/?page=${page}&page_size=${pageSize}`;
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.debug('[fetchCompanyJobs] Requesting', url, { headers });

    const response = await fetch(url, { headers });

    // Log non-OK responses for easier debugging
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[fetchCompanyJobs] non-OK response', response.status, text);
      throw new Error(`Error fetching company jobs: ${response.status}`);
    }

    const data: PaginatedJobsResponse = await response.json();
    console.debug('[fetchCompanyJobs] Response data:', data);

    const jobs = data.results.map(transformApiJob);

    return {
      jobs,
      totalCount: data.count,
      next: data.next,
      previous: data.previous
    };
    } catch (error) {
        console.error("Failed to fetch company jobs:", error);
        return {
            jobs: [],
            totalCount: 0,
            next: null,
            previous: null
        };
    }
}