"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardSectionProps = Readonly<{
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

export function DashboardSection({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section
      id={`dashboard-section-${id}`}
      aria-labelledby={`dashboard-section-heading-${id}`}
      className={cn("scroll-mt-[9.5rem] space-y-4 sm:space-y-5", className)}
    >
      <div className="space-y-0.5">
        <h2
          id={`dashboard-section-heading-${id}`}
          className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("space-y-4 sm:space-y-5", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
