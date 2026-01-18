import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
// IMPORT THE BUTTON
import { AIAnalysisButton } from '@/components/AiAnalysisButton';

interface RevenueData {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueLineChartProps {
  data: RevenueData[];
}

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({ data }) => {
  const hasData = data.some(d => d.revenue > 0);

  return (
    <Card>
      {/* MODIFIED HEADER: Added flex to position button */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Trend (Last 7 Days)
        </CardTitle>
        {/* ADDED BUTTON HERE */}
        <AIAnalysisButton type="revenue" data={data} />
      </CardHeader>
      
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No revenue data yet</p>
            <p className="text-sm text-muted-foreground/70">
              Revenue will appear here once bills are created
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};