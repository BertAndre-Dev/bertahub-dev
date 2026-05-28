"use client";

import React from "react";
import Modal from "@/components/modal/page";
import OccupantForm from "@/components/resident/occupant-form/page";

export function OccupantUpsertModal({
  open,
  addressId,
  onSubmitSuccess,
  onClose,
}: Readonly<{
  open: boolean;
  addressId: string | { id: string; data: { block: string; unit: string } };
  onSubmitSuccess: () => void | Promise<void>;
  onClose: () => void;
}>) {
  if (!open) return null;

  return (
    <Modal visible={open} onClose={onClose}>
      <OccupantForm
        addressId={addressId ?? ""}
        onSubmitSuccess={onSubmitSuccess}
        onClose={onClose}
      />
    </Modal>
  );
}

