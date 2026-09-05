import { apiClient } from './client';
import { URLAnalyticsResponse, ClickItem } from '../types';
import { mockStore } from '../data/mockStore';

export const analyticsApi = {
  getAnalytics: async (urlId: string, days: number = 30): Promise<URLAnalyticsResponse> => {
    try {
      return await apiClient<URLAnalyticsResponse>(`/api/v1/urls/${urlId}/analytics?days=${days}`);
    } catch {
      return mockStore.getAnalytics(urlId);
    }
  },

  getClicks: async (urlId: string, page: number = 1, pageSize: number = 20): Promise<ClickItem[]> => {
    try {
      return await apiClient<ClickItem[]>(`/api/v1/urls/${urlId}/clicks?page=${page}&page_size=${pageSize}`);
    } catch {
      return [];
    }
  },

  getExportUrl: (urlId: string, format: 'csv' | 'json' = 'csv'): string => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${API_BASE_URL}/api/v1/urls/${urlId}/export?format=${format}`;
  },
};
