"use client";

import React from "react";
import Modal from "@/components/modal/page";
import VisitorForm from "@/components/resident/visitor-form/page";

export function VisitorUpsertModal({
  open,
  mode,
  selectedVisitorId,
  residentId,
  estateId,
  addressId,
  onSubmitSuccess,
  onClose,
}: Readonly<{
  open: boolean;
  mode: "create" | "edit";
  selectedVisitorId: string | null;
  residentId: string;
  estateId: string;
  addressId: string | { id: string; data: { block: string; unit: string } };
  onSubmitSuccess: () => void | Promise<void>;
  onClose: () => void;
}>) {
  if (!open) return null;

  return (
    <Modal visible={open} onClose={onClose}>
      <VisitorForm
        visitorId={mode === "edit" ? selectedVisitorId ?? undefined : undefined}
        residentId={residentId}
        estateId={estateId}
        addressId={addressId ?? ""}
        onSubmitSuccess={onSubmitSuccess}
        onClose={onClose}
      />
    </Modal>
  );
}

