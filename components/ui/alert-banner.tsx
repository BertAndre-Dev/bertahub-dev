"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertBannerVariant = "warning" | "info" | "destructive";

const variantStyles: Record<
  AlertBannerVariant,
  { container: string; icon: string; action: "default" | "outline" | "destructive" }
> = {
  warning: {
    container:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    action: "default",
  },
  info: {
    container:
      "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
    action: "default",
  },
  destructive: {
    container:
      "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-200",
    icon: "text-destructive",
    action: "destructive",
  },
};

export interface AlertBannerProps {
  message: string;
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: AlertBannerVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({
  message,
  title,
  actionLabel,
  actionHref,
  onAction,
  variant = "warning",
  dismissible = false,
  onDismiss,
  className,
}: AlertBannerProps) {
  const styles = variantStyles[variant];
  const showAction = Boolean(actionLabel && (actionHref || onAction));

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "border-b px-4 py-3 md:px-6",
        styles.container,
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AlertCircle
            className={cn("mt-0.5 size-5 shrink-0", styles.icon)}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            {title ? (
              <p className="text-sm font-semibold leading-none">{title}</p>
            ) : null}
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pl-4">
          {showAction && actionHref ? (
            <Button
              asChild
              size="sm"
              variant={styles.action}
              className="w-full sm:w-auto"
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}

          {showAction && !actionHref && onAction ? (
            <Button
              size="sm"
              variant={styles.action}
              className="w-full sm:w-auto"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}

          {dismissible && onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Dismiss alert"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
