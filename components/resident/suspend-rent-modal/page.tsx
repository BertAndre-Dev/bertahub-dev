"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";

export interface SuspendRentModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly tenantName: string;
  readonly onConfirm: (reason: string) => void | Promise<void>;
  readonly confirmLabel?: string;
  readonly loading?: boolean;
  /** Modal title. Default "Suspend Rent". */
  readonly title?: string;
  /** Optional body override. Defaults to a suspend confirmation. */
  readonly description?: React.ReactNode;
  /** Whether the reason/note field is shown and required. Default false. */
  readonly requireReason?: boolean;
  readonly reasonLabel?: string;
  readonly reasonPlaceholder?: string;
  readonly submittingLabel?: string;
}

export default function SuspendRentModal({
  visible,
  onClose,
  tenantName,
  onConfirm,
  confirmLabel = "Suspend",
  loading = false,
  title = "Suspend Rent",
  description,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "e.g. Payment default, lease violation",
  submittingLabel,
}: SuspendRentModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();

    if (requireReason && trimmed.length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    setError(null);
    try {
      await onConfirm(trimmed);
      setReason("");
      onClose();
    } catch {
      // Caller can toast; keep modal open
    }
  };

  const handleClose = () => {
    setReason("");
    setError(null);
    onClose();
  };

  const defaultDescription = (
    <>
      Are you sure you want to suspend{" "}
      <strong>{tenantName || "this item"}</strong>?
      {requireReason ? " Please provide a reason." : null}
    </>
  );

  return (
    <Modal visible={visible} onClose={handleClose}>
      <div className="p-2 max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {description ?? defaultDescription}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {requireReason ? (
            <div>
              <Label htmlFor="suspend-reason">{reasonLabel}</Label>
              <Input
                id="suspend-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={reasonPlaceholder}
                className="mt-1"
                disabled={loading}
                autoFocus
              />
              {error ? (
                <p className="text-sm text-destructive mt-1">{error}</p>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? submittingLabel ||
                  (confirmLabel.toLowerCase().includes("activate")
                    ? "Activating…"
                    : "Suspending…")
                : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
