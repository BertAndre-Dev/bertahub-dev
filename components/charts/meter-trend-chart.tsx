"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

export interface MeterTrendDataPoint {
  label: string;
  value: number;
  [key: string]: unknown;
}

interface MeterTrendChartProps {
  readonly data?: MeterTrendDataPoint[];
  readonly title?: string;
  readonly subtitle?: string;
  readonly dataKey?: string;
  readonly valueLabel?: string;
  readonly height?: number;
}

export default function MeterTrendChart({
  data,
  title,
  subtitle,
  dataKey = "value",
  valueLabel = "Value",
  height = 260,
}: MeterTrendChartProps) {
  const chartData = Array.isArray(data) ? data : [];
  const hasData = chartData.length > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const p = payload[0].payload;
      const val = p[dataKey] ?? p.value ?? 0;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow border border-border text-sm">
          <p className="text-muted-foreground">{p.label ?? "Period"}</p>
          <p className="font-medium">{valueLabel}: {Number(val).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <Card className="p-6">
        {title && <h2 className="font-heading text-lg font-bold mb-1">{title}</h2>}
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        <div
          className="flex items-center justify-center text-muted-foreground text-sm"
          style={{ height }}
        >
          No trend data to display
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {title && <h2 className="font-heading text-lg font-bold mb-1">{title}</h2>}
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
