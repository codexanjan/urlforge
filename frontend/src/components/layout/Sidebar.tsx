import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Key,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import logoSvg from '../../assets/logo.svg';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Links', icon: Link2, to: '/links' },
    { label: 'Analytics', icon: BarChart3, to: '/analytics' },
    { label: 'Developer API', icon: Key, to: '/api' },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Console', icon: ShieldAlert, to: '/admin' });
  }

  return (
    <aside className="w-64 border-r border-surface-200/80 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-950/40 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand */}
      <div className="p-5 border-b border-surface-200/80 dark:border-surface-800/80">
        <NavLink to="/dashboard" className="block">
          <img src={logoSvg} alt="URLForge" className="h-8 w-auto text-foreground" />
        </NavLink>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-surface-600 dark:text-surface-400 hover:text-foreground hover:bg-surface-200/50 dark:hover:bg-surface-800/50'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-6 mt-6 border-t border-surface-200/80 dark:border-surface-800/80">
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">
            Resources
          </div>
          <a
            href="http://localhost:8000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-surface-500 hover:text-foreground rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink className="w-3.5 h-3.5" />
              API Reference
            </span>
          </a>
          <NavLink
            to="/report"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-surface-500 hover:text-foreground rounded-lg transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Report an Issue
          </NavLink>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-surface-200/80 dark:border-surface-800/80 bg-surface-100/40 dark:bg-surface-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'UF'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{user?.name || 'Developer'}</div>
              <div className="text-xs text-surface-400 truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
