"use client";

import { useMemo } from "react";
import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import {
  getNationalLengthRule,
  isNationalLengthValid,
  phoneLengthErrorMessage,
  sanitizeNationalDigits,
} from "@/lib/phone-e164";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (countryCode: string) => void;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  showWhatsAppHint?: boolean;
  name?: string;
};

function formatLengthHint(
  rule: NonNullable<ReturnType<typeof getNationalLengthRule>>,
) {
  if (rule.lengths.length === 1) return `${rule.lengths[0]} digits`;
  return `${rule.minLength}–${rule.maxLength} digits`;
}

function emitChange(
  onPhoneNumberChange: Props["onPhoneNumberChange"],
  name: string,
  value: string,
) {
  onPhoneNumberChange({
    target: { name, value },
    currentTarget: { name, value },
  } as React.ChangeEvent<HTMLInputElement>);
}

/**
 * Country code + national number. Enforces the selected country's expected
 * digit count (no leading 0) — e.g. Nigeria = 10.
 */
export default function InvitePhoneNumberField({
  id,
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = true,
  disabled,
  className,
  label = "WhatsApp phone number",
  showWhatsAppHint = true,
  name = "phoneNumber",
}: Readonly<Props>) {
  const countryId = `${id}-country`;
  const rule = useMemo(
    () => getNationalLengthRule(countryCode),
    [countryCode],
  );
  const national = sanitizeNationalDigits(phoneNumber);
  const digitCount = national.length;
  const lengthOk = !national || isNationalLengthValid(national, countryCode);
  const targetCount = rule
    ? rule.lengths.length === 1
      ? rule.lengths[0]!
      : rule.maxLength
    : null;
  // Only flag once the user has reached the minimum expected length but is still wrong.
  const inlineError =
    national && rule && !lengthOk && digitCount >= rule.minLength
      ? phoneLengthErrorMessage(national, countryCode)
      : null;

  let helperText =
    "Select a country code, then enter the national number without 0.";
  if (inlineError) helperText = inlineError;
  else if (rule) helperText = `Enter ${formatLengthHint(rule)} without the leading 0.`;

  const emitPhoneChange = (raw: string) => {
    let next = sanitizeNationalDigits(raw);
    if (rule) next = next.slice(0, rule.maxLength);
    emitChange(onPhoneNumberChange, name, next);
  };

  const handleCountryChange = (nextCode: string) => {
    onCountryCodeChange(nextCode);
    const nextRule = getNationalLengthRule(nextCode);
    if (!nextRule) return;
    const clipped = sanitizeNationalDigits(phoneNumber).slice(
      0,
      nextRule.maxLength,
    );
    if (clipped !== national) {
      emitChange(onPhoneNumberChange, name, clipped);
    }
  };

  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-1.5">
        <Label htmlFor={id} className="mb-0">
          {label}
        </Label>
        {showWhatsAppHint ? (
          <span className="relative inline-flex group">
            <button
              type="button"
              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[color,transform,background-color] duration-100 ease-out hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
              aria-label="WhatsApp number preferred for notifications"
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
            >
              WhatsApp number preferred for notifications.
            </span>
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex h-10 w-full min-w-0 overflow-hidden rounded-md border bg-background shadow-xs",
          "transition-[border-color,box-shadow] duration-100 ease-out",
          "focus-within:ring-[3px]",
          inlineError
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/30"
            : "border-input focus-within:border-ring focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <CountryCodeSelect
          id={countryId}
          value={countryCode}
          onChange={handleCountryChange}
          disabled={disabled}
          placeholder="+234"
          embedded
        />
        <span className="my-1.5 w-px shrink-0 bg-border" aria-hidden />
        <Input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={phoneNumber}
          onChange={(e) => emitPhoneChange(e.target.value)}
          placeholder={
            targetCount != null
              ? "8100001427".slice(0, targetCount)
              : "8100001427"
          }
          required={required}
          disabled={disabled}
          aria-invalid={inlineError ? true : undefined}
          aria-describedby={`${id}-phone-hint`}
          className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
      </div>

      <div
        id={`${id}-phone-hint`}
        className="mt-1.5 flex items-start justify-between gap-3 text-sm leading-snug"
      >
        <p
          className={cn(
            "font-medium transition-colors duration-100 ease-out",
            inlineError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {helperText}
        </p>
        {targetCount != null ? (
          <p
            className={cn(
              "shrink-0 tabular-nums tracking-tight transition-colors duration-100 ease-out",
              lengthOk && digitCount > 0 && "font-medium text-foreground",
              inlineError && "font-medium text-destructive",
              !lengthOk && !inlineError && "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {digitCount}/{targetCount}
          </p>
        ) : null}
      </div>
    </div>
  );
}
