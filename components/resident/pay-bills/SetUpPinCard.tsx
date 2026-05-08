"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmitPin?: (pin: string) => Promise<void> | void;
};

const PIN_LENGTH = 4;
const EMPTY_PIN = (): string[] => Array(PIN_LENGTH).fill("");

// ─── Sub-component: PinInputRow ───────────────────────────────────────────────

export interface PinInputRowProps {
  label: string;
  digits: string[];
  onChange: (next: string[]) => void;
  hasError?: boolean;
  autoFocusFirst?: boolean;
  /** Omit the label row (e.g. authorise-PIN step where the parent shows the title). */
  hideLabel?: boolean;
}

export function PinInputRow({
  label,
  digits,
  onChange,
  hasError = false,
  autoFocusFirst = false,
  hideLabel = false,
}: PinInputRowProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocusFirst) {
      // Small delay so the element is painted before focus
      const t = setTimeout(() => refs.current[0]?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocusFirst]);

  const baseClass =
    "w-[60px] h-[64px] rounded-xl border text-center text-xl font-medium outline-none transition-all duration-150 caret-transparent select-none";
  const normalClass =
    "border-border bg-muted/50 text-foreground focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/20";
  const errorClass =
    "border-red-400 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-300";

  function focusAt(idx: number) {
    refs.current[Math.max(0, Math.min(PIN_LENGTH - 1, idx))]?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[idx]) {
        // Clear current cell
        const next = [...digits];
        next[idx] = "";
        onChange(next);
      } else {
        // Move back and clear previous
        const prev = idx - 1;
        if (prev >= 0) {
          const next = [...digits];
          next[prev] = "";
          onChange(next);
          focusAt(prev);
        }
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(idx - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(idx + 1);
      return;
    }

    // Digit keys — handle here instead of onChange to avoid double-fire
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const next = [...digits];
      next[idx] = e.key;
      onChange(next);
      // Advance focus
      focusAt(idx + 1);
      return;
    }

    // Block everything else (letters, symbols, etc.)
    if (e.key.length === 1) e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    // This fires on mobile/autofill — strip non-digits and take last char
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    if (raw.length > 1) {
      // Handle paste into a single cell — fill across cells
      const chars = raw.slice(0, PIN_LENGTH - idx).split("");
      const next = [...digits];
      chars.forEach((ch, i) => {
        if (idx + i < PIN_LENGTH) next[idx + i] = ch;
      });
      onChange(next);
      focusAt(Math.min(idx + chars.length, PIN_LENGTH - 1));
      return;
    }

    const next = [...digits];
    next[idx] = raw;
    onChange(next);
    focusAt(idx + 1);
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLInputElement>,
    startIdx: number,
  ) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      if (startIdx + i < PIN_LENGTH) next[startIdx + i] = ch;
    });
    onChange(next);
    focusAt(Math.min(startIdx + pasted.length, PIN_LENGTH - 1));
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    // Select all so the next keydown replaces the digit cleanly
    e.target.select();
  }

  return (
    <div className="space-y-3">
      {!hideLabel ? (
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex gap-3">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            // Value is always 1 char or empty — never let React blank it mid-type
            value={d}
            maxLength={2} // allow 2 so onChange sees old+new on mobile
            aria-label={`${label} digit ${idx + 1}`}
            className={`${baseClass} ${hasError ? errorClass : normalClass}`}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={(e) => handlePaste(e, idx)}
            onFocus={handleFocus}
            autoComplete="one-time-code"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SetUpPinCard({
  title = "Set Up PIN",
  description = "Set up a transaction PIN to securely and seamlessly pay for airtime, data, and other bills.",
  submitLabel = "Submit",
  onSubmitPin,
}: Readonly<Props>) {
  const [pin, setPin] = useState<string[]>(EMPTY_PIN());
  const [confirmPin, setConfirmPin] = useState<string[]>(EMPTY_PIN());
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const pinValue = pin.join("");
  const confirmValue = confirmPin.join("");
  const pinComplete = pin.every(Boolean);
  const confirmComplete = confirmPin.every(Boolean);
  const canSubmit = pinComplete && confirmComplete && !mismatch && !submitting;

  // Only flag mismatch after confirm is fully filled to avoid premature red flash
  useEffect(() => {
    setMismatch(confirmComplete ? pinValue !== confirmValue : false);
  }, [pinValue, confirmValue, confirmComplete]);

  async function handleSubmit() {
    if (!onSubmitPin) return;
    if (!pinComplete) return void toast.error("Please enter your 4-digit PIN.");
    if (!confirmComplete) return void toast.error("Please confirm your PIN.");
    if (pinValue !== confirmValue)
      return void toast.error("PINs do not match. Please try again.");

    try {
      setSubmitting(true);
      await onSubmitPin(pinValue);
      setPin(EMPTY_PIN());
      setConfirmPin(EMPTY_PIN());
      setMismatch(false);
    } catch (err: any) {
      toast.error(
        err?.message ?? err?.payload?.message ?? "Failed to set PIN.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8 w-full text-center overflow-y-auto">
      <div className="mb-8 max-w-xs mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-6 max-w-xs mx-auto">
        <PinInputRow label="Enter PIN" digits={pin} onChange={setPin} />

        {pinComplete && (
          <>
            <hr className="border-border" />
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <PinInputRow
                label="Confirm PIN"
                digits={confirmPin}
                onChange={setConfirmPin}
                hasError={mismatch}
                autoFocusFirst
              />
              {mismatch && (
                <p className="mt-2 text-xs text-red-500 animate-in fade-in duration-150">
                  PINs do not match. Please re-enter.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {pinComplete && (
        <div className="mt-8 space-y-3 max-w-xs mx-auto animate-in fade-in duration-200">
          <Button
            type="button"
            className="w-full h-12 text-sm font-medium"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}
