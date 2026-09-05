import React from 'react';
import { BreakdownItem } from '../types';
import { MapPin } from 'lucide-react';

interface GeoTableProps {
  data: BreakdownItem[];
  isLoading?: boolean;
}

export const GeoTable: React.FC<GeoTableProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="h-64 w-full animate-pulse bg-surface-200 dark:bg-surface-800/60 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center text-sm text-surface-400">
        No geographic location data available yet.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-foreground truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {item.name}
            </span>
            <span className="text-surface-500 dark:text-surface-400">
              {item.count.toLocaleString()} ({item.percentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${Math.min(100, item.percentage)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
