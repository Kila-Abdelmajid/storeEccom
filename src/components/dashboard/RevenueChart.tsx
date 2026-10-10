'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  formatCurrency: (value: number) => string;
}

export default function RevenueChart({ data, formatCurrency }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-slate-400 bg-slate-50/30 rounded-2xl backdrop-blur-sm">
        No revenue data available
      </div>
    );
  }

  return (
    <div className="h-80 w-full" style={{ minHeight: '320px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          />
          <YAxis
            tickFormatter={(v) => (v == null ? '' : formatCurrency(Number(v)))}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          />
          <Tooltip
            formatter={(value) => (value == null ? '' : formatCurrency(Number(value)))}
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid rgba(203, 213, 225, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            itemStyle={{ color: '#c9a96e' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#c9a96e"
            strokeWidth={3}
            dot={{ fill: '#fbbf24', stroke: '#c9a96e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}