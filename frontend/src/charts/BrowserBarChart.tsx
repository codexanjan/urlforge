import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { BreakdownItem } from '../types';
import { useTheme } from '../hooks/useTheme';

interface BrowserBarChartProps {
  data: BreakdownItem[];
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#64748b'];

export const BrowserBarChart: React.FC<BrowserBarChartProps> = ({ data, isLoading }) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return <div className="h-64 w-full animate-pulse bg-surface-200 dark:bg-surface-800/60 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-sm text-surface-400">
        No browser data recorded.
      </div>
    );
  }

  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={75}
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderColor: isDark ? '#1f293d' : '#e2e8f0',
              borderRadius: '0.75rem',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '0.8rem',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
