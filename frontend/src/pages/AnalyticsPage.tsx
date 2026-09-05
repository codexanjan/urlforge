import React, { useState, useEffect, useCallback } from 'react';
import { urlApi, analyticsApi } from '../api';
import { URLItem, URLAnalyticsResponse } from '../types';
import { useToast } from '../hooks/useToast';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ClickTimelineChart } from '../charts/ClickTimelineChart';
import { DeviceDonutChart } from '../charts/DeviceDonutChart';
import { BrowserBarChart } from '../charts/BrowserBarChart';
import { OsBarChart } from '../charts/OsBarChart';
import { ReferrerTable } from '../charts/ReferrerTable';
import { GeoTable } from '../charts/GeoTable';
import { EmptyState } from '../components/ui/EmptyState';
import {
  MousePointerClick,
  Users,
  Calendar,
  Download,
  Bot,
  UserCheck,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<URLItem[]>([]);
  const [selectedUrlId, setSelectedUrlId] = useState<string>('');
  const [analytics, setAnalytics] = useState<URLAnalyticsResponse | null>(null);
  const [days, setDays] = useState<number>(30);
  const [botFilter, setBotFilter] = useState<'all' | 'human' | 'bot'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch available links
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const res = await urlApi.list({ page_size: 50 });
        setLinks(res.items);
        if (res.items.length > 0) {
          setSelectedUrlId(res.items[0].id);
        } else {
          setIsLoading(false);
        }
      } catch {
        toast.error('Failed to load links for analytics');
        setIsLoading(false);
      }
    };
    loadLinks();
  }, [toast]);

  // Fetch analytics for selected link
  const loadAnalytics = useCallback(async () => {
    if (!selectedUrlId) return;
    try {
      setIsLoading(true);
      const data = await analyticsApi.getAnalytics(selectedUrlId, days);
      setAnalytics(data);
    } catch {
      toast.error('Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUrlId, days, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (links.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <EmptyState
          title="No links to analyze yet"
          description="Create your first short link in the dashboard or links manager to begin tracking click telemetry."
        />
      </div>
    );
  }

  // Filter timeline based on Bot vs Human toggle if desired
  const filteredTimeline = (analytics?.timeline || []).map((pt) => {
    if (botFilter === 'human') {
      return { ...pt, clicks: Math.max(0, pt.clicks - pt.bot_clicks) };
    } else if (botFilter === 'bot') {
      return { ...pt, clicks: pt.bot_clicks };
    }
    return pt;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Engine</h1>
          <p className="text-xs text-surface-400 mt-1">
            Real-time, privacy-first telemetry with bot detection and geographic resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Link Selector */}
          <select
            value={selectedUrlId}
            onChange={(e) => setSelectedUrlId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-xs truncate"
          >
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.custom_alias ? `/${link.custom_alias}` : link.short_code} — {link.title || link.original_url}
              </option>
            ))}
          </select>

          {/* Export button */}
          {selectedUrlId && (
            <div className="flex items-center gap-1.5">
              <a href={analyticsApi.getExportUrl(selectedUrlId, 'csv')} download>
                <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                  CSV
                </Button>
              </a>
              <a href={analyticsApi.getExportUrl(selectedUrlId, 'json')} download>
                <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                  JSON
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-primary-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">
              {analytics?.overview.total_clicks.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-surface-400 mt-1">All recorded requests</div>
          </Card>

          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Unique Visitors</span>
              <Users className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">
              {analytics?.overview.unique_visitors.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-surface-400 mt-1">Hashed unique IPs</div>
          </Card>

          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Clicks Today</span>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">
              {analytics?.overview.clicks_today.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-surface-400 mt-1">Past 24 hours</div>
          </Card>

          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Human Clicks</span>
              <UserCheck className="w-4 h-4 text-primary-400" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">
              {analytics?.overview.human_clicks.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-surface-400 mt-1">Valid browser sessions</div>
          </Card>

          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Bot / Crawler</span>
              <Bot className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">
              {analytics?.overview.bot_clicks.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-surface-400 mt-1">Automated agents</div>
          </Card>
        </div>
      )}

      {/* Main Timeline Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Click Performance Timeline</CardTitle>
            <p className="text-xs text-surface-400 mt-0.5">
              Visualizing click density and visitor engagement over time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bot vs Human filter */}
            <div className="inline-flex rounded-lg border border-surface-300 dark:border-surface-700 p-1 bg-surface-100/60 dark:bg-surface-800/60 text-xs font-semibold">
              {(['all', 'human', 'bot'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBotFilter(mode)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    botFilter === mode
                      ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-surface-500 hover:text-foreground'
                  }`}
                >
                  {mode === 'all' ? 'All Clicks' : mode === 'human' ? 'Human Only' : 'Bots Only'}
                </button>
              ))}
            </div>

            {/* Time interval filter */}
            <div className="inline-flex rounded-lg border border-surface-300 dark:border-surface-700 p-1 bg-surface-100/60 dark:bg-surface-800/60 text-xs font-semibold">
              {[
                { label: 'Today', value: 1 },
                { label: '7D', value: 7 },
                { label: '30D', value: 30 },
                { label: '90D', value: 90 },
                { label: 'All', value: 0 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => setDays(pill.value)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    days === pill.value
                      ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-surface-500 hover:text-foreground'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ClickTimelineChart data={filteredTimeline} isLoading={isLoading} />
      </Card>

      {/* Categorical Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Devices</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Distribution by client device</p>
          <DeviceDonutChart data={analytics?.devices || []} isLoading={isLoading} />
        </Card>

        <Card className="p-5">
          <CardTitle className="text-base mb-1">Browsers</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Traffic by browser family</p>
          <BrowserBarChart data={analytics?.browsers || []} isLoading={isLoading} />
        </Card>

        <Card className="p-5">
          <CardTitle className="text-base mb-1">Operating Systems</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Platforms and OS</p>
          <OsBarChart data={analytics?.operating_systems || []} isLoading={isLoading} />
        </Card>

        <Card className="p-5">
          <CardTitle className="text-base mb-1">Top Referrers</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Inbound traffic sources</p>
          <ReferrerTable data={analytics?.referrers || []} isLoading={isLoading} />
        </Card>
      </div>

      {/* Full width Geo breakdown */}
      <Card className="p-6">
        <CardTitle className="text-base mb-1">Geographic Distribution</CardTitle>
        <p className="text-xs text-surface-400 mb-4">
          Country-level traffic when client headers or reverse proxy geo signals are available.
        </p>
        <GeoTable data={analytics?.countries || []} isLoading={isLoading} />
      </Card>
    </div>
  );
};
