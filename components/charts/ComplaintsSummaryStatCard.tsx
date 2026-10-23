"use client";

import { AlertCircle, MessagesSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/app/(platform)/dashboard/super-admin/dashboard/components/kpi-card";
import { cn } from "@/lib/utils";
import type { ComplaintsSummaryData } from "@/types/analytics";

type ComplaintsSummaryStatCardProps = Readonly<{
  data: ComplaintsSummaryData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function ComplaintsSummaryStatCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: ComplaintsSummaryStatCardProps) {
  const showError = Boolean(error) && !data && !loading;
  const total = Number(data?.totalComplaints ?? 0);

  if (showError) {
    return (
      <div
        className={cn(
          "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm",
          className,
        )}
      >
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Couldn’t load complaints
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error ?? "Something went wrong. Please try again."}
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div
        className={cn(
          "min-h-[140px] animate-pulse rounded-xl border border-border bg-muted/50 p-4 sm:p-5 md:p-6",
          className,
        )}
        aria-hidden
      >
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="mt-4 h-4 w-24 rounded bg-muted" />
        <div className="mt-2 h-8 w-16 rounded bg-muted" />
      </div>
    );
  }

  return (
    <KpiCard
      label="Total complaints"
      value={loading ? "—" : total.toLocaleString()}
      icon={MessagesSquare}
      iconBgClassName="bg-orange-500/10 text-orange-600"
      className={cn(loading && "opacity-60", className)}
    />
  );
}

export default ComplaintsSummaryStatCard;
