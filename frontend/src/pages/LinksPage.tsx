import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { urlApi } from '../api';
import { URLItem } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateLinkModal } from '../components/links/CreateLinkModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { QrModal } from '../components/links/QrModal';
import {
  Search,
  Plus,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  BarChart3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Power,
} from 'lucide-react';

export const LinksPage: React.FC = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<URLItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'clicks_desc' | 'clicks_asc'>('newest');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<URLItem | null>(null);
  const [qrUrl, setQrUrl] = useState<URLItem | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<URLItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await urlApi.list({
        page,
        page_size: 15,
        search: debouncedSearch || undefined,
        filter_status: statusFilter,
        sort: sortBy,
      });
      setLinks(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      toast.error('Failed to load links', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortBy, toast]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopy = async (url: URLItem) => {
    try {
      await navigator.clipboard.writeText(url.short_url);
      setCopiedId(url.id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleToggleStatus = async (url: URLItem) => {
    try {
      const updated = await urlApi.update(url.id, { is_active: !url.is_active });
      setLinks((prev) => prev.map((item) => (item.id === url.id ? updated : item)));
      toast.success(`Link is now ${updated.is_active ? 'active' : 'disabled'}`);
    } catch (err: any) {
      toast.error('Failed to toggle link status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUrl) return;
    setIsDeleting(true);
    try {
      await urlApi.delete(deletingUrl.id);
      toast.success('Short link permanently deleted');
      setDeletingUrl(null);
      fetchLinks();
    } catch (err: any) {
      toast.error('Failed to delete short link');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Links</h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Search, filter, customize aliases, and monitor traffic across all shortened destinations.
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

      {/* Control Bar: Search, Status Filter, Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by code, alias, title, or URL..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-foreground placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="inline-flex rounded-lg border border-surface-300 dark:border-surface-700 p-1 bg-surface-100/60 dark:bg-surface-800/60 text-xs font-semibold">
            {(['all', 'active', 'disabled', 'expired'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-surface-500 hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="clicks_desc">Most Clicks</option>
            <option value="clicks_asc">Least Clicks</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : links.length === 0 ? (
        <EmptyState
          title="No links matched"
          description={
            searchTerm
              ? `No links matched your search term "${searchTerm}". Try resetting filters.`
              : 'You haven’t created any links in this status yet.'
          }
          actionText="Create Short Link"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-surface-200/80 dark:border-surface-800/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-200/80 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-900/50 text-xs font-bold uppercase tracking-wider text-surface-400">
                <tr>
                  <th className="py-3 px-4">Short Link</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/80 dark:divide-surface-800/80">
                {links.map((link) => {
                  const isExpired = link.expires_at && new Date(link.expires_at) <= new Date();

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                    >
                      {/* Short Link */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/links/${link.id}`}
                            className="hover:text-primary-500 transition-colors truncate max-w-[180px]"
                          >
                            {link.custom_alias ? `/${link.custom_alias}` : link.short_code}
                          </Link>
                          <a
                            href={link.short_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-surface-400 hover:text-foreground"
                            title="Open redirect destination"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {link.title && (
                          <div className="text-[11px] font-sans font-normal text-surface-400 truncate max-w-[180px]">
                            {link.title}
                          </div>
                        )}
                      </td>

                      {/* Original URL */}
                      <td className="py-3.5 px-4 text-surface-600 dark:text-surface-400 max-w-xs truncate text-xs">
                        <span title={link.original_url}>{link.original_url}</span>
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 font-semibold text-foreground text-xs">
                        {link.click_count.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <Badge variant="warning">Expired</Badge>
                        ) : link.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="error">Disabled</Badge>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-xs text-surface-400">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopy(link)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="Copy link"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setQrUrl(link)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/links/${link.id}`}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setEditingUrl(link)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              link.is_active
                                ? 'text-surface-400 hover:text-amber-500 hover:bg-amber-500/10'
                                : 'text-amber-500 hover:text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                            title={link.is_active ? 'Disable redirect' : 'Enable redirect'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingUrl(link)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-surface-200/80 dark:border-surface-800/80 flex items-center justify-between text-xs text-surface-500">
            <div>
              Showing {links.length} of {total} short links
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="font-semibold text-foreground px-1">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchLinks()}
      />
      <EditLinkModal
        url={editingUrl}
        isOpen={!!editingUrl}
        onClose={() => setEditingUrl(null)}
        onSuccess={(updated) => {
          setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }}
      />
      <QrModal url={qrUrl} isOpen={!!qrUrl} onClose={() => setQrUrl(null)} />
      <ConfirmDialog
        isOpen={!!deletingUrl}
        onClose={() => setDeletingUrl(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        isDestructive
        title="Delete Short Link"
        message={`Are you sure you want to delete ${deletingUrl?.short_url}? This action cannot be undone and redirects will immediately stop working.`}
        confirmText="Delete Link"
      />
    </div>
  );
};
