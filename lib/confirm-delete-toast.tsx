import type React from "react";

import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

type ConfirmDeleteToastArgs = {
  name?: string;
  prompt?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function confirmDeleteToast({
  name,
  prompt,
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmDeleteToastArgs) {
  const confirmId = toast.info(
    <div className="flex flex-col gap-2">
      {prompt ?? (
        <p className="text-sm">
          Are you sure you want to delete <strong>{name || "this item"}</strong>
          ?
        </p>
      )}
      <div className="flex justify-end gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.dismiss(confirmId)}
        >
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={async () => {
            toast.dismiss(confirmId);
            try {
              await onConfirm();
            } catch (err: any) {
              toast.error(err?.message || "Failed to delete.");
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>,
    {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      hideProgressBar: true,
      closeButton: false,
    },
  );

  return confirmId;
}
