import { URLItem, URLAnalyticsResponse, ApiKeyItem, User } from '../types';

export const DEFAULT_USER: User = {
  id: 'usr_urlforge_admin',
  name: 'Anjan Shetty',
  email: 'anjan@urlforge.app',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'ADMIN',
  is_active: true,
  is_verified: true,
  created_at: '2025-01-01T00:00:00Z',
};

export const INITIAL_LINKS: URLItem[] = [
  {
    id: 'link_react_docs',
    user_id: DEFAULT_USER.id,
    original_url: 'https://react.dev/learn',
    short_code: 'react-docs',
    custom_alias: 'react-docs',
    short_url: 'https://urlforge.app/react-docs',
    title: 'React Documentation — Quick Reference',
    description: 'Official React 19 documentation and core concepts reference.',
    is_active: true,
    expires_at: null,
    click_count: 92,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link_github_repo',
    user_id: DEFAULT_USER.id,
    original_url: 'https://github.com/codexanjan/urlforge',
    short_code: 'urlforge-repo',
    custom_alias: 'urlforge-repo',
    short_url: 'https://urlforge.app/urlforge-repo',
    title: 'URLForge GitHub Repository',
    description: 'Open source production full-stack URL shortener and smart analytics platform.',
    is_active: true,
    expires_at: null,
    click_count: 124,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link_fastapi',
    user_id: DEFAULT_USER.id,
    original_url: 'https://fastapi.tiangolo.com',
    short_code: 'fastapi',
    custom_alias: 'fastapi',
    short_url: 'https://urlforge.app/fastapi',
    title: 'FastAPI High Performance Web Framework',
    description: 'Modern, fast (high-performance), web framework for building APIs with Python.',
    is_active: true,
    expires_at: null,
    click_count: 83,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link_tailwind',
    user_id: DEFAULT_USER.id,
    original_url: 'https://tailwindcss.com/docs',
    short_code: 'tailwind',
    custom_alias: 'tailwind',
    short_url: 'https://urlforge.app/tailwind',
    title: 'Tailwind CSS Documentation & Utility Classes',
    description: 'Rapidly build modern websites without ever leaving your HTML.',
    is_active: true,
    expires_at: null,
    click_count: 75,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link_flash_sale',
    user_id: DEFAULT_USER.id,
    original_url: 'https://store.example.com/summer-deals-2025',
    short_code: 'flash-sale',
    custom_alias: 'flash-sale',
    short_url: 'https://urlforge.app/flash-sale',
    title: 'Summer 2025 Flash Sale Campaign',
    description: 'Marketing campaign redirect link with UTM parameters tracking.',
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    click_count: 34,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link_hn_daily',
    user_id: DEFAULT_USER.id,
    original_url: 'https://news.ycombinator.com',
    short_code: 'hn-daily',
    custom_alias: 'hn-daily',
    short_url: 'https://urlforge.app/hn-daily',
    title: 'Hacker News Daily Digest',
    description: 'Top technology and startup discussions from Y Combinator.',
    is_active: true,
    expires_at: null,
    click_count: 18,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key_prod_analytics',
    name: 'Production Analytics Ingestion',
    key_prefix: 'uf_live_prod',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 3600000).toISOString(),
    revoked_at: null,
    is_active: true,
  },
  {
    id: 'key_ci_cd',
    name: 'GitHub Actions Deploy Key',
    key_prefix: 'uf_live_cicd',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 86400000).toISOString(),
    revoked_at: null,
    is_active: true,
  },
];

const STORAGE_KEYS = {
  LINKS: 'urlforge_links',
  KEYS: 'urlforge_api_keys',
};

