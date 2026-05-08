"use client";

import { Button } from "@/components/ui/button";

export type BillPaymentResultModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  success: boolean;
  title: string;
  message: string;
  reference?: string;
}>;

export function BillPaymentResultModal({
  open,
  onClose,
  success,
  title,
  message,
  reference,
}: BillPaymentResultModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-labelledby="bill-pay-result-title"
        aria-describedby="bill-pay-result-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={
              success
                ? "flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive"
            }
          >
            {success ? (
              <svg
                className="size-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="size-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <h2
            id="bill-pay-result-title"
            className="mt-4 text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          <p
            id="bill-pay-result-desc"
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {message}
          </p>
          {/* {reference ? (
            <p className="mt-3 w-full rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs text-foreground break-all">
              Reference: {reference}
            </p>
          ) : null} */}
        </div>
        <Button type="button" className="mt-6 w-full h-11" onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  );
}
