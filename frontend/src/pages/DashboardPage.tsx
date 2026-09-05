import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateLinkModal } from '../components/links/CreateLinkModal';
import { QrModal } from '../components/links/QrModal';
import { ShareModal } from '../components/links/ShareModal';
import { urlApi } from '../api';
import { URLItem } from '../types';
import { useToast } from '../hooks/useToast';
import {
  Link2,
  MousePointerClick,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  Copy,
  Check,
  QrCode,
  Share2,
  BarChart3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedUrlForQr, setSelectedUrlForQr] = useState<URLItem | null>(null);
  const [selectedUrlForShare, setSelectedUrlForShare] = useState<URLItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await urlApi.list({ page: 1, page_size: 5, sort: 'newest' });
      setUrls(res.items);
      setTotalCount(res.total);
    } catch (err: any) {
      toast.error('Failed to load dashboard data', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();

    const handleCreated = () => fetchDashboardData();
    window.addEventListener('urlforge:link-created', handleCreated);
    return () => window.removeEventListener('urlforge:link-created', handleCreated);
  }, [fetchDashboardData]);

  const handleCopy = async (url: URLItem) => {
    try {
      await navigator.clipboard.writeText(url.short_url);
      setCopiedId(url.id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const totalClicks = urls.reduce((acc, u) => acc + u.click_count, 0);
  const activeCount = urls.filter((u) => u.is_active).length;
  const expiredCount = urls.filter((u) => u.expires_at && new Date(u.expires_at) <= new Date()).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || 'Developer'}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Monitor link performance, generate QR codes, and create short links.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Short Link
        </Button>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Total Links
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3">{totalCount}</div>
            <div className="text-xs text-surface-400 mt-1">Managed destinations</div>
          </Card>

          <Card className="p-5" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Total Clicks
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-surface-400 mt-1">Tracked across all URLs</div>
          </Card>

          <Card className="p-5" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Active Links
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3">{activeCount}</div>
            <div className="text-xs text-surface-400 mt-1">Directly routing visitors</div>
          </Card>

          <Card className="p-5" hover>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Expired Links
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground mt-3">{expiredCount}</div>
            <div className="text-xs text-surface-400 mt-1">Passed validity window</div>
          </Card>
        </div>
      )}

      {/* Recent Links Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Short Links</h2>
            <p className="text-xs text-surface-400">Your most recently generated short URLs.</p>
          </div>

          <Link to="/links">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              View All Links
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : urls.length === 0 ? (
          <EmptyState
            title="No links yet"
            description="Create your first short link to start tracking real-time click analytics."
            actionText="Create Short Link"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="rounded-xl border border-surface-200/80 dark:border-surface-800/80 bg-card overflow-hidden shadow-sm divide-y divide-surface-200/80 dark:divide-surface-800/80">
            {urls.map((link) => {
              const isExpired = link.expires_at && new Date(link.expires_at) <= new Date();

              return (
                <div
                  key={link.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/links/${link.id}`}
                        className="font-mono text-sm font-bold text-foreground hover:text-primary-500 transition-colors truncate"
                      >
                        {link.short_url}
                      </Link>

                      {isExpired ? (
                        <Badge variant="warning">Expired</Badge>
                      ) : link.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="error">Disabled</Badge>
                      )}
                    </div>

                    <div className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-xl">
                      {link.title ? `${link.title} — ` : ''}
                      {link.original_url}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-surface-400 pt-0.5">
                      <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {link.click_count.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(link)}
                      leftIcon={copiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    >
                      {copiedId === link.id ? 'Copied' : 'Copy'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUrlForQr(link)}
                      leftIcon={<QrCode className="w-4 h-4" />}
                      aria-label="View QR Code"
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUrlForShare(link)}
                      leftIcon={<Share2 className="w-4 h-4" />}
                      aria-label="Share Link"
                    />

                    <Link to={`/links/${link.id}`}>
                      <Button size="sm" variant="outline" leftIcon={<BarChart3 className="w-4 h-4" />}>
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
      <QrModal
        url={selectedUrlForQr}
        isOpen={!!selectedUrlForQr}
        onClose={() => setSelectedUrlForQr(null)}
      />
      <ShareModal
        url={selectedUrlForShare}
        isOpen={!!selectedUrlForShare}
        onClose={() => setSelectedUrlForShare(null)}
        onOpenQr={() => {
          setSelectedUrlForQr(selectedUrlForShare);
          setSelectedUrlForShare(null);
        }}
      />
    </div>
  );
};
