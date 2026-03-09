"use client";

import Modal from "@/components/modal/page";
import WithdrawFundForm from "@/components/estate-admin/transactions/fund-wallet-form/page";

export default function WithdrawModal({
  visible,
  onClose,
  userId,
  walletId,
  defaultAccountNumber,
  maxWithdrawableAmount,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  walletId: string | null;
  defaultAccountNumber?: string;
  maxWithdrawableAmount?: number;
  onSubmit: (data: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "debit";
    currency: string;
    country: string;
    bankCode?: string;
    accountNumber?: string;
  }) => Promise<void>;
}) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
        {userId && walletId ? (
          <WithdrawFundForm
            userId={userId}
            walletId={walletId}
            defaultAccountNumber={defaultAccountNumber ?? ""}
            maxWithdrawableAmount={maxWithdrawableAmount ?? 0}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        ) : (
          <p className="text-center text-gray-500 p-6">Loading...</p>
        )}
      </div>
    </Modal>
  );
}

