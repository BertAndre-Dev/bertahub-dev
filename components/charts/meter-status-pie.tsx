"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

export interface MeterStatusPieItem {
  name: string;
  value: number;
  fill?: string;
}

interface MeterStatusPieProps {
  readonly data?: MeterStatusPieItem[];
  readonly title?: string;
  readonly subtitle?: string;
  readonly height?: number;
}

const DEFAULT_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899"];

export default function MeterStatusPie({
  data,
  title,
  subtitle,
  height = 280,
}: MeterStatusPieProps) {
  const chartData = data?.filter((d) => d.value >= 0) ?? [];
  const hasData = chartData.length > 0 && chartData.some((d) => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const p = payload[0].payload;
      const total = chartData.reduce((s, d) => s + d.value, 0);
      const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow border border-border text-sm">
          <p className="font-medium">{p.name}</p>
          <p className="text-muted-foreground">
            {p.value} ({pct}%)
          </p>
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
          No data to display
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {title && <h2 className="font-heading text-lg font-bold mb-1">{title}</h2>}
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
