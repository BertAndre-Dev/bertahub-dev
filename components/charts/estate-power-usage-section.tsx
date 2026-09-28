"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";

import { PowerUsageCard } from "@/components/charts/power-usage-card";
import { EnergyUsagePeriodControl } from "@/components/charts/energy-usage-period-control";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  formatEstateUsageDateRange,
  mapEstateEnergyUsageToPowerUsage,
  type EstateEnergyUsageData,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

export type { EstateEnergyUsageRange };

export interface EstatePowerUsageSectionProps {
  readonly data: EstateEnergyUsageData | null;
  readonly loading?: boolean;
  readonly progress?: number | null;
  readonly range: EstateEnergyUsageRange;
  readonly onRangeChange: (range: EstateEnergyUsageRange) => void;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly emptyMessage?: string | null;
  readonly className?: string;
  readonly exportFileName?: string;
}

export function EstatePowerUsageSection({
  data,
  loading = false,
  progress = null,
  range,
  onRangeChange,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
  exportFileName = "estate_energy_usage",
}: EstatePowerUsageSectionProps) {
  const powerUsage = useMemo(
    () => mapEstateEnergyUsageToPowerUsage(data),
    [data],
  );
  const dateRangeLabel = formatEstateUsageDateRange(data?.from, data?.to);
  const showProgress = loading && typeof progress === "number";

  const headerActions = (
    <>
      <EnergyUsagePeriodControl
        value={range}
        onChange={onRangeChange}
        disabled={loading}
      />
      {onRefresh ? (
        <IconTooltip label="Refresh">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || refreshing}
            onClick={onRefresh}
            className="shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
            />
          </Button>
        </IconTooltip>
      ) : null}
    </>
  );

  const loadingContent = showProgress ? (
    <div className="flex flex-col items-center gap-2">
      <span>Aggregating estate usage… {Math.round(progress)}%</span>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#0150AC] transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
          }}
        />
      </div>
    </div>
  ) : undefined;

  return (
    <PowerUsageCard
      className={className}
      title="Energy Usage"
      data={powerUsage.points}
      totalUsageKwh={powerUsage.totalKwh}
      loading={loading}
      loadingContent={loadingContent}
      subtitle={!loading && dateRangeLabel ? dateRangeLabel : undefined}
      headerActions={headerActions}
      emptyMessage={emptyMessage ?? "No energy usage data for this period."}
      exportFileName={exportFileName}
    />
  );
}

export default EstatePowerUsageSection;
