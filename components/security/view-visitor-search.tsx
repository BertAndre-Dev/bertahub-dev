"use client";

import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getVisitorDetailsByCode } from "@/redux/slice/security/visitor/visitor";
import {
  setActiveVisitor,
  setLookupSource,
} from "@/redux/slice/security/visitor/visitor-slice";
import { normalizeBarcodeInput } from "@/lib/utils";
import {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/lib/api-error";
import { Eye, ScanLine, ShieldCheck } from "lucide-react";
import BarcodeScannerModal from "@/components/security/barcode-scanner-modal";
import type { VisitorDetailsData } from "@/app/(platform)/dashboard/security/types";
import type { VisitorVerificationFlags } from "@/lib/visitor-verification-mode";
import { getVerificationFlags } from "@/lib/visitor-verification-mode";

interface ViewVisitorSearchProps {
  onDetailsLoaded?: (visitor: VisitorDetailsData | null) => void;
  /** How the last lookup was performed (typed code vs camera scan). */
  onLookupSource?: (source: "code" | "scan") => void;
  verificationFlags?: VisitorVerificationFlags;
  verificationDescription?: string | null;
  /** When embedded in a modal, drop the outer page card chrome. */
  embedded?: boolean;
}

function ScannerGraphic() {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <div className="absolute inset-0">
        <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-[#3B82F6] rounded-tl-sm" />
        <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-[#3B82F6] rounded-tr-sm" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-[#3B82F6] rounded-bl-sm" />
        <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-[#3B82F6] rounded-br-sm" />
      </div>
      <div className="absolute inset-6">
        <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-slate-500" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-slate-500" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-slate-500" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-slate-500" />
      </div>
      <div className="absolute left-4 right-4 top-1/2 flex -translate-y-1/2 items-center">
        <div className="h-px flex-1 bg-[#3B82F6]/80" />
        <div className="mx-1 h-2 w-8 rounded-full bg-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
        <div className="h-px flex-1 bg-[#3B82F6]/80" />
      </div>
    </div>
  );
}

export default function ViewVisitorSearch({
  onDetailsLoaded,
  onLookupSource,
  verificationFlags,
  verificationDescription,
  embedded = false,
}: ViewVisitorSearchProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const flags = verificationFlags ?? getVerificationFlags(null);
  const loading = useSelector(
    (state: RootState) =>
      state.securityVisitor?.viewDetailsStatus === "isLoading",
  );

  const [code, setCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const primaryLabel = flags.verifyOnly ? "Verify code" : "View visitor";
  const PrimaryIcon = flags.verifyOnly ? ShieldCheck : Eye;
  const scanLabel = flags.verifyOnly ? "Scan to verify" : "Scan visitor";

  let helperText =
    "Open the camera to scan a visitor QR code. You can enter a code to view the visitor, or scan with the camera.";
  if (verificationDescription?.trim()) {
    helperText = verificationDescription.trim();
  } else if (flags.viewOnly) {
    helperText =
      "Open the camera to scan a visitor QR code, or enter a code to view the visitor. Viewing or scanning records that you have checked this visitor.";
  } else if (flags.verifyOnly) {
    helperText =
      "Open the camera to scan a visitor QR code, or enter a code to verify the visitor.";
  }

  const loadVisitorDetails = useCallback(
    async (rawCode: string, source: "code" | "scan") => {
      const trimmed = normalizeBarcodeInput(rawCode);
      if (!trimmed) {
        toast.warning("Enter visitor code or scan value");
        return;
      }

      try {
        const res = await dispatch(
          getVisitorDetailsByCode({ code: trimmed }),
        ).unwrap();

        setCode(trimmed);
        dispatch(setLookupSource(source));
        onLookupSource?.(source);

        const visitor =
          (res as { data?: VisitorDetailsData })?.data ?? null;
        if (visitor) {
          dispatch(setActiveVisitor(visitor));
          onDetailsLoaded?.(visitor);
        }

        const apiMessage = getApiSuccessMessage(res);
        if (apiMessage) toast.success(apiMessage);
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
        dispatch(setActiveVisitor(null));
        onDetailsLoaded?.(null);
      }
    },
    [dispatch, onDetailsLoaded, onLookupSource],
  );

  const handlePrimaryAction = () => {
    void loadVisitorDetails(code, "code");
  };

  const handleScanned = useCallback(
    (value: string) => {
      setScannerOpen(false);
      void loadVisitorDetails(value, "scan");
    },
    [loadVisitorDetails],
  );

  return (
    <>
      <Card
        className={
          embedded
            ? "w-full border-0 shadow-none p-0"
            : "mx-auto w-full p-6 sm:p-8 shadow-lg"
        }
      >
        <CardHeader className={embedded ? "p-0 pb-4" : "p-0"}>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
            Scan Visitor
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 space-y-6">
          <div className="flex flex-col items-center gap-5">
            <div className="bg-[#1B2430] p-4 rounded-2xl">
              <ScannerGraphic />
            </div>
            <p className="max-w-md text-center text-sm text-muted-foreground leading-relaxed">
              {helperText}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={(e) => setCode(normalizeBarcodeInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePrimaryAction();
              }}
              placeholder="EZR-4FTX or paste visitor code"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handlePrimaryAction}
              disabled={loading}
              variant="outline"
              className="h-10 sm:h-auto shrink-0 rounded-xl"
            >
              <PrimaryIcon className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : primaryLabel}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            {scanLabel}
          </Button>
        </CardContent>
      </Card>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanned}
        scannerElementId="visitor-view-details-scanner"
      />
    </>
  );
}
