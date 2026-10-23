"use client";

import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";

export function UserStatusModal({
  visible,
  onClose,
  userName,
  mode,
  onConfirm,
  loading,
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly userName: string;
  readonly mode: "suspend" | "activate";
  readonly onConfirm: (text: string) => void | Promise<void>;
  readonly loading?: boolean;
}) {
  const isSuspend = mode === "suspend";
  return (
    <SuspendRentModal
      visible={visible}
      onClose={onClose}
      tenantName={userName}
      title={isSuspend ? "Suspend User" : "Activate User"}
      confirmLabel={isSuspend ? "Suspend" : "Activate"}
      requireReason
      reasonLabel={isSuspend ? "Reason" : "Note"}
      reasonPlaceholder={
        isSuspend
          ? "e.g. Outstanding service charge / policy violation"
          : "e.g. Service charge settled — account restored"
      }
      description={
        isSuspend ? (
          <>
            Are you sure you want to suspend{" "}
            <strong>{userName || "this user"}</strong>? Please provide a reason.
          </>
        ) : (
          <>
            Are you sure you want to activate{" "}
            <strong>{userName || "this user"}</strong>? Please add a short note.
          </>
        )
      }
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
