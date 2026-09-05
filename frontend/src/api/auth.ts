import { apiClient, setAuthTokens, getRefreshToken } from './client';
import { User, AuthTokens } from '../types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<User> => {
    return apiClient<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: {
    email: string;
    password: string;
    remember_me?: boolean;
  }): Promise<AuthTokens> => {
    const tokens = await apiClient<AuthTokens>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    return tokens;
  },

  logout: async (): Promise<void> => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await apiClient('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refresh }),
        });
      } catch {
        // Ignore errors during logout
      }
    }
    setAuthTokens(null);
  },

  getProfile: async (): Promise<User> => {
    return apiClient<User>('/api/v1/me');
  },
};
