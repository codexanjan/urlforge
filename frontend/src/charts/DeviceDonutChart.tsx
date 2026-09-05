import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BreakdownItem } from '../types';
import { useTheme } from '../hooks/useTheme';

interface DeviceDonutChartProps {
  data: BreakdownItem[];
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

export const DeviceDonutChart: React.FC<DeviceDonutChartProps> = ({ data, isLoading }) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return <div className="h-64 w-full animate-pulse bg-surface-200 dark:bg-surface-800/60 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-sm text-surface-400">
        No device data recorded.
      </div>
    );
  }

  return (
    <div className="h-64 w-full flex flex-col items-center">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="count"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? '#1f293d' : '#e2e8f0',
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.8rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-surface-600 dark:text-surface-300 font-medium">
              {item.name}
            </span>
            <span className="text-surface-400">({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
