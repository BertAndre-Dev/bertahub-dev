"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
import { ReceiptCard } from "@/components/receipt/ReceiptCard";
import { mapBillReceipt, mapVendReceipt } from "@/components/receipt/map-receipt";
import { downloadReceiptPng, shareReceiptPdf } from "@/components/receipt/share-receipt";
import type {
  EnergyListItem,
  PaidBillData,
  ReceiptParty,
  ReceiptType,
} from "@/components/receipt/types";

export type ReceiptModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  type: ReceiptType;
  bill?: PaidBillData | null;
  vend?: EnergyListItem | null;
  party?: ReceiptParty;
}>;

export function ReceiptModal({
  isOpen,
  onClose,
  type,
  bill,
  vend,
  party,
}: ReceiptModalProps) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const sourceReady = type === "bill" ? Boolean(bill) : Boolean(vend);
  const visible = isOpen && sourceReady;

  const receipt = useMemo(() => {
    if (type === "bill" && bill) return mapBillReceipt(bill, party);
    if (type === "vend" && vend) return mapVendReceipt(vend, party);
    return null;
  }, [type, bill, vend, party]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  const pngName = `receipt-${receipt?.fileBaseName ?? "receipt"}.png`;
  const pdfName = `receipt-${receipt?.fileBaseName ?? "receipt"}.pdf`;

  const runExport = useCallback(
    async (action: () => Promise<void>) => {
      if (!cardRef.current || !receipt) return;
      setExporting(true);
      try {
        await action();
      } catch {
        toast.error("Couldn't export this receipt — try again");
      } finally {
        setExporting(false);
      }
    },
    [receipt],
  );

  const handleDownload = useCallback(() => {
    const node = cardRef.current;
    if (!node) return;
    void runExport(() => downloadReceiptPng(node, pngName));
  }, [pngName, runExport]);

  const handleShare = useCallback(() => {
    const node = cardRef.current;
    if (!node || !receipt) return;
    void runExport(() =>
      shareReceiptPdf({
        node,
        title: receipt.title,
        filename: pdfName,
      }),
    );
  }, [pdfName, receipt, runExport]);

  const motionTransition = reduceMotion
    ? { duration: 0.16 }
    : { type: "spring" as const, bounce: 0, duration: 0.4 };

  return (
    <AnimatePresence>
      {visible && receipt ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.16 : 0.2 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            className="relative max-h-[min(92vh,920px)] w-full max-w-[440px] overflow-y-auto rounded-xl shadow-2xl"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={motionTransition}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="receipt-title" className="sr-only">
              {receipt.title}
            </h2>
            <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/50 bg-white/75 px-1.5 py-1 shadow-lg backdrop-blur-[20px] backdrop-saturate-150 motion-reduce:backdrop-blur-none [@media(prefers-reduced-transparency:reduce)]:bg-white [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none">
                <IconTooltip label="Share PDF">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full active:scale-[0.97] motion-reduce:active:scale-100"
                    onClick={handleShare}
                    disabled={exporting}
                    aria-label="Share receipt as PDF"
                  >
                    <Share2 className="size-4" />
                  </Button>
                </IconTooltip>
                <IconTooltip label="Download">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full active:scale-[0.97] motion-reduce:active:scale-100"
                    onClick={handleDownload}
                    disabled={exporting}
                    aria-label={
                      exporting ? "Preparing download" : "Download receipt"
                    }
                  >
                    <Download className="size-4" />
                  </Button>
                </IconTooltip>
              </div>
            </div>
            <div ref={cardRef}>
              <ReceiptCard receipt={receipt} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
