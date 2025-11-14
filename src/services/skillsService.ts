import api from '@/lib/api';

export interface Skill {
  id: number;
  name: string;
}

export interface SkillsResponse {
  results: Skill[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface SkillsSearchResponse {
  results: Skill[];
}

class SkillsService {
  /**
   * Fetch all skills from the API
   */
  async getAllSkills(): Promise<Skill[]> {
    try {
      const response = await api.get('/skills/');
      console.log('Skills API response:', response.data);
      
      // Handle different response formats
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected skills API response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
  }

  /**
   * Search skills by query string
   */
  async searchSkills(query: string): Promise<Skill[]> {
    try {
      const response = await api.get('/skills/', {
        params: { q: query }
      });
      console.log('Skills search API response:', response.data);
      
      // Handle different response formats
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected skills search API response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error searching skills:', error);
      throw error;
    }
  }

  /**
   * Create a new skill
   */
  async createSkill(name: string): Promise<Skill> {
    try {
      const response = await api.post<Skill>('/skills/', { name });
      return response.data;
    } catch (error) {
      console.error('Error creating skill:', error);
      throw error;
    }
  }
}

export const skillsService = new SkillsService();
