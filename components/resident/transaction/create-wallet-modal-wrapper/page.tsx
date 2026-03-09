"use client";

import Modal from "@/components/modal/page";
import CreateWalletModal from "@/components/resident/wallet/create-wallet-modal/page";

export default function CreateWalletModalWrapper({
  visible,
  onClose,
  userId,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  onSuccess: () => void;
}) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
        {userId ? (
          <CreateWalletModal
            userId={userId}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        ) : (
          <p className="text-center text-gray-500 p-6">Loading...</p>
        )}
      </div>
    </Modal>
  );
}

