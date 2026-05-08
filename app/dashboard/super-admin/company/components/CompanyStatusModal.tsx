"use client";

import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";

export function CompanyStatusModal({
  visible,
  onClose,
  companyName,
  mode,
  onConfirm,
  loading,
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly companyName: string;
  readonly mode: "suspend" | "activate";
  readonly onConfirm: () => void | Promise<void>;
  readonly loading?: boolean;
}) {
  const isSuspend = mode === "suspend";
  return (
    <SuspendRentModal
      visible={visible}
      onClose={onClose}
      tenantName={companyName}
      title={isSuspend ? "Suspend Company" : "Activate Company"}
      confirmLabel={isSuspend ? "Suspend" : "Activate"}
      requireReason={false}
      loading={loading}
      onConfirm={async () => onConfirm()}
    />
  );
}
