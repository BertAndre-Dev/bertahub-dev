"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import type { RentItem } from "@/redux/slice/resident/rent-mgt/rent-mgt";

export interface PayRentModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly rent: RentItem | null;
  readonly walletId: string | null;
  readonly onConfirm: (payload: {
    rentId: string;
    amount: number;
    paymentMethod: string;
    reference: string;
  }) => void | Promise<void>;
  readonly loading?: boolean;
}

function generateReference(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `tx-${crypto.randomUUID()}`;
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function PayRentModal({
  visible,
  onClose,
  rent,
  walletId,
  onConfirm,
  loading = false,
}: PayRentModalProps) {
  const total = Number(rent?.amount ?? 0);
  const paid = Number(rent?.amountPaid ?? 0);
  const remaining = Math.max(0, total - paid);

  const [amount, setAmount] = useState(remaining);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount(remaining);
      setError(null);
    }
  }, [visible, remaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rent?.id || !walletId) {
      setError("Missing rent or wallet information.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (amt > remaining) {
      setError(`Amount cannot exceed remaining balance (₦${remaining.toLocaleString()}).`);
      return;
    }
    setError(null);
    try {
      await onConfirm({
        rentId: rent.id,
        amount: amt,
        paymentMethod: "wallet",
        reference: generateReference(),
      });
      onClose();
    } catch {
      // Caller can toast
    }
  };

  if (!rent) return null;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-2 max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold mb-1">Pay Rent</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pay from your wallet. Remaining balance: ₦{remaining.toLocaleString()}.
        </p>
        {!walletId ? (
          <p className="text-sm text-destructive">
            No wallet found. Please create or link a wallet first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pay-rent-amount">Amount (₦)</Label>
              <Input
                id="pay-rent-amount"
                type="number"
                min={1}
                max={remaining}
                step={1}
                value={amount === 0 ? "" : amount}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : 0;
                  setAmount(v);
                  if (error) setError(null);
                }}
                placeholder={String(remaining)}
                className="mt-1"
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Paying…" : "Pay Rent"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
