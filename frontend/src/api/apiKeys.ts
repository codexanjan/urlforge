import { apiClient } from './client';
import { ApiKeyItem, ApiKeyCreated } from '../types';
import { mockStore } from '../data/mockStore';

export const apiKeyApi = {
  list: async (): Promise<ApiKeyItem[]> => {
    try {
      return await apiClient<ApiKeyItem[]>('/api/v1/api-keys');
    } catch {
      return mockStore.getApiKeys();
    }
  },

  create: async (name: string): Promise<ApiKeyCreated> => {
    try {
      return await apiClient<ApiKeyCreated>('/api/v1/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    } catch {
      const { item, key } = mockStore.createApiKey(name);
      return {
        id: item.id,
        name: item.name,
        key,
        key_prefix: item.key_prefix,
        created_at: item.created_at,
      };
    }
  },

  revoke: async (id: string): Promise<{ message: string }> => {
    try {
      return await apiClient<{ message: string }>(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
      });
    } catch {
      mockStore.revokeApiKey(id);
      return { message: 'API key revoked successfully' };
    }
  },
};
