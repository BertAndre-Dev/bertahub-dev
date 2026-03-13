"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";

export interface DeleteModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Name of the item to delete (e.g. tenant name). */
  readonly itemName: string;
  readonly onConfirm: () => void | Promise<void>;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loading?: boolean;
  /** Modal title. Default "Delete". */
  readonly title?: string;
  /** Optional custom message. Default: "Are you sure you want to delete {itemName}? This action cannot be undone." */
  readonly message?: React.ReactNode;
}

export default function DeleteModal({
  visible,
  onClose,
  itemName,
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  title = "Delete",
  message,
}: DeleteModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Caller can toast; keep modal open
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-2 max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold mb-1">{title}</h2>
        {message ?? (
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete <strong>{itemName || "this item"}</strong>?
            This action cannot be undone.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
