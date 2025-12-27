import axios from 'axios';

interface PasswordResetRequestData {
  email: string;
}

interface PasswordResetConfirmData {
  password: string;
}

export const requestPasswordReset = async (data: PasswordResetRequestData) => {
  try {
    const response = await axios.post(`http://127.0.0.1:8000/api/auth/password-reset/`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Handle specific error formats
      const errorData = error.response.data;
      if (errorData.email && Array.isArray(errorData.email)) {
        throw new Error(errorData.email[0]);
      }
      throw new Error(errorData.error || errorData.detail || 'Failed to request password reset');
    }
    throw new Error('Failed to request password reset');
  }
};

export const confirmPasswordReset = async (
  uidb64: string,
  token: string,
  data: PasswordResetConfirmData
) => {
  try {
    const response = await axios.post(
      `http://127.0.0.1:8000/api/auth/password-reset-confirm/${uidb64}/${token}/`,
      data
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      throw new Error(errorData.error || errorData.detail || 'Failed to reset password');
    }
    throw new Error('Failed to reset password');
  }
}; 