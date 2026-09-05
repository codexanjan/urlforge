import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { GithubIcon } from '../ui/GithubIcon';
import { LayoutDashboard, Link2, BarChart3 } from 'lucide-react';
import logoSvg from '../../assets/logo.svg';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200/80 dark:border-surface-800/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSvg} alt="URLForge Logo" className="h-9 w-auto text-foreground" />
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-surface-600 dark:text-surface-300">
          <Link to="/" className="hover:text-primary-500 transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="hover:text-primary-500 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link to="/links" className="hover:text-primary-500 transition-colors flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Links
          </Link>
          <Link to="/analytics" className="hover:text-primary-500 transition-colors flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </Link>
          <Link to="/report" className="hover:text-primary-500 transition-colors">
            Report Abuse
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/codexanjan/urlforge"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl text-surface-500 hover:text-foreground hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="GitHub Repository"
          >
            <GithubIcon className="w-5 h-5" />
          </a>

          <ThemeToggle />

          <Link to="/dashboard">
            <Button size="sm" variant="primary" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
              Open App
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
