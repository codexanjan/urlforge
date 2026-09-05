import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TimelinePoint } from '../types';
import { useTheme } from '../hooks/useTheme';

interface ClickTimelineChartProps {
  data: TimelinePoint[];
  isLoading?: boolean;
}

export const ClickTimelineChart: React.FC<ClickTimelineChartProps> = ({ data, isLoading }) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return <div className="h-72 w-full animate-pulse bg-surface-200 dark:bg-surface-800/60 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center text-sm text-surface-400">
        No click data recorded yet for this time range.
      </div>
    );
  }

  const gridColor = isDark ? '#1f293d' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderColor: isDark ? '#1f293d' : '#e2e8f0',
              borderRadius: '0.75rem',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '0.8rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            name="Total Clicks"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#clickGradient)"
          />
          <Area
            type="monotone"
            dataKey="unique_visitors"
            name="Unique Visitors"
            stroke="#0284c7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#uniqueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
