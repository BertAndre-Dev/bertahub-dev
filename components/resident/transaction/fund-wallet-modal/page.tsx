"use client";

import Modal from "@/components/modal/page";
import FundWalletForm from "@/components/resident/wallet/fund-wallet/page";

export default function FundWalletModal({
  visible,
  onClose,
  userId,
  walletId,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  walletId: string | null;
  onSubmit: (data: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
  }) => Promise<void>;
}) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
        {userId && walletId ? (
          <FundWalletForm
            userId={userId}
            walletId={walletId}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        ) : (
          <p className="text-center text-gray-500">Loading form...</p>
        )}
      </div>
    </Modal>
  );
}

