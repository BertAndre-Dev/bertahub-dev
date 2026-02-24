"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardChartCardProps {
  title: string;
  totalLabel?: string;
  totalValue?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardChartCard({
  title,
  totalLabel,
  totalValue,
  children,
  className,
}: DashboardChartCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden p-4 sm:p-5 md:p-6",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {totalLabel != null && totalValue != null && (
          <p className="text-muted-foreground text-sm">
            {totalLabel}{" "}
            <span className="font-semibold text-foreground">{totalValue}</span>
          </p>
        )}
      </div>
      <div className="my-4 border-b border-border" aria-hidden />
      <div className="min-h-0 flex-1">{children}</div>
    </Card>
  );
}
