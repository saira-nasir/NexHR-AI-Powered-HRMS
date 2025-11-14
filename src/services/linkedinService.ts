import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const BACKEND_URL = 'http://localhost:8000/api/auth/linkedin/token/';
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;

export interface LinkedInConnectionStatus {
    isConnected: boolean;
    message?: string;
    reason?: string;
    expires_at?: string | null;
}

export interface AccessTokenResponse {
    success: boolean;
    message?: string;
    access_token?: string;
    expires_in?: number;
}

interface PostJobToLinkedInPayload {
    job_id: string;
}

interface PostJobToLinkedInResponse {
    message: string;
}

class LinkedInService {
    //to get access tokens
    private getAuthHeader() {
        const access_token = localStorage.getItem('access_token');
        return access_token ? {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        } : {};
    }


    // to check weather the current company connects its linkedin or not
    async checkConnectionStatus(): Promise<LinkedInConnectionStatus> {
        try {
            console.log('test');
            const headers = this.getAuthHeader();
            console.log('[linkedin] checkConnectionStatus -> requesting', { url: `${API_BASE_URL}/auth/linkedin/status/`, hasAuth: Boolean(headers.Authorization) });
            const response = await axios.get(`${API_BASE_URL}/auth/linkedin/status/`, {
                headers
            });

            console.log('[linkedin] checkConnectionStatus <- response', { status: response.status, data: response.data });

            // Prefer explicit reason/message from backend if available
            const message = response.data.message || response.data.reason || (response.data.connected ? 'Connected' : 'Not connected');

            return {
                isConnected: Boolean(response.data.connected),
                message,
                reason: response.data.reason,
                expires_at: response.data.expires_at ?? null,
            };
        } catch (error: any) {
            console.error('[linkedin] Error checking LinkedIn connection status:', error?.response?.status, error?.response?.data || error.message || error);
            return {
                isConnected: false,
                message: error.response?.data?.message || 'Failed to check LinkedIn connection status',
                reason: error.response?.data?.reason,
                expires_at: error.response?.data?.expires_at ?? null,
            };
        }
    }


    // to connect the company to linkedin
    async connectLinkedIn(): Promise<LinkedInConnectionStatus> {
        try {
            if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
                throw new Error('LinkedIn configuration is missing');
            }

            const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('client_id', LINKEDIN_CLIENT_ID);
            authUrl.searchParams.append('redirect_uri', LINKEDIN_REDIRECT_URI);
            authUrl.searchParams.append('state', 'foobar');
            authUrl.searchParams.append('scope', 'email w_member_social openid profile');

            const urlStr = authUrl.toString();
            console.log('[linkedin] connectLinkedIn -> opening auth URL', { url: urlStr });
            const popup = window.open(urlStr, '_blank', 'width=600,height=600');
            return {
                isConnected: true,
                message: 'Opening LinkedIn authentication...'
            };
        } catch (error: any) {
            console.error('[linkedin] Error connecting to LinkedIn:', error?.message || error);
            return {
                isConnected: false,
                message: error.message || 'Failed to connect to LinkedIn'
            };
        }
    }


    //sends the request to beacked with code from linked in
    async getAccessToken(code: string): Promise<AccessTokenResponse> {
        try {
            const headers = this.getAuthHeader();
            console.log('[linkedin] getAccessToken -> requesting token with code', { code });
            const response = await axios.post(`${API_BASE_URL}/auth/linkedin/token/`, { code }, {
                headers
            });

            console.log('[linkedin] getAccessToken <- response', { status: response.status, data: response.data });

            if (response.status === 200) {
                const { access_token: linkedin_token, expires_in } = response.data;

                return {
                    access_token: linkedin_token,
                    expires_in,
                    success: true,
                };
            }

            return {
                success: false,
                message: 'Failed to obtain token from backend',
            };
        } catch (error: any) {
            console.error('[linkedin] LinkedIn token error:', error?.response?.status, error?.response?.data || error.message || error);
            return {
                success: false,
                message: error?.response?.data?.error || 'Unknown error',
            };
        }
    }

    // Post a job to LinkedIn
    async postJobToLinkedIn(jobId: string): Promise<{ message: string }> {
        try {
            const headers = this.getAuthHeader();
            const payload = { job_id: jobId } as PostJobToLinkedInPayload;
            console.log('[linkedin] postJobToLinkedIn -> sending', { url: `${API_BASE_URL}/post-job-linkedin/`, payload, hasAuth: Boolean(headers.Authorization) });
            const response = await axios.post(
                `${API_BASE_URL}/post-job-linkedin/`,
                payload,
                {
                    headers,
                }
            );

            console.log('[linkedin] postJobToLinkedIn <- response', { status: response.status, data: response.data });
            return response.data;
        } catch (error: any) {
            console.error('[linkedin] ❌ Failed to post job to LinkedIn:', error?.response?.status, error?.response?.data || error.message || error);
            throw error;
        }
    }

}

export const linkedinService = new LinkedInService(); 