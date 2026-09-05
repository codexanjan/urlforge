import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-1 rounded-lg bg-surface-200/70 dark:bg-surface-800/80 border border-surface-300/60 dark:border-surface-700/60 text-surface-500">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-white text-primary-600 shadow-sm'
            : 'hover:text-foreground'
        }`}
        title="Light theme"
        aria-label="Light theme"
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-surface-700 text-primary-400 shadow-sm'
            : 'hover:text-foreground'
        }`}
        title="Dark theme"
        aria-label="Dark theme"
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-surface-700 text-foreground shadow-sm'
            : 'hover:text-foreground'
        }`}
        title="System theme"
        aria-label="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};
