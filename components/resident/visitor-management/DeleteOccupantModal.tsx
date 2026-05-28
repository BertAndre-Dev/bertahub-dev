"use client";

import React from "react";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { ResidentOccupantData } from "./types";

export function DeleteOccupantModal({
  occupant,
  onClose,
  onConfirm,
}: Readonly<{
  occupant: ResidentOccupantData | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}>) {
  return (
    <DeleteModal
      visible={!!occupant}
      onClose={onClose}
      itemName={
        occupant
          ? `${occupant.firstName || ""} ${occupant.lastName || ""}`.trim() ||
            occupant.occupantCode ||
            "this occupant"
          : ""
      }
      title="Delete occupant"
      onConfirm={onConfirm}
    />
  );
}

