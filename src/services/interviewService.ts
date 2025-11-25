import { apiPost, apiGet, handleApiError } from '@/lib/api'

const submitFeedback = async (roundId: number | string, payload: any) => {
  try {
    const url = `/interview/rounds/${roundId}/submit-feedback/`;
    const data = await apiPost(url, payload);
    return { success: true, data };
  } catch (err: any) {
    const parsed = handleApiError(err, 'Failed to submit feedback');
    return { success: false, error: parsed };
  }
}

const fetchScheduledRounds = async () => {
  try {
    const url = `/interview/rounds/scheduled/`;
    const data = await apiGet(url);
    return { success: true, data };
  } catch (err: any) {
    const parsed = handleApiError(err, 'Failed to fetch scheduled rounds');
    return { success: false, error: parsed };
  }
}

export const interviewService = {
  submitFeedback,
  fetchScheduledRounds,
}

export default interviewService;
