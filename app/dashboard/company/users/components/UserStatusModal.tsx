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
  readonly onConfirm: () => void | Promise<void>;
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
      requireReason={false}
      loading={loading}
      onConfirm={async () => onConfirm()}
    />
  );
}
