const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = localStorage.getItem('urlforge_access_token');
let refreshToken: string | null = localStorage.getItem('urlforge_refresh_token');

export const setAuthTokens = (tokens: { access_token: string; refresh_token: string } | null) => {
  if (tokens) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    localStorage.setItem('urlforge_access_token', tokens.access_token);
    localStorage.setItem('urlforge_refresh_token', tokens.refresh_token);
  } else {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('urlforge_access_token');
    localStorage.removeItem('urlforge_refresh_token');
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

async function refreshAuthTokens(): Promise<string | null> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentRefresh }),
    });

    if (!res.ok) {
      setAuthTokens(null);
      return null;
    }

    const data = await res.json();
    setAuthTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    return data.access_token;
  } catch {
    setAuthTokens(null);
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to URLForge. Check your connection and try again.',
      'NETWORK_ERROR',
      0
    );
  }

  // Handle 401 and attempt refresh
  if (response.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAuthTokens();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        window.dispatchEvent(new Event('urlforge:unauthorized'));
      }
    } else {
      // Wait for existing refresh to complete
      const retryPromise = new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          try {
            const retryRes = await fetch(url, { ...options, headers });
            const data = await retryRes.json();
            resolve(data as T);
          } catch (e) {
            reject(e);
          }
        });
      });
      return retryPromise;
    }
  }

  // Parse response
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`;
    const code = errorData?.error?.code || 'ERROR';

    throw new ApiError(message, code, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
