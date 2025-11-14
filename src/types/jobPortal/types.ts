export interface JobListing {
  id: string;
  title: string;
  company: string;
  date: string;
  salary: number;
  location: string;
  salary_period: string;
  tags: string[];
  // Backend job status (optional) - e.g. "scheduled", "screening", "screened"
  status?: string;
  // Optional LinkedIn post URL returned by backend (if job was posted to LinkedIn)
  linkedin_post_url?: string | null;
}