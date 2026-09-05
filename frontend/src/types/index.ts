export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface URLItem {
  id: string;
  user_id?: string | null;
  original_url: string;
  short_code: string;
  custom_alias?: string | null;
  short_url: string;
  title?: string | null;
  description?: string | null;
  is_active: boolean;
  expires_at?: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface URLListResponse {
  items: URLItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClickItem {
  id: string;
  url_id: string;
  timestamp: string;
  ip_hash?: string | null;
  device_type?: string | null;
  browser?: string | null;
  operating_system?: string | null;
  referrer?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  is_bot: boolean;
}

export interface AnalyticsOverview {
  total_clicks: number;
  unique_visitors: number;
  clicks_today: number;
  clicks_this_week: number;
  clicks_this_month: number;
  human_clicks: number;
  bot_clicks: number;
}

export interface TimelinePoint {
  date: string;
  clicks: number;
  unique_visitors: number;
  bot_clicks: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface URLAnalyticsResponse {
  url_id: string;
  short_url: string;
  original_url: string;
  overview: AnalyticsOverview;
  timeline: TimelinePoint[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  operating_systems: BreakdownItem[];
  referrers: BreakdownItem[];
  countries: BreakdownItem[];
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
  is_active: boolean;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
}

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface AbuseReport {
  id: string;
  short_url: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_urls: number;
  active_urls: number;
  total_clicks: number;
  pending_reports: number;
  system_health: string;
}
