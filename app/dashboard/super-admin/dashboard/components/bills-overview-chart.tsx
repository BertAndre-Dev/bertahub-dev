"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

export interface BillsSegment {
  name: string;
  value: number;
  fill: string;
  label?: string;
}

interface BillsOverviewChartProps {
  readonly data?: BillsSegment[];
  readonly className?: string;
}

// Pie uses proportional values; labels show Naira or % per design
const defaultBillsData: BillsSegment[] = [
  {
    name: "Service Charge",
    value: 25,
    fill: "#3b82f6",
    label: "N50,000 Service Charge",
  },
  {
    name: "Wallet Topup",
    value: 15,
    fill: "#10b981",
    label: "N20,000 Wallet Topup",
  },
  {
    name: "Energy Vending",
    value: 25,
    fill: "#f59e0b",
    label: "N150,000 Energy Vending",
  },
  { name: "Others", value: 35, fill: "#ef4444", label: "35% Others" },
];

export function BillsOverviewChart({
  data = defaultBillsData,
  className,
}: BillsOverviewChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    label:
      d.label ??
      (d.name === "Others"
        ? `${d.value}%`
        : `N${(d.value / 1000).toFixed(0)}K ${d.name}`),
  }));

  return (
    <div className={cn("h-[260px] w-full sm:h-[300px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {displayData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              name === "Others"
                ? `${value}%`
                : `N${Number(value).toLocaleString()}`,
              name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            className="text-muted-foreground text-xs"
            formatter={(value, entry) => {
              const payload = entry.payload as BillsSegment | undefined;
              return payload?.label ?? String(value);
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
