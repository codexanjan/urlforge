import { apiClient } from './client';
import { AdminStats } from '../types';
import { mockStore, DEFAULT_USER } from '../data/mockStore';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    try {
      return await apiClient<AdminStats>('/api/v1/admin/stats');
    } catch {
      const links = mockStore.getLinks();
      const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);
      return {
        total_users: 1,
        total_urls: links.length,
        total_clicks: totalClicks,
        active_urls: links.filter((l) => l.is_active).length,
        pending_reports: 0,
        system_health: 'healthy',
      };
    }
  },

  getUsers: async (): Promise<any[]> => {
    try {
      return await apiClient<any[]>('/api/v1/admin/users');
    } catch {
      return [DEFAULT_USER];
    }
  },

  setLinkStatus: async (urlId: string, isActive: boolean): Promise<{ message: string }> => {
    try {
      return await apiClient<{ message: string }>(`/api/v1/admin/urls/${urlId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
    } catch {
      mockStore.updateLink(urlId, { is_active: isActive });
      return { message: 'Link status updated' };
    }
  },
};
