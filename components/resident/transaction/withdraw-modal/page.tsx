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
  estateId,
  bankCode,
  bankName,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  walletId: string | null;
  defaultAccountNumber?: string;
  maxWithdrawableAmount?: number;
  estateId: string | null;
  bankCode?: string;
  bankName?: string;
}) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
        {userId && walletId ? (
          <WithdrawFundForm
            userId={userId}
            walletId={walletId}
            estateId={estateId ?? ""}
            defaultAccountNumber={defaultAccountNumber ?? ""}
            bankCode={bankCode}
            bankName={bankName}
            maxWithdrawableAmount={maxWithdrawableAmount ?? 0}
            onClose={onClose}
            isResidentOwner
          />
        ) : (
          <p className="text-center text-gray-500 p-6">Loading...</p>
        )}
      </div>
    </Modal>
  );
}

