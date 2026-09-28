"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type {
  PlatformFeeCards,
  PlatformFeeSourceStat,
} from "@/types/analytics";

type SourceEntry = {
  key: string;
  stat: PlatformFeeSourceStat;
};

function isSourceStat(value: unknown): value is PlatformFeeSourceStat {
  return (
    typeof value === "object" &&
    value !== null &&
    "total" in value &&
    "count" in value
  );
}

function getSourceEntries(cards: PlatformFeeCards): SourceEntry[] {
  return Object.entries(cards).flatMap(([key, value]) => {
    if (key === "total" || key === "count") return [];
    if (!isSourceStat(value)) return [];
    return [{ key, stat: value }];
  });
}

function formatSourceLabel(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "—";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

type PlatformFeeSourceGridProps = Readonly<{
  cards: PlatformFeeCards;
  className?: string;
}>;

export function PlatformFeeSourceGrid({
  cards,
  className,
}: PlatformFeeSourceGridProps) {
  const sources = getSourceEntries(cards);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6",
        className,
      )}
    >
      {sources.map(({ key, stat }) => {
        const count = Number(stat.count ?? 0);
        return (
          <Card
            key={key}
            className={cn(
              "p-4 transition-opacity",
              count === 0 && "opacity-50",
            )}
          >
            <p className="text-sm text-muted-foreground">
              {formatSourceLabel(key)}
            </p>
            <p className="mt-1 truncate font-heading text-lg font-bold tabular-nums text-foreground">
              {formatTransactionAmount(Number(stat.total ?? 0))}
            </p>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {count.toLocaleString()} txn{count === 1 ? "" : "s"}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export default PlatformFeeSourceGrid;
