"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmitPin?: (payload: { newPin: string }) => Promise<void> | void;
};

const PIN_LENGTH = 4;
const EMPTY_PIN = (): string[] => new Array(PIN_LENGTH).fill("");

// ─── Sub-component: PinInputRow ───────────────────────────────────────────────

type PinInputRowProps = Readonly<{
  label: string;
  digits: string[];
  onChange: (next: string[]) => void;
  hasError?: boolean;
  autoFocusFirst?: boolean;
}>;

function PinInputRow({
  label,
  digits,
  onChange,
  hasError = false,
  autoFocusFirst = false,
}: PinInputRowProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocusFirst) {
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
        const next = [...digits];
        next[idx] = "";
        onChange(next);
      } else {
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

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const next = [...digits];
      next[idx] = e.key;
      onChange(next);
      focusAt(idx + 1);
      return;
    }

    if (e.key.length === 1) e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const raw = e.target.value.replaceAll(/\D/g, "");
    if (!raw) return;

    if (raw.length > 1) {
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
      .replaceAll(/\D/g, "")
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
    e.target.select();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-2">
        {digits.map((d, idx) => (
          <input
            key={`${label}-${idx}`}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            value={d}
            maxLength={2}
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

export function UpdatePinCard({
  title = "Update PIN",
  description = "Choose a new 4-digit PIN for bill payments.",
  submitLabel = "Update PIN",
  onSubmitPin,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [newPin, setNewPin] = useState<string[]>(EMPTY_PIN());
  const [confirmPin, setConfirmPin] = useState<string[]>(EMPTY_PIN());
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const newValue = newPin.join("");
  const confirmValue = confirmPin.join("");

  const newComplete = newPin.every(Boolean);
  const confirmComplete = confirmPin.every(Boolean);

  const canSubmit = newComplete && confirmComplete && !mismatch && !submitting;

  useEffect(() => {
    setMismatch(confirmComplete ? newValue !== confirmValue : false);
  }, [newValue, confirmValue, confirmComplete]);

  function handleReset() {
    setOpen(false);
    setNewPin(EMPTY_PIN());
    setConfirmPin(EMPTY_PIN());
    setMismatch(false);
  }

  async function handleSubmit() {
    if (!onSubmitPin) return;
    if (!newComplete) {
      toast.error("Please enter your new 4-digit PIN.");
      return;
    }
    if (!confirmComplete) {
      toast.error("Please confirm your new PIN.");
      return;
    }
    if (newValue !== confirmValue) {
      toast.error("PINs do not match. Please try again.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitPin({ newPin: newValue });
      handleReset();
    } catch (err: any) {
      toast.error(
        err?.message ?? err?.payload?.message ?? "Failed to update PIN.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8 w-full text-center h-[230px] min-h-[220px] overflow-y-auto">
      <div className="mb-8 max-w-xs mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      {open ? (
        <>
          <div className="space-y-3 max-w-xs mx-auto">
            <PinInputRow
              label="New PIN"
              digits={newPin}
              onChange={setNewPin}
              autoFocusFirst
            />

            {newComplete && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-6">
                <hr className="border-border" />
                <PinInputRow
                  label="Confirm New PIN"
                  digits={confirmPin}
                  onChange={setConfirmPin}
                  hasError={mismatch}
                  autoFocusFirst
                />
                {mismatch && (
                  <p className="text-xs text-red-500 animate-in fade-in duration-150">
                    PINs do not match. Please re-enter.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3 max-w-xs mx-auto animate-in fade-in duration-200">
            <Button
              type="button"
              className="w-full h-12 text-sm font-medium"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? "Updating..." : submitLabel}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-sm font-medium"
              disabled={submitting}
              onClick={handleReset}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="max-w-xs mx-auto">
          <Button
            type="button"
            className="w-full h-12 text-sm font-medium"
            onClick={() => setOpen(true)}
          >
            Update PIN
          </Button>
        </div>
      )}
    </Card>
  );
}
