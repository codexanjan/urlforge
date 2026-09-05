import React, { useState, useEffect } from 'react';
import { adminApi, reportApi } from '../api';
import { AdminStats, AbuseReport } from '../types';
import { useToast } from '../hooks/useToast';
import { Card, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import {
  Users,
  Link2,
  MousePointerClick,
  ShieldAlert,
  Activity,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsData, reportsData, usersData] = await Promise.all([
        adminApi.getStats(),
        reportApi.list(),
        adminApi.getUsers(),
      ]);
      setStats(statsData);
      setReports(reportsData);
      setUsersList(usersData);
    } catch {
      toast.error('Failed to load admin telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReportAction = async (id: string, newStatus: 'RESOLVED' | 'DISMISSED') => {
    try {
      await reportApi.updateStatus(id, newStatus);
      toast.success(`Report marked as ${newStatus.toLowerCase()}`);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch {
      toast.error('Failed to update report status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-2">
          Administrator Privileges
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Administration</h1>
        <p className="text-xs text-surface-400 mt-1">
          Review system health, monitor platform growth, and investigate reported abusive links.
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-surface-400 font-semibold uppercase">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-primary-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{stats?.total_users}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-surface-400 font-semibold uppercase">
              <span>Total Links</span>
              <Link2 className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{stats?.total_urls}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-surface-400 font-semibold uppercase">
              <span>Active Links</span>
              <Link2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{stats?.active_urls}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-surface-400 font-semibold uppercase">
              <span>Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{stats?.total_clicks.toLocaleString()}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-surface-400 font-semibold uppercase">
              <span>System Health</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base font-bold text-emerald-500 mt-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {stats?.system_health}
            </div>
          </Card>
        </div>
      )}

      {/* Abuse Reports Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <CardTitle className="text-base">Abuse & Safety Reports ({reports.length})</CardTitle>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-surface-400 py-4">No pending abuse reports.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Reported Link</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {reports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {rep.short_url}
                    </td>
                    <td className="py-2.5 px-3 font-semibold uppercase text-rose-500">{rep.reason}</td>
                    <td className="py-2.5 px-3 text-surface-400 max-w-xs truncate">{rep.description || '—'}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          rep.status === 'PENDING'
                            ? 'warning'
                            : rep.status === 'RESOLVED'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-surface-400">{new Date(rep.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {rep.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReportAction(rep.id, 'RESOLVED')}
                            className="text-emerald-500"
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReportAction(rep.id, 'DISMISSED')}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Users Overview */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          <CardTitle className="text-base">Registered Creators ({usersList.length})</CardTitle>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 px-3 font-semibold text-foreground">{u.name}</td>
                  <td className="py-2.5 px-3 text-surface-400">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.role === 'ADMIN' ? 'purple' : 'default'}>{u.role}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.is_active ? 'success' : 'error'}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-surface-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
