import React from 'react';
import { Button } from './Button';
import { Link2 } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-surface-300 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/30">
      <div className="w-14 h-14 rounded-2xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-surface-500 mb-4 shadow-inner">
        {icon || <Link2 className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
};
