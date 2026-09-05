import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { urlApi, analyticsApi } from '../api';
import { URLItem, URLAnalyticsResponse } from '../types';
import { useToast } from '../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { ClickTimelineChart } from '../charts/ClickTimelineChart';
import { DeviceDonutChart } from '../charts/DeviceDonutChart';
import { BrowserBarChart } from '../charts/BrowserBarChart';
import { ReferrerTable } from '../charts/ReferrerTable';
import { GeoTable } from '../charts/GeoTable';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { QrModal } from '../components/links/QrModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  MousePointerClick,
  Users,
} from 'lucide-react';

export const LinkDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [url, setUrl] = useState<URLItem | null>(null);
  const [analytics, setAnalytics] = useState<URLAnalyticsResponse | null>(null);
  const [days, setDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [urlData, analyticsData] = await Promise.all([
        urlApi.get(id),
        analyticsApi.getAnalytics(id, days),
      ]);
      setUrl(urlData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load link details');
    } finally {
      setIsLoading(false);
    }
  }, [id, days, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url.short_url);
      setCopied(true);
      toast.success('Copied link to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async () => {
    if (!url) return;
    setIsDeleting(true);
    try {
      await urlApi.delete(url.id);
      toast.success('Link deleted successfully');
      navigate('/links');
    } catch {
      toast.error('Failed to delete link');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Link not found</h2>
        <Link to="/links">
          <Button variant="primary">Return to My Links</Button>
        </Link>
      </div>
    );
  }

  const isExpired = url.expires_at && new Date(url.expires_at) <= new Date();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button and title */}
      <div>
        <Link
          to="/links"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all links</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono truncate">
                {url.custom_alias ? `/${url.custom_alias}` : url.short_code}
              </h1>
              {isExpired ? (
                <Badge variant="warning">Expired</Badge>
              ) : url.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="error">Disabled</Badge>
              )}
            </div>
            {url.title && <p className="text-sm font-medium text-foreground">{url.title}</p>}
            <p className="text-xs text-surface-400 truncate max-w-2xl">{url.original_url}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>

            <a href={url.short_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" leftIcon={<ExternalLink className="w-4 h-4" />}>
                Open
              </Button>
            </a>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsQrOpen(true)}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              QR Code
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsDeleteOpen(true)}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
            <MousePointerClick className="w-3.5 h-3.5 text-primary-500" />
            Total Recorded Clicks
          </div>
          <div className="text-2xl font-extrabold text-foreground">{url.click_count.toLocaleString()}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-sky-500" />
            Unique Visitors
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.overview.unique_visitors.toLocaleString() || 0}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            Created On
          </div>
          <div className="text-base font-bold text-foreground">
            {new Date(url.created_at).toLocaleDateString()}
          </div>
          {url.expires_at && (
            <div className="text-xs text-amber-500 mt-0.5">
              Expires: {new Date(url.expires_at).toLocaleString()}
            </div>
          )}
        </Card>
      </div>

      {/* Analytics Timeline Section */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Click Velocity Timeline</CardTitle>
            <p className="text-xs text-surface-400 mt-0.5">
              Interactive timeseries of visits and unique visitors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Days pills */}
            <div className="inline-flex rounded-lg border border-surface-300 dark:border-surface-700 p-1 bg-surface-100/60 dark:bg-surface-800/60 text-xs font-semibold">
              {[
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

            {/* Export buttons */}
            <a href={analyticsApi.getExportUrl(url.id, 'csv')} download>
              <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />}>
                CSV
              </Button>
            </a>
          </div>
        </div>

        {/* Timeline Chart */}
        <ClickTimelineChart data={analytics?.timeline || []} />
      </Card>

      {/* Categorical Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Devices */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Devices</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Traffic by device category</p>
          <DeviceDonutChart data={analytics?.devices || []} />
        </Card>

        {/* Browsers */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Browsers</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Client user agent engines</p>
          <BrowserBarChart data={analytics?.browsers || []} />
        </Card>

        {/* Referrers */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Top Referrers</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Traffic source distribution</p>
          <ReferrerTable data={analytics?.referrers || []} />
        </Card>

        {/* Geographic */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Geographic</CardTitle>
          <p className="text-xs text-surface-400 mb-4">Country level activity</p>
          <GeoTable data={analytics?.countries || []} />
        </Card>
      </div>

      {/* Modals */}
      <EditLinkModal
        url={url}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => setUrl(updated)}
      />
      <QrModal url={url} isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        isDestructive
        title="Delete Short Link"
        message={`Delete ${url.short_url} and all its analytics permanently? This action cannot be reversed.`}
        confirmText="Delete"
      />
    </div>
  );
};
