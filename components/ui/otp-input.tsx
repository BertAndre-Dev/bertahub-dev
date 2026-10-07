"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  length?: number;
  id?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  /** Accessible name for the group, e.g. "Reset Code". */
  label?: string;
}>;

function toDigits(value: string, length: number): string[] {
  const cleaned = value.replace(/\D/g, "").slice(0, length);
  return Array.from({ length }, (_, i) => cleaned[i] ?? "");
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  id,
  disabled = false,
  className,
  autoFocus = false,
  label = "Verification code",
}: OtpInputProps) {
  const digits = toDigits(value, length);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => refs.current[0]?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const emit = (next: string[]) => {
    onChange(next.join("").slice(0, length));
  };

  const focusAt = (index: number) => {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        emit(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        emit(next);
        focusAt(index - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const next = [...digits];
      next[index] = e.key;
      emit(next);
      if (index < length - 1) focusAt(index + 1);
      return;
    }

    if (e.key.length === 1) e.preventDefault();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (disabled) return;
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    if (raw.length > 1) {
      const chars = raw.slice(0, length - index).split("");
      const next = [...digits];
      chars.forEach((ch, offset) => {
        if (index + offset < length) next[index + offset] = ch;
      });
      emit(next);
      focusAt(Math.min(index + chars.length, length - 1));
      return;
    }

    const next = [...digits];
    next[index] = raw;
    emit(next);
    if (index < length - 1) focusAt(index + 1);
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startIndex: number,
  ) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;

    const next = [...digits];
    pasted.split("").forEach((ch, offset) => {
      if (startIndex + offset < length) next[startIndex + offset] = ch;
    });
    emit(next);
    focusAt(Math.min(startIndex + pasted.length, length - 1));
  };

  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-2 sm:gap-3", className)}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={digit}
          disabled={disabled}
          aria-label={`${label} digit ${index + 1}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className={cn(
            "h-12 w-10 rounded-xl border text-center text-lg font-semibold outline-none transition-all duration-150 sm:h-14 sm:w-12 sm:text-xl",
            "border-border bg-muted/50 text-foreground",
            "focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "caret-transparent select-none",
          )}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
