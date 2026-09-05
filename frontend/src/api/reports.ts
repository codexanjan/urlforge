import { apiClient } from './client';
import { AbuseReport, ReportStatus } from '../types';

export const reportApi = {
  submit: async (data: { short_url: string; reason: string; description?: string }): Promise<AbuseReport> => {
    return apiClient<AbuseReport>('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: async (): Promise<AbuseReport[]> => {
    return apiClient<AbuseReport[]>('/api/v1/reports');
  },

  updateStatus: async (id: string, status: ReportStatus): Promise<AbuseReport> => {
    return apiClient<AbuseReport>(`/api/v1/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
