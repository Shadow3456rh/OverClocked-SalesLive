import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
// IMPORT THE BUTTON
import { AIAnalysisButton } from '@/components/AIAnalysisButton';

interface ProductData {
  name: string;
  qty: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: ProductData[];
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => {
  const hasData = data.length > 0;

  // Truncate long product names
  const chartData = data.map(d => ({
    ...d,
    displayName: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
  }));

  return (
    <Card>
      {/* MODIFIED HEADER: Added flex to position button */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Top Selling Products
        </CardTitle>
        {/* ADDED BUTTON HERE */}
        <AIAnalysisButton type="products" data={data} />
      </CardHeader>
      
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No products sold yet</p>
            <p className="text-sm text-muted-foreground/70">
              Top products will appear here once bills are created
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`₹${value.toFixed(2)}`, 'Revenue'];
                  return [value, 'Qty Sold'];
                }}
                labelFormatter={(label) => {
                  const item = data.find(d => d.name.startsWith(label.replace('...', '')));
                  return item?.name || label;
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};