import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface JobSchema {
  name: boolean;
  email: boolean;
  phone: boolean;
  resume_url: boolean;
  gender: boolean;
  address: boolean;
  cover_letter_url: boolean;
  dob: boolean;
  education: boolean;
  experience: boolean;
  skills: boolean;
}

export interface RequiredSkill {
  id?: number;
  name: string;
}

export interface JobPostData {
  job_title: string | null;
  department: string | null;
  job_type: string | null;
  location_type: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  salary_from: number | null;
  salary_to: number | null;
  currency: string | null;
  period: string | null;
  job_description: string | null;
  experience_level: number | null;
  job_deadline: string | null;
  required_skills: RequiredSkill[];
  job_schema: JobSchema;
}

class JobService {
  private getAuthHeader() {
    const access_token = localStorage.getItem('access_token');
    return access_token
      ? {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        }
      : {};
  }

  async postJob(jobData: JobPostData): Promise<{ success: boolean; message?: string; jobId?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs/post/`, jobData, {
        headers: this.getAuthHeader(),
      });

      if (response.status === 201) {
        return {
          success: true,
          jobId: response.data.job_id,
          message: 'Job posted successfully',
        };
      }

      return {
        success: false,
        message: 'Failed to post job',
      };
    } catch (error: any) {
      console.error('Error posting job:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to post job',
      };
    }
  }
}

export const jobService = new JobService();
