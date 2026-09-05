import { apiClient } from './client';
import { URLItem, URLListResponse } from '../types';
import { mockStore } from '../data/mockStore';

export interface CreateURLParams {
  original_url: string;
  custom_alias?: string;
  title?: string;
  description?: string;
  expires_at?: string | null;
}

export interface UpdateURLParams {
  title?: string | null;
  description?: string | null;
  is_active?: boolean;
  expires_at?: string | null;
  original_url?: string;
}

export interface ListURLQuery {
  page?: number;
  page_size?: number;
  search?: string;
  filter_status?: 'all' | 'active' | 'disabled' | 'expired';
  sort?: 'newest' | 'oldest' | 'clicks_desc' | 'clicks_asc';
}

export const urlApi = {
  create: async (data: CreateURLParams): Promise<URLItem> => {
    try {
      return await apiClient<URLItem>('/api/v1/urls', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Offline / Vercel fallback
      return mockStore.createLink(data);
    }
  },

  list: async (params: ListURLQuery = {}): Promise<URLListResponse> => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page.toString());
      if (params.page_size) query.set('page_size', params.page_size.toString());
      if (params.search) query.set('search', params.search);
      if (params.filter_status) query.set('filter_status', params.filter_status);
      if (params.sort) query.set('sort', params.sort);

      const queryString = query.toString();
      return await apiClient<URLListResponse>(`/api/v1/urls${queryString ? `?${queryString}` : ''}`);
    } catch {
      // Offline / Vercel fallback
      let items = mockStore.getLinks();
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.original_url.toLowerCase().includes(q) ||
            i.short_code.toLowerCase().includes(q) ||
            (i.custom_alias && i.custom_alias.toLowerCase().includes(q)) ||
            (i.title && i.title.toLowerCase().includes(q))
        );
      }
      if (params.filter_status === 'active') {
        items = items.filter((i) => i.is_active);
      } else if (params.filter_status === 'disabled') {
        items = items.filter((i) => !i.is_active);
      }
      if (params.sort === 'clicks_desc') {
        items.sort((a, b) => b.click_count - a.click_count);
      } else if (params.sort === 'oldest') {
        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else {
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return {
        items,
        total: items.length,
        page: params.page || 1,
        page_size: params.page_size || 20,
        total_pages: 1,
      };
    }
  },

  get: async (id: string): Promise<URLItem> => {
    try {
      return await apiClient<URLItem>(`/api/v1/urls/${id}`);
    } catch {
      const item = mockStore.getLinkById(id);
      if (!item) throw new Error('Link not found');
      return item;
    }
  },

  update: async (id: string, data: UpdateURLParams): Promise<URLItem> => {
    try {
      return await apiClient<URLItem>(`/api/v1/urls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      return mockStore.updateLink(id, data);
    }
  },

  delete: async (id: string): Promise<{ message: string }> => {
    try {
      return await apiClient<{ message: string }>(`/api/v1/urls/${id}`, {
        method: 'DELETE',
      });
    } catch {
      mockStore.deleteLink(id);
      return { message: 'Link deleted successfully' };
    }
  },

  getQrUrl: (id: string, _format: 'svg' | 'png' = 'svg'): string => {
    const item = mockStore.getLinkById(id);
    const targetUrl = item ? item.short_url : `https://urlforge.app/${id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
      targetUrl
    )}`;
  },
};
