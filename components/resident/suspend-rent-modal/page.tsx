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
}

/**
 * Reusable modal to confirm suspending a rent record.
 * Asks "Are you sure you want to suspend {tenantName}?" and requires a reason (API requirement).
 */
export default function SuspendRentModal({
  visible,
  onClose,
  tenantName,
  onConfirm,
  confirmLabel = "Suspend",
  loading = false,
  title = "Suspend Rent",
}: SuspendRentModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Reason is required.");
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

  return (
    <Modal visible={visible} onClose={handleClose}>
      <div className="p-2 max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to suspend{" "}
          <strong>{tenantName || "this item"}</strong>? Please provide a reason.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="suspend-reason">Reason (required)</Label>
            <Input
              id="suspend-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Payment default, lease violation"
              className="mt-1"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
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
              {loading ? "Suspending…" : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
