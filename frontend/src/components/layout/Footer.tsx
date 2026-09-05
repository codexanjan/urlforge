import React from 'react';
import { Link } from 'react-router-dom';
import logoSvg from '../../assets/logo.svg';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-200/80 dark:border-surface-800/80 bg-surface-50 dark:bg-surface-950/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1 space-y-3">
            <img src={logoSvg} alt="URLForge" className="h-8 w-auto text-foreground" />
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              Short links. Smart analytics. Total control. High performance URL shortening infrastructure.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-surface-500 dark:text-surface-400">
              <li><Link to="/#shorten" className="hover:text-primary-500">Shorten URL</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-500">Link Management</Link></li>
              <li><Link to="/analytics" className="hover:text-primary-500">Analytics Engine</Link></li>
              <li><Link to="/api" className="hover:text-primary-500">Developer API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Resources</h4>
            <ul className="space-y-2 text-xs text-surface-500 dark:text-surface-400">
              <li>
                <a href="http://localhost:8000/api/docs" target="_blank" rel="noreferrer" className="hover:text-primary-500">
                  OpenAPI Documentation
                </a>
              </li>
              <li>
                <a href="http://localhost:8000/api/redoc" target="_blank" rel="noreferrer" className="hover:text-primary-500">
                  ReDoc
                </a>
              </li>
              <li>
                <a href="https://github.com/codexanjan/urlforge" target="_blank" rel="noreferrer" className="hover:text-primary-500">
                  GitHub Repository
                </a>
              </li>
              <li><Link to="/report" className="hover:text-primary-500">Report Abuse</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Privacy & Terms</h4>
            <ul className="space-y-2 text-xs text-surface-500 dark:text-surface-400">
              <li><Link to="/privacy" className="hover:text-primary-500">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-500">Terms of Service</Link></li>
              <li><span className="text-surface-400">IP-hashed analytics</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-400">
          <div>© {new Date().getFullYear()} URLForge. All rights reserved.</div>
          <div>Built with FastAPI, SQLAlchemy, PostgreSQL, and React.</div>
        </div>
      </div>
    </footer>
  );
};
