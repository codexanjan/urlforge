import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { userApi } from '../api';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { User, Lock, Sun, Moon, Monitor, Trash2, Shield, Eye } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Account Deletion Dialog
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingProfile(true);
    try {
      await userApi.updateProfile({ name: name.trim() });
      await refreshProfile();
      toast.success('Profile name updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await userApi.deleteAccount();
      toast.success('Account and associated data deleted permanently');
      await logout();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-xs text-surface-400 mt-1">
          Manage your personal profile, credentials, appearance, and privacy preferences.
        </p>
      </div>

      {/* 1. Profile Section */}
      <Card className="p-6 space-y-4">
        <div>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your public developer profile information.</CardDescription>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            helperText="Email address cannot be changed."
          />

          <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingProfile}>
            Save Profile
          </Button>
        </form>
      </Card>

      {/* 2. Security / Password Section */}
      <Card className="p-6 space-y-4">
        <div>
          <CardTitle>Security & Password</CardTitle>
          <CardDescription>Update your login credentials.</CardDescription>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingPassword}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* 3. Appearance Section */}
      <Card className="p-6 space-y-4">
        <div>
          <CardTitle>Appearance & Theme</CardTitle>
          <CardDescription>Choose how URLForge looks across your browser session.</CardDescription>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'light'
                ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20'
                : 'border-surface-200 dark:border-surface-800 text-surface-500 hover:text-foreground'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'dark'
                ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20'
                : 'border-surface-200 dark:border-surface-800 text-surface-500 hover:text-foreground'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
              theme === 'system'
                ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20'
                : 'border-surface-200 dark:border-surface-800 text-surface-500 hover:text-foreground'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>System</span>
          </button>
        </div>
      </Card>

      {/* 4. Privacy & Data Retention */}
      <Card className="p-6 space-y-4">
        <div>
          <CardTitle>Privacy Policy & Data Retention</CardTitle>
          <CardDescription>How your analytics telemetry and user records are handled.</CardDescription>
        </div>

        <div className="text-xs text-surface-500 dark:text-surface-400 space-y-2 leading-relaxed max-w-2xl">
          <p>
            • <strong>Salted IP Anonymization:</strong> IP addresses are converted into irreversible SHA-256 cryptographic hashes and raw IPs are never committed to permanent database records.
          </p>
          <p>
            • <strong>Retention Policy:</strong> Click analytics are retained according to the active instance configuration (default 365 days).
          </p>
          <p>
            • <strong>Telemetry Minimization:</strong> Only standard user-agent components, referrer strings, and country headers are processed for performance and device charts.
          </p>
        </div>
      </Card>

      {/* 5. Danger Zone / Account Deletion */}
      <Card className="p-6 border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
        <div>
          <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated short links.</CardDescription>
        </div>

        <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xl">
          Once deleted, all short links associated with your account will immediately stop redirecting and will return 404. All analytics logs, API keys, and sessions will be destroyed.
        </p>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete Account
        </Button>
      </Card>

      {/* Delete Account Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
        isDestructive
        title="Permanently Delete Account?"
        message="This action is completely irreversible. All your shortened URLs, custom aliases, click logs, and API keys will be immediately deleted from the database."
        confirmText="Yes, Delete My Account"
      />
    </div>
  );
};
