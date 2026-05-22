"use client";

import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";

export function CompanyEstateStatusModal({
  visible,
  onClose,
  estateName,
  mode,
  onConfirm,
  loading,
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly estateName: string;
  readonly mode: "suspend" | "activate";
  readonly onConfirm: () => void | Promise<void>;
  readonly loading?: boolean;
}) {
  const isSuspend = mode === "suspend";
  return (
    <SuspendRentModal
      visible={visible}
      onClose={onClose}
      tenantName={estateName}
      title={isSuspend ? "Suspend Estate" : "Activate Estate"}
      confirmLabel={isSuspend ? "Suspend" : "Activate"}
      requireReason={false}
      loading={loading}
      onConfirm={async () => onConfirm()}
    />
  );
}