class MockStore {
  private getLinksFromStorage(): URLItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(INITIAL_LINKS));
      return INITIAL_LINKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LINKS;
    }
  }

  private saveLinks(links: URLItem[]) {
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  }

  public getLinks(): URLItem[] {
    return this.getLinksFromStorage();
  }

  public getLinkById(id: string): URLItem | undefined {
    return this.getLinksFromStorage().find((l) => l.id === id || l.short_code === id || l.custom_alias === id);
  }

  public createLink(data: {
    original_url: string;
    custom_alias?: string;
    title?: string;
    description?: string;
    expires_at?: string | null;
  }): URLItem {
    const links = this.getLinksFromStorage();
    const shortCode = data.custom_alias || Math.random().toString(36).substring(2, 8);
    const newLink: URLItem = {
      id: `link_${Date.now()}`,
      user_id: DEFAULT_USER.id,
      original_url: data.original_url,
      short_code: shortCode,
      custom_alias: data.custom_alias || null,
      short_url: `https://urlforge.app/${shortCode}`,
      title: data.title || null,
      description: data.description || null,
      is_active: true,
      expires_at: data.expires_at || null,
      click_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    links.unshift(newLink);
    this.saveLinks(links);
    return newLink;
  }

  public updateLink(id: string, updates: Partial<URLItem>): URLItem {
    const links = this.getLinksFromStorage();
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Link not found');
    links[idx] = { ...links[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveLinks(links);
    return links[idx];
  }

  public deleteLink(id: string): void {
    const links = this.getLinksFromStorage().filter((l) => l.id !== id);
    this.saveLinks(links);
  }

  public getAnalytics(linkId?: string): URLAnalyticsResponse {
    const links = this.getLinksFromStorage();
    const link = linkId ? links.find((l) => l.id === linkId) : null;
    const clicks = link ? link.click_count : links.reduce((sum, l) => sum + l.click_count, 0);

    // Generate realistic timeline
    const timeline = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split('T')[0];
      const baseClicks = Math.floor((clicks / 14) * (0.6 + Math.sin(i) * 0.4 + Math.random() * 0.4));
      return {
        date: dateStr,
        clicks: Math.max(1, baseClicks),
        unique_visitors: Math.max(1, Math.floor(baseClicks * 0.85)),
        bot_clicks: Math.floor(baseClicks * 0.05),
      };
    });

    return {
      url_id: link?.id || 'all_links',
      short_url: link?.short_url || 'https://urlforge.app/overview',
      original_url: link?.original_url || 'All tracked links overview',
      overview: {
        total_clicks: clicks,
        unique_visitors: Math.round(clicks * 0.82),
        clicks_today: Math.max(1, Math.round(clicks * 0.06)),
        clicks_this_week: Math.max(5, Math.round(clicks * 0.38)),
        clicks_this_month: clicks,
        human_clicks: Math.round(clicks * 0.95),
        bot_clicks: Math.round(clicks * 0.05),
      },
      timeline,
      devices: [
        { name: 'Desktop', count: Math.round(clicks * 0.58), percentage: 58.0 },
        { name: 'Mobile', count: Math.round(clicks * 0.32), percentage: 32.0 },
        { name: 'Tablet', count: Math.round(clicks * 0.07), percentage: 7.0 },
        { name: 'Bot', count: Math.round(clicks * 0.03), percentage: 3.0 },
      ],
      browsers: [
        { name: 'Chrome', count: Math.round(clicks * 0.52), percentage: 52.0 },
        { name: 'Safari', count: Math.round(clicks * 0.24), percentage: 24.0 },
        { name: 'Firefox', count: Math.round(clicks * 0.14), percentage: 14.0 },
        { name: 'Edge', count: Math.round(clicks * 0.08), percentage: 8.0 },
        { name: 'Other', count: Math.round(clicks * 0.02), percentage: 2.0 },
      ],
      operating_systems: [
        { name: 'macOS', count: Math.round(clicks * 0.42), percentage: 42.0 },
        { name: 'Windows', count: Math.round(clicks * 0.35), percentage: 35.0 },
        { name: 'iOS', count: Math.round(clicks * 0.12), percentage: 12.0 },
        { name: 'Android', count: Math.round(clicks * 0.08), percentage: 8.0 },
        { name: 'Linux', count: Math.round(clicks * 0.03), percentage: 3.0 },
      ],
      referrers: [
        { name: 'Direct / None', count: Math.round(clicks * 0.35), percentage: 35.0 },
        { name: 'GitHub', count: Math.round(clicks * 0.25), percentage: 25.0 },
        { name: 'Twitter / X', count: Math.round(clicks * 0.18), percentage: 18.0 },
        { name: 'LinkedIn', count: Math.round(clicks * 0.12), percentage: 12.0 },
        { name: 'Google Search', count: Math.round(clicks * 0.10), percentage: 10.0 },
      ],
      countries: [
        { name: 'United States', count: Math.round(clicks * 0.45), percentage: 45.0 },
        { name: 'India', count: Math.round(clicks * 0.22), percentage: 22.0 },
        { name: 'Germany', count: Math.round(clicks * 0.12), percentage: 12.0 },
        { name: 'United Kingdom', count: Math.round(clicks * 0.11), percentage: 11.0 },
        { name: 'Canada', count: Math.round(clicks * 0.10), percentage: 10.0 },
      ],
    };
  }

  public getApiKeys(): ApiKeyItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KEYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(INITIAL_API_KEYS));
      return INITIAL_API_KEYS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_API_KEYS;
    }
  }

  public createApiKey(name: string): { item: ApiKeyItem; key: string } {
    const keys = this.getApiKeys();
    const rawKey = `uf_live_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    const newItem: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name,
      key_prefix: rawKey.slice(0, 12),
      created_at: new Date().toISOString(),
      last_used_at: null,
      revoked_at: null,
      is_active: true,
    };
    keys.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
    return { item: newItem, key: rawKey };
  }

  public revokeApiKey(id: string): void {
    const keys = this.getApiKeys().map((k) =>
      k.id === id ? { ...k, is_active: false, revoked_at: new Date().toISOString() } : k
    );
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
  }
}

export const mockStore = new MockStore();
