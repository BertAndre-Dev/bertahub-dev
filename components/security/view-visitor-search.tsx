"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { getVisitorDetailsByCode } from "@/redux/slice/admin/visitor/visitor";
import { scanVisitor } from "@/redux/slice/security/visitor/visitor";
import {
  buildScanPayload,
  mapScanResponseToVisitorDetails,
} from "@/lib/security-visitor";
import { normalizeBarcodeInput } from "@/lib/utils";
import { QrCode, Search } from "lucide-react";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";

interface ViewVisitorSearchProps {
  onDetailsLoaded?: (visitor: VisitorDetailsData | null) => void;
}

export default function ViewVisitorSearch({
  onDetailsLoaded,
}: ViewVisitorSearchProps = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const handleView = async () => {
    const trimmed = normalizeBarcodeInput(code);
    if (!trimmed) {
      toast.warning("Enter visitor code or scan value");
      return;
    }

    try {
      setLoading(true);

      const res: { data: VisitorDetailsData } = await dispatch(
        getVisitorDetailsByCode({ code: trimmed }),
      ).unwrap();

      setCode(trimmed);
      onDetailsLoaded?.(res.data);
      toast.success("Visitor details retrieved");
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message || "Invalid visitor code",
      );
      onDetailsLoaded?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanVerify = async () => {
    const barcode = code.trim();
    if (!barcode) {
      toast.warning("Enter or scan a barcode / QR code");
      return;
    }

    try {
      setScanLoading(true);
      const res = await dispatch(
        scanVisitor(buildScanPayload(barcode)),
      ).unwrap();
      const visitor = mapScanResponseToVisitorDetails(res);
      if (visitor) {
        setCode(visitor.visitorCode ?? barcode);
        onDetailsLoaded?.(visitor);
      }
      toast.success(
        (res as { message?: string })?.message ??
          "Visitor verified successfully",
      );
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message ?? "Scan verification failed",
      );
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="mx-auto bg-white rounded-lg p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold">Visitor Verification</h2>
      <p className="text-sm text-muted-foreground -mt-4">
        Search to view visitor details, or scan to verify at the gate. Accepts
        visitor codes, verification codes, and QR barcode values.
      </p>

      <div className="space-y-2">
        <Label>Barcode / QR code / Visitor code</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={(e) => setCode(normalizeBarcodeInput(e.target.value))}
            placeholder="EZR-4FTX or scan QR code"
            className="flex-1"
          />
          <Button
            onClick={handleView}
            disabled={loading || scanLoading}
            variant="outline"
            className="sm:w-auto"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Loading..." : "View details"}
          </Button>
          <Button
            onClick={handleScanVerify}
            disabled={loading || scanLoading}
            className="sm:w-auto"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {scanLoading ? "Scanning..." : "Scan & verify"}
          </Button>
        </div>
      </div>
    </div>
  );
}
