"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IsoDatePicker } from "@/components/ui/iso-date-picker";
import { cn } from "@/lib/utils";

export function toInterestStartDate(value?: string | null): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return "";
}

const RECURRING_FREQUENCIES = new Set(["monthly", "quarterly", "yearly"]);

/** Hide start date for recurring bills (monthly, quarterly, yearly) and service charges. */
export function shouldHideInterestStartsAt(
  frequency?: string,
  isServiceCharge = false,
): boolean {
  if (isServiceCharge) return true;
  const normalized = (frequency ?? "").toLowerCase().replace(/[_-]/g, "");
  return RECURRING_FREQUENCIES.has(normalized);
}

type AccrueInterestFieldsProps = {
  accrueInterest: boolean;
  interestRatePercent: string;
  interestStartsAt: string;
  onAccrueInterestChange: (value: boolean) => void;
  onInterestRateChange: (value: string) => void;
  onInterestStartsAtChange: (value: string) => void;
  disabled?: boolean;
  idPrefix: string;
  /** Hide the interest starts date (recurring frequencies and service charges). */
  hideInterestStartsAt?: boolean;
};

export function AccrueInterestFields({
  accrueInterest,
  interestRatePercent,
  interestStartsAt,
  onAccrueInterestChange,
  onInterestRateChange,
  onInterestStartsAtChange,
  disabled = false,
  idPrefix,
  hideInterestStartsAt = false,
}: AccrueInterestFieldsProps) {
  const toggleId = `${idPrefix}-accrue-interest`;
  const rateId = `${idPrefix}-interest-rate`;
  const startsAtId = `${idPrefix}-interest-starts-at`;

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={toggleId} className="font-medium">
          Accrue interest
        </Label>
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={accrueInterest}
          aria-label="Accrue interest"
          disabled={disabled}
          onClick={() => onAccrueInterestChange(!accrueInterest)}
          className={cn(
            "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
            "transition-colors duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            accrueInterest ? "bg-[#0150AC]" : "bg-black/15",
          )}
        >
          <span
            className={cn(
              "block size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
              accrueInterest ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </div>
      <p className="text-sm text-red-500 font-medium">
        When enabled, overdue bills will accrue interest at the percentage you
        set below. The interest rate is applied monthly, rather than annually.
      </p>
      {accrueInterest ? (
        <>
          <div>
            <Label htmlFor={rateId}>Interest rate (%)</Label>
            <Input
              id={rateId}
              type="text"
              inputMode="decimal"
              value={interestRatePercent}
              onChange={(e) => onInterestRateChange(e.target.value)}
              placeholder="2.5"
              disabled={disabled}
              required
              className="mt-1"
            />
          </div>
          {!hideInterestStartsAt ? (
            <div>
              <Label htmlFor={startsAtId}>Interest starts date</Label>
              <div className="mt-1">
                <IsoDatePicker
                  id={startsAtId}
                  value={interestStartsAt}
                  onChange={onInterestStartsAtChange}
                  placeholder="Select start date"
                  disabled={disabled}
                  ariaLabel="Interest starts date"
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
