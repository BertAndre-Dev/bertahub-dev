"use client";

import React from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import type { RentItem } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import { formatAddress } from "../utils";

export interface SelectRentToPayModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly rentsWithBalance: RentItem[];
  readonly onSelect: (item: RentItem) => void;
}

export default function SelectRentToPayModal({
  visible,
  onClose,
  rentsWithBalance,
  onSelect,
}: SelectRentToPayModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-4 max-w-md">
        <h2 className="font-heading text-xl font-bold mb-4">
          Select rent to pay
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rentsWithBalance.map((r) => {
            const remaining =
              Number(r.amount ?? 0) - Number(r.amountPaid ?? 0);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
              >
                <div>
                  <p className="font-medium">{formatAddress(r)}</p>
                  <p className="text-sm text-muted-foreground">
                    Remaining: ₦{remaining.toLocaleString()}
                  </p>
                </div>
                <Button size="sm" onClick={() => onSelect(r)}>
                  Pay
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
