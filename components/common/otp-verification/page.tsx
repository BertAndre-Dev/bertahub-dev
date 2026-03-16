"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OtpVerificationProps {
  /** Optional line showing where the code was sent, e.g. jo****@mail.com */
  emailHint?: string;
  /** Number of digits in the OTP. Default: 6 */
  length?: number;
  /** Initial countdown in seconds for the \"Resend code in\" label. Default: 60 */
  initialCountdown?: number;
  /** Whether the confirm action is currently submitting */
  submitting?: boolean;
  /** Optional inline error message to display below the inputs */
  errorMessage?: string | null;
  /** Called when the user clicks Cancel */
  onCancel: () => void;
  /** Called with the OTP code when the user clicks Confirm */
  onConfirm: (code: string) => void;
  /** Optional handler for resending the OTP using the same endpoint */
  onResend?: () => void;
}

const DEFAULT_LENGTH = 6;
const DEFAULT_COUNTDOWN = 60;

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  emailHint,
  length = DEFAULT_LENGTH,
  initialCountdown = DEFAULT_COUNTDOWN,
  submitting = false,
  errorMessage,
  onCancel,
  onConfirm,
  onResend,
}) => {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length }, () => ""),
  );
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Reset when length or initial countdown changes (or when mounted)
  useEffect(() => {
    setDigits(Array.from({ length }, () => ""));
    setCountdown(initialCountdown);
  }, [length, initialCountdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const code = useMemo(() => digits.join(""), [digits]);

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const handleChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        focusInput(index - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handleConfirmClick = () => {
    if (code.length !== length) return;
    onConfirm(code);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-6">
      <div className="flex flex-col items-center justify-center gap-y-2">
        <p className="text-sm text-muted-foreground text-center">
          A {length}-digit verification code has been sent
          <span className="font-bold">
            {emailHint
            ? ` to your email address ${emailHint}.`
            : " to your email."}{" "}
          </span>
          
        </p>

        <p className="text-sm text-muted-foreground text-center">
          Please enter the code to proceed with the withdrawal.
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-4 mx-4">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-xl rounded-lg border border-[#0072CE]"
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        {countdown > 0 ? (
          <>Resend code in 00:{countdown.toString().padStart(2, "0")}</>
        ) : onResend ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={onResend}
            disabled={submitting}
          >
            Resend code
          </button>
        ) : (
          <>You can request a new code.</>
        )}
      </p>

      {errorMessage && (
        <p className="text-xs text-red-500 text-center mt-2">{errorMessage}</p>
      )}

      <div className="flex justify-between gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          className="w-1/2"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="w-1/2"
          disabled={submitting || code.length !== length}
          onClick={handleConfirmClick}
        >
          {submitting ? "Processing..." : "Confirm"}
        </Button>
      </div>
    </div>
  );
};

export default OtpVerification;
