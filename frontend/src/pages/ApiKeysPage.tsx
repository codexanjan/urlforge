import React, { useState, useEffect, useCallback } from 'react';
import { apiKeyApi } from '../api';
import { ApiKeyItem, ApiKeyCreated } from '../types';
import { useToast } from '../hooks/useToast';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Key, Plus, Copy, Check, Trash2, AlertTriangle, Terminal, ExternalLink } from 'lucide-react';

export const ApiKeysPage: React.FC = () => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create Key Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdKeyData, setCreatedKeyData] = useState<ApiKeyCreated | null>(null);

  // Revoke Dialog
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const fetchKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiKeyApi.list();
      setKeys(data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await apiKeyApi.create(keyName.trim());
      setCreatedKeyData(created);
      setIsCreateOpen(false);
      setKeyName('');
      fetchKeys();
      toast.success('API key generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingKey) return;
    setIsRevoking(true);
    try {
      await apiKeyApi.revoke(revokingKey.id);
      toast.success('API key has been revoked');
      setRevokingKey(null);
      fetchKeys();
    } catch {
      toast.error('Failed to revoke key');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyCreatedKey = async () => {
    if (!createdKeyData) return;
    try {
      await navigator.clipboard.writeText(createdKeyData.key);
      setCopiedKey(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Developer API Keys</h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            Authenticate programmatic REST API requests using secret developer tokens.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Generate New API Key
        </Button>
      </div>

      {/* API Keys Table */}
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : keys.length === 0 ? (
        <EmptyState
          title="No API keys generated"
          description="Create an API key to integrate URL shortening into your CLI, GitHub actions, or backend applications."
          icon={<Key className="w-7 h-7" />}
          actionText="Generate API Key"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-surface-200/80 dark:border-surface-800/80 bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-200/80 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-900/50 text-xs font-bold uppercase tracking-wider text-surface-400">
              <tr>
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Token Prefix</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/80 dark:divide-surface-800/80">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground text-xs">{k.name}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-surface-500">
                    {k.key_prefix}••••••••••••
                  </td>
                  <td className="py-3.5 px-4 text-xs text-surface-400">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-surface-400">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3.5 px-4">
                    {k.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-200 dark:bg-surface-800 text-surface-400">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {k.is_active && (
                      <button
                        onClick={() => setRevokingKey(k)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-medium"
                        title="Revoke API key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Code Examples Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary-500" />
            <CardTitle className="text-base">Quickstart REST Examples</CardTitle>
          </div>
          <a
            href="http://localhost:8000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:underline font-semibold"
          >
            <span>Interactive OpenAPI Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-surface-400">
          Authenticate requests by providing your key in the <code className="text-primary-400 font-mono">X-API-Key</code> HTTP header.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 text-surface-200 overflow-x-auto space-y-2">
            <div className="text-surface-500 text-[11px] font-sans font-bold uppercase">Create a short URL</div>
            <code>
              curl -X POST "http://localhost:8000/api/v1/urls" \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-H "X-API-Key: uf_live_your_token_here" \<br />
              &nbsp;&nbsp;-d '{`{"original_url": "https://example.com/docs", "custom_alias": "my-docs"}`}'
            </code>
          </div>

          <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 text-surface-200 overflow-x-auto space-y-2">
            <div className="text-surface-500 text-[11px] font-sans font-bold uppercase">Fetch Link Analytics</div>
            <code>
              curl -X GET "http://localhost:8000/api/v1/urls/{`{url_id}`}/analytics?days=30" \<br />
              &nbsp;&nbsp;-H "X-API-Key: uf_live_your_token_here"
            </code>
          </div>
        </div>
      </Card>

      {/* Modal: Generate Key */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Developer API Key"
        description="Provide a memorable label to identify where this key is deployed."
        maxWidth="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Key Name / Identifier"
            placeholder="e.g. Production CI/CD or Mobile App"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            autoFocus
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Generate Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Show Key Once Alert */}
      <Modal
        isOpen={!!createdKeyData}
        onClose={() => setCreatedKeyData(null)}
        title="API Key Created Successfully"
        description="Please copy your secret key now. You will never be able to view it again!"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Store this token securely in environment variables or password managers. URLForge stores only a secure SHA-256 hash.
            </span>
          </div>

          <div className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-foreground truncate select-all">
              {createdKeyData?.key}
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={copyCreatedKey}
              leftIcon={copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedKey ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setCreatedKeyData(null)}>
              I Have Saved My Key
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirmation */}
      <ConfirmDialog
        isOpen={!!revokingKey}
        onClose={() => setRevokingKey(null)}
        onConfirm={handleRevoke}
        isLoading={isRevoking}
        isDestructive
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${revokingKey?.name}"? Any applications or integrations using this key will immediately receive 401 Unauthorized.`}
        confirmText="Revoke Key"
      />
    </div>
  );
};
