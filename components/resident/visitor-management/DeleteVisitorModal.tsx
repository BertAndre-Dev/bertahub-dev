"use client";

import React from "react";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { ResidentVisitorData } from "./types";

export function DeleteVisitorModal({
  visitor,
  onClose,
  onConfirm,
}: Readonly<{
  visitor: ResidentVisitorData | null;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return (
    <DeleteModal
      visible={!!visitor}
      onClose={onClose}
      itemName={
        visitor
          ? `${visitor.firstName || ""} ${visitor.lastName || ""}`.trim() ||
            visitor.visitorCode ||
            "this visitor"
          : ""
      }
      title="Delete visitor"
      onConfirm={onConfirm}
    />
  );
}

