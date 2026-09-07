"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export default function RequestRejectModal({
  open,
  loading = false,
  onClose,
  onConfirm,
}: Readonly<Props>) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setLocalError("");
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setLocalError("Enter at least 3 characters explaining the rejection.");
      return;
    }
    setLocalError("");
    await onConfirm(trimmed);
  };

  return (
    <Modal
      visible={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      contentClassName="max-w-md w-full"
    >
      <div className="space-y-4 pt-2 pr-6">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Reject request
          </h2>
        </div>

        <div>
          <Label htmlFor="request-reject-reason">Rejection reason</Label>
          <Textarea
            id="request-reject-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (localError) setLocalError("");
            }}
            placeholder="e.g. Missing supporting documents…"
            disabled={loading}
            className="mt-1.5 min-h-28"
            autoFocus
          />
          {localError ? (
            <p className="mt-1.5 text-sm text-destructive">{localError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Minimum 10 characters.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
          >
            Keep request
          </Button>
          <Button
            type="button"
            className="bg-[#DC2626] hover:bg-[#B91C1C]"
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            Confirm reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}
