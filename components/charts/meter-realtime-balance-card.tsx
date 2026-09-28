"use client";

import { useMemo } from "react";
import { RefreshCw, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  computeBalanceGaugeFill,
  CONSUMED_COLOR,
  formatKwhValue,
  formatMeterRealtimeTimestamp,
  hasRealtimeBalanceUsage,
  mapRealtimeBalanceToStackedBar,
  REMAINING_COLOR,
  type MeterRealtimeBalanceData,
} from "@/lib/meter-realtime-balance";

export interface MeterRealtimeBalanceCardProps {
  readonly title?: string;
  readonly data: MeterRealtimeBalanceData | null;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly emptyMessage?: string | null;
  readonly className?: string;
}

type BarTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    color?: string;
  }>;
}>;

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums text-foreground">
          <span
            className="mr-2 inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {formatKwhValue(entry.value)} kWh
        </p>
      ))}
    </div>
  );
}

function formatKwh(value: number | null | undefined): string {
  return `${formatKwhValue(value)} kWh`;
}

export function MeterRealtimeBalanceCard({
  title = "Realtime meter balance",
  data,
  loading = false,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
}: MeterRealtimeBalanceCardProps) {
  const stackedBar = useMemo(
    () => mapRealtimeBalanceToStackedBar(data),
    [data],
  );
  const gaugeFill = useMemo(() => computeBalanceGaugeFill(data), [data]);
  const showUsed = hasRealtimeBalanceUsage(data);
  const timestampLabel = formatMeterRealtimeTimestamp(data?.timestamp);
  const totalEnergy = stackedBar[0]?.total ?? 0;
  const hasVisualData = Boolean(data);

  const comparisonBars = useMemo(() => {
    if (!data) return [];
    const balance = Math.max(0, Number(data.balance) || 0);
    const used = showUsed ? Math.max(0, Number(data.used) || 0) : 0;
    return [
      { name: "Remaining", value: balance, fill: REMAINING_COLOR },
      { name: "Consumed", value: used, fill: CONSUMED_COLOR },
    ];
  }, [data, showUsed]);

  const comparisonMax = useMemo(() => {
    const max = Math.max(...comparisonBars.map((b) => b.value), 0);
    return max > 0 ? max * 1.15 : 1;
  }, [comparisonBars]);

  const gaugeData = useMemo(
    () => [{ name: "Remaining", value: gaugeFill, fill: REMAINING_COLOR }],
    [gaugeFill],
  );

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live Meter Reading
          </p>
        </div>

        {onRefresh ? (
          <IconTooltip label="Refresh">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || refreshing}
              onClick={onRefresh}
              className="shrink-0 self-start"
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("mr-2 size-4", refreshing && "animate-spin")}
              />
            </Button>
          </IconTooltip>
        ) : null}
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Fetching live meter balance…</span>
          </div>
        ) : hasVisualData ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <div className="relative mx-auto h-[240px] w-full max-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="72%"
                  innerRadius="72%"
                  outerRadius="100%"
                  barSize={18}
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    max={100}
                    background={{ fill: "#E2E8F0" }}
                    fill={REMAINING_COLOR}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center">
                <div className="mb-1 flex items-center gap-1.5 text-[#0150AC]">
                  <Zap className="size-5" aria-hidden />
                </div>
                <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatKwhValue(data?.balance)}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  kWh remaining
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {showUsed ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Energy composition
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatKwh(totalEnergy)} total
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    {totalEnergy > 0 ? (
                      <div className="flex h-full w-full">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(Math.max(0, data?.balance ?? 0) / totalEnergy) * 100}%`,
                            backgroundColor: REMAINING_COLOR,
                          }}
                          title={`Remaining: ${formatKwh(data?.balance)}`}
                        />
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(Math.max(0, data?.used ?? 0) / totalEnergy) * 100}%`,
                            backgroundColor: CONSUMED_COLOR,
                          }}
                          title={`Consumed: ${formatKwh(data?.used)}`}
                        />
                      </div>
                    ) : (
                      <div className="h-full w-full bg-muted-foreground/20" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: REMAINING_COLOR }}
                      />
                      Remaining {formatKwh(data?.balance)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: CONSUMED_COLOR }}
                      />
                      Consumed {formatKwh(data?.used)}
                    </span>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  {showUsed ? "Balance vs consumption" : "Current balance"}
                </p>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonBars}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, comparisonMax]}
                        tickFormatter={(v) => `${v}`}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 12, fill: "#334155" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {comparisonBars.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {timestampLabel ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : emptyMessage ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default MeterRealtimeBalanceCard;
