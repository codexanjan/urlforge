import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-6 shadow-inner">
        <Compass className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">
        Error 404
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
        Page or link not found
      </h1>

      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md mb-8 leading-relaxed">
        The destination you are trying to reach does not exist, has expired, or may have been permanently removed.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
