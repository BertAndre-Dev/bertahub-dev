"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillsOverviewData {
  name: string;
  value: number;
  fill: string;
  label?: string;
}

interface BillsOverviewProps {
  data?: BillsOverviewData[];
  title?: string;
  subtitle?: string;
  period?: "day" | "month" | "year";
  onPeriodChange?: (period: "day" | "month" | "year") => void;
  onExport?: () => void;
  showExportButton?: boolean;
  showPeriodFilter?: boolean;
}

const DEFAULT_DATA = [
  { name: "Paid", value: 450, fill: "#10b981", label: "450" },
  { name: "Pending", value: 285, fill: "#f97316", label: "50" },
  { name: "Overdue", value: 180, fill: "#ef4444", label: "" },
];

export default function BillsOverview({
  data = DEFAULT_DATA,
  title = "Bills Overview",
  subtitle = "This month's comparison",
  period = "month",
  onPeriodChange,
  onExport,
  showExportButton = true,
  showPeriodFilter = true,
}: BillsOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "month" | "year">(
    period
  );

  const handlePeriodChange = (newPeriod: "day" | "month" | "year") => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const handleExport = () => {
    onExport?.();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ x, y, width, height, value, fill }: any) => {
    if (value > 100) {
      return (
        <g>
          <rect
            x={x + width - 50}
            y={y + height / 2 - 12}
            width="40"
            height="24"
            fill={fill}
            rx="4"
          />
          <text
            x={x + width - 30}
            y={y + height / 2 + 5}
            fill="white"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
          >
            {value > 200 ? "50" : value}
          </text>
        </g>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Filter */}
          {showPeriodFilter && (
            <div className="flex gap-2">
              {(["day", "month", "year"] as const).map((p) => (
                <Button
                  key={p}
                  variant={selectedPeriod === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange(p)}
                  className="capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
          )}

          {/* Export Button */}
          {showExportButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
              dataKey="name"
              type="category"
              stroke="var(--muted-foreground)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#8884d8"
              radius={[0, 8, 8, 0]}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
