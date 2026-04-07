"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

export interface VendingDataPoint {
  powerKwh: number
  value: number
}

interface VendingTrendChartProps {
  data?: VendingDataPoint[]
  className?: string
}

const defaultData: VendingDataPoint[] = [
  { powerKwh: 50, value: 2.9 },
  { powerKwh: 100, value: 2.2 },
  { powerKwh: 150, value: 1.2 },
  { powerKwh: 200, value: 2.3 },
  { powerKwh: 250, value: 2.8 },
  { powerKwh: 300, value: 3.5 },
]

// ✅ Explicit colors instead of CSS variables
const STROKE_COLOR = "#0150AC"
const FILL_COLOR = "#0150AC"

function formatY(value: number) {
  if (value >= 1) return `$₦{value}M`
  return `₦{value * 1000}K`
}

export function VendingTrendChart({
  data = defaultData,
  className,
}: VendingTrendChartProps) {
  return (
    <div className={cn("w-full h-[320px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
        >
          <defs>
            <linearGradient id="vendingArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL_COLOR} stopOpacity={0.3} />
              <stop offset="100%" stopColor={FILL_COLOR} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={true}
          />
          <XAxis
            dataKey="powerKwh"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Power Purchased (kWh)",
              position: "insideBottom",
              offset: -12,
              fontSize: 11,
              fill: "#94a3b8",
            }}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
            // ✅ Fixed: value is not an array
            formatter={(value: number) => [formatY(value), "Value"]}
            labelFormatter={(label) => `₦{label} kWh`}
            cursor={{ stroke: "#0150AC", strokeDasharray: "4 4" }}
          />
          <Area
            type="linear"
            dataKey="value"
            stroke={STROKE_COLOR}
            strokeWidth={2}
            fill="url(#vendingArea)"
            dot={{ fill: STROKE_COLOR, r: 4, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: STROKE_COLOR, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}