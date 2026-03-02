"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { checkoutVisitor } from "@/redux/slice/security/visitor/visitor";
import { formatVisitorCode } from "@/lib/utils";
import type { AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";

interface ClockInOutTimeProps {
  clockedIn?: string | null;
  clockedOut?: string | null;
  title?: string;
  /** Pre-fill visitor code for clock out (e.g. from selected visitor). */
  initialClockOutCode?: string;
}

function formatTime(value?: string | null): string {
  if (!value) return "-- : -- --";

  if (/\d{1,2}\s*:\s*\d{2}\s*(AM|PM)/i.test(value)) return value;

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  return value;
}

export default function ClockInOutTime({
  clockedIn,
  clockedOut,
  title = "Clock in/out Time",
  initialClockOutCode,
}: ClockInOutTimeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [clockOutCode, setClockOutCode] = useState("");
  const [lastClockedOutTime, setLastClockedOutTime] = useState<string | null>(
    null,
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (initialClockOutCode) {
      setClockOutCode(formatVisitorCode(initialClockOutCode));
    }
  }, [initialClockOutCode]);

  const handleClockOut = async () => {
    const code = formatVisitorCode(clockOutCode).trim();
    if (!code) {
      toast.warning("Enter visitor code to clock out");
      return;
    }
    try {
      setCheckoutLoading(true);
      await dispatch(checkoutVisitor({ visitorCode: code })).unwrap();
      const now = new Date().toISOString();
      setLastClockedOutTime(now);
      toast.success("Visitor clocked out successfully");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Clock out failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const displayedClockedOut = clockedOut ?? lastClockedOutTime ?? null;

  return (
    <div className="bg-white shadow-md w-full rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-5">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Body: Clocked In / Clocked Out */}
      <div className="grid grid-cols-2 gap-5 px-8 sm:grid-cols-1 md:grid-cols-2 pb-6">
        {/* Clocked In */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-500">Clocked In</label>
          <div
            className={`h-10 px-5 flex items-center border border-gray-200 rounded-md text-base font-medium tracking-wide ${
              !clockedIn ? "text-gray-300" : "text-gray-900"
            }`}
          >
            {formatTime(clockedIn)}
          </div>
        </div>

        {/* Clocked Out */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Visitor code</Label>
            <Input
              value={clockOutCode}
              onChange={(e) =>
                setClockOutCode(formatVisitorCode(e.target.value))
              }
              placeholder="e.g. LEA-5DWR"
              className="h-10 max-w-xs"
            />
          </div>
          <Button
            onClick={handleClockOut}
            disabled={checkoutLoading}
            variant="default"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            {checkoutLoading ? "Clocking out…" : "Clock out"}
          </Button>
        </div>
      </div>
    </div>
  );
}
