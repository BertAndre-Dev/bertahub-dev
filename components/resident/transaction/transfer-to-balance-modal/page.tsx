"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";

const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

export default function TransferToBalanceModal({
  visible,
  onClose,
  withdrawableBalance,
  submitting,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  withdrawableBalance: number;
  submitting: boolean;
  onSubmit: (data: { amount: number; description?: string }) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible) {
      setAmount("");
      setDescription("");
    }
  }, [visible]);

  const canTransfer = withdrawableBalance > 0;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Transfer to main balance
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Move funds from your withdrawable balance for internal use.
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="transferToBalanceAmount"
              className="text-sm font-medium text-foreground"
            >
              Amount
            </label>
            <input
              id="transferToBalanceAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 50000"
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
            />
            <p className="text-xs text-muted-foreground">
              Withdrawable available: {formatNaira(withdrawableBalance)}
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="transferToBalanceDescription"
              className="text-sm font-medium text-foreground"
            >
              Description (optional)
            </label>
            <input
              id="transferToBalanceDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              type="text"
              placeholder="Moving funds for personal use"
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              disabled={submitting || !canTransfer}
              onClick={async () => {
                const n = Number(amount);
                await onSubmit({
                  amount: n,
                  description: description || undefined,
                });
              }}
              title={
                canTransfer
                  ? "Transfer withdrawable to main balance"
                  : "No withdrawable balance to transfer"
              }
            >
              {submitting ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

