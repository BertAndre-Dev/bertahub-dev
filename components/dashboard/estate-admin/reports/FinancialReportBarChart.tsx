"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  formatNairaCompact,
  formatNairaFull,
  type FinancialChartCategory,
  type FinancialChartPoint,
} from "./financial-report-chart-utils";

const COLORS: Record<"vending" | "bills" | "expenses", string> = {
  vending: "#0150AC",
  bills: "#A7C5E8",
  expenses: "#739FD7",
};

const LABELS: Record<string, string> = {
  vending: "Vending",
  bills: "Bills",
  expenses: "Expenses",
};

const FIXED_Y_TICKS = [0, 50_000, 100_000, 500_000, 1_000_000] as const;

function SkeletonBars() {
  return (
    <div className="h-[380px] w-full flex items-end justify-center gap-6 px-6 py-8">
      {[
        { key: "sk1", h: 140 },
        { key: "sk2", h: 220 },
        { key: "sk3", h: 180 },
      ].map((b) => (
        <div
          key={b.key}
          className="w-16 rounded-md bg-muted/60 animate-pulse"
          style={{ height: `${b.h}px` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[380px] w-full grid place-items-center">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No data for the selected period.</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting the date range.
        </p>
      </div>
    </div>
  );
}

export interface FinancialReportBarChartProps {
  loading: boolean;
  series: Array<FinancialChartPoint & { label: string }>;
  category: FinancialChartCategory;
}

export function FinancialReportBarChart({
  loading,
  series,
  category,
}: Readonly<FinancialReportBarChartProps>) {
  const keys = useMemo((): Array<"vending" | "bills" | "expenses"> => {
    if (category === "bills") return ["bills", "expenses"];
    if (category === "vending") return ["vending", "expenses"];
    return ["vending", "bills", "expenses"];
  }, [category]);

  const hasKey = (k: "vending" | "bills" | "expenses") => keys.includes(k);

  const legendPayload = useMemo(() => {
    return keys.map((k) => ({
      value: LABELS[String(k)] ?? String(k),
      type: "square" as const,
      id: String(k),
      color: COLORS[k],
    }));
  }, [keys]);

  // Ensure the bars use a Y-scale that covers the data, so heights align with the axis values.
  // Must be declared before any early returns to keep Hooks order stable.
  const yMax = useMemo(() => {
    let max = 0;
    for (const row of series) {
      for (const k of keys) {
        const v = Number((row as any)?.[k] ?? 0);
        if (Number.isFinite(v)) max = Math.max(max, v);
      }
    }
    return Math.max(1_000_000, max);
  }, [series, keys]);

  if (loading) return <SkeletonBars />;
  if (!series.length) return <EmptyState />;

  const isDay = series.length > 0 && series[0]?.label?.includes("-");
  const minWidth = isDay ? `max(100%, ${series.length * 60}px)` : "100%";
  const barSize = isDay
    ? 18
    : series.length <= 1
      ? 22
      : Math.min(40, Math.max(16, Math.floor(400 / ((series.length || 1) * 2))));

  const X_AXIS_HEIGHT = 28;
  const LEGEND_HEIGHT = 28;
  const CHART_MARGIN = {
    top: 8,
    right: 12,
    bottom: X_AXIS_HEIGHT + LEGEND_HEIGHT,
    left: 0,
  };

  return (
    <div className="h-[380px]">
      <div className="flex h-full">
        {/* Sticky Y-axis */}
        <div className="w-[74px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              barSize={barSize}
              barCategoryGap="30%"
              margin={CHART_MARGIN}
            >
              <ReferenceLine y={0} stroke="#e5e7eb" />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={74}
                domain={[0, yMax]}
                ticks={[...FIXED_Y_TICKS]}
                tickFormatter={(v: any) => formatNairaCompact(Number(v))}
              />
              {/* Reserve the same bottom space as the main chart's XAxis + Legend */}
              <XAxis hide dataKey="label" height={X_AXIS_HEIGHT} />
              <Legend content={() => null} height={LEGEND_HEIGHT} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scrollable chart */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden cursor-pointer">
          <div style={{ minWidth }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={series}
                barCategoryGap={18}
                barSize={barSize}
                margin={CHART_MARGIN}
              >
                {/* Hidden YAxis so bars share the same scale as the sticky axis */}
                <YAxis hide domain={[0, yMax]} ticks={[...FIXED_Y_TICKS]} />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <ReferenceLine y={0} stroke="#e5e7eb" />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  height={X_AXIS_HEIGHT}
                />

                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatNairaFull(Number(value)),
                    LABELS[String(name)] ?? String(name),
                  ]}
                  labelFormatter={String}
                />

                <Legend
                  verticalAlign="bottom"
                  align="center"
                  height={LEGEND_HEIGHT}
                  wrapperStyle={{ cursor: "pointer" }}
                  payload={legendPayload as any}
                />

                {/* Stacked revenue */}
                {hasKey("vending") && (
                  <Bar
                    dataKey="vending"
                    stackId="revenue-stack"
                    fill={COLORS.vending}
                    radius={[6, 6, 0, 0]}
                    minPointSize={3}
                    cursor="pointer"
                  />
                )}

                {hasKey("bills") && (
                  <Bar
                    dataKey="bills"
                    stackId="revenue-stack"
                    fill={COLORS.bills}
                    radius={[6, 6, 0, 0]}
                    minPointSize={3}
                    cursor="pointer"
                  />
                )}

                {/* Expenses */}
                {hasKey("expenses") && (
                  <Bar
                    dataKey="expenses"
                    fill={COLORS.expenses}
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}