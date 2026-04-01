"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full max-w-full";

/** Shown next to every date field for consistent affordance. */
const datePickerIcon = (
  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
);

export function parseIsoToDate(value: string | undefined | null): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, month, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function dateToIsoString(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export type IsoDatePickerProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  /** @deprecated use ariaLabel */
  "aria-label"?: string;
  ariaLabel?: string;
};

export function IsoDatePicker({
  id,
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  disabled,
  className,
  "aria-label": ariaLabelKebab,
  ariaLabel,
}: IsoDatePickerProps) {
  const aria = ariaLabel ?? ariaLabelKebab;
  return (
    <DatePicker
      id={id}
      selected={parseIsoToDate(value)}
      onChange={(d: Date | null) => onChange(dateToIsoString(d))}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      minDate={parseIsoToDate(minDate) ?? undefined}
      maxDate={parseIsoToDate(maxDate) ?? undefined}
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      showPopperArrow={false}
      showIcon
      icon={datePickerIcon}
      ariaLabel={aria}
    />
  );
}

export type IsoDateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartChange: (iso: string) => void;
  onEndChange: (iso: string) => void;
  startId?: string;
  endId?: string;
  startAriaLabel?: string;
  endAriaLabel?: string;
  disabled?: boolean;
  className?: string;
};

type LinkedRangeBase = {
  startDate: string;
  endDate: string;
  onStartChange: (iso: string) => void;
  onEndChange: (iso: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Start half of a linked range (pair with `IsoLinkedRangeEnd`). */
export function IsoLinkedRangeStart({
  startDate,
  endDate,
  onStartChange,
  id,
  ariaLabel,
  disabled,
  className,
}: Omit<LinkedRangeBase, "onEndChange"> & {
  id?: string;
  ariaLabel?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  return (
    <DatePicker
      id={id}
      selected={s}
      onChange={(d: Date | null) => onStartChange(dateToIsoString(d))}
      selectsStart
      startDate={s}
      endDate={e}
      maxDate={e ?? undefined}
      dateFormat="yyyy-MM-dd"
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      showPopperArrow={false}
      showIcon
      icon={datePickerIcon}
      ariaLabel={ariaLabel}
    />
  );
}

/** End half of a linked range (pair with `IsoLinkedRangeStart`). */
export function IsoLinkedRangeEnd({
  startDate,
  endDate,
  onEndChange,
  id,
  ariaLabel,
  disabled,
  className,
}: Omit<LinkedRangeBase, "onStartChange"> & {
  id?: string;
  ariaLabel?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  return (
    <DatePicker
      id={id}
      selected={e}
      onChange={(d: Date | null) => onEndChange(dateToIsoString(d))}
      selectsEnd
      startDate={s}
      endDate={e}
      minDate={s ?? undefined}
      dateFormat="yyyy-MM-dd"
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      showPopperArrow={false}
      showIcon
      icon={datePickerIcon}
      ariaLabel={ariaLabel}
    />
  );
}

/** Linked start/end pickers (`selectsStart` / `selectsEnd`). State remains YYYY-MM-DD strings at the boundary. */
export function IsoDateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startId,
  endId,
  startAriaLabel,
  endAriaLabel,
  disabled,
  className,
}: IsoDateRangePickerProps) {
  return (
    <>
      <IsoLinkedRangeStart
        id={startId}
        startDate={startDate}
        endDate={endDate}
        onStartChange={onStartChange}
        ariaLabel={startAriaLabel}
        disabled={disabled}
        className={className}
      />
      <IsoLinkedRangeEnd
        id={endId}
        startDate={startDate}
        endDate={endDate}
        onEndChange={onEndChange}
        ariaLabel={endAriaLabel}
        disabled={disabled}
        className={className}
      />
    </>
  );
}
