import { apiClient } from './client';
import { User } from '../types';

export const userApi = {
  updateProfile: async (data: { name?: string; avatar_url?: string }): Promise<User> => {
    return apiClient<User>('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/api/v1/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/api/v1/account', {
      method: 'DELETE',
    });
  },
};
