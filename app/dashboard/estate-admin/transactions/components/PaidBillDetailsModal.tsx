"use client";

import type { ReactNode } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";

export type PaidBillDetailsItem = {
  _id?: string;
  id?: string;
  frequency?: string;
  amountPaid?: number;
  status?: string;
  lastPaymentDate?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  nextDueDate?: string | null;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  bill?: {
    name?: string;
    addressId?: string | null;
  } | null;
  billName?: string;
};

type Props = Readonly<{
  open: boolean;
  item: PaidBillDetailsItem | null;
  onOpenChange: (open: boolean) => void;
}>;

function formatFrequency(frequency?: string) {
  const freq = (frequency ?? "").toString();
  if (!freq) return "—";
  if (freq.toLowerCase() === "oneoff") return "One-off";
  return freq.charAt(0).toUpperCase() + freq.slice(1);
}

function formatResidentName(user?: PaidBillDetailsItem["user"]) {
  if (!user) return "—";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "—";
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export function PaidBillDetailsModal({
  open,
  item,
  onOpenChange,
}: Props) {
  const status = (item?.status ?? "").toString().toLowerCase();
  let statusClass = "text-yellow-600 font-medium capitalize";
  if (status === "paid") statusClass = "text-green-600 font-medium capitalize";
  else if (status === "active")
    statusClass = "text-blue-600 font-medium capitalize";

  const isOneOff =
    (item?.frequency ?? "").toString().toLowerCase() === "oneoff";

  return (
    <Modal
      visible={open}
      onClose={() => onOpenChange(false)}
      contentClassName="max-w-lg"
    >
      <div className="pr-8">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">
          Bill Payment Details
        </h2>

        {!item ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No details found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow
                label="Resident"
                value={formatResidentName(item.user)}
              />
              <DetailRow label="Email" value={item.user?.email || "—"} />
              <DetailRow
                label="Bill"
                value={item.bill?.name ?? item.billName ?? "—"}
              />
              <DetailRow
                label="Frequency"
                value={formatFrequency(item.frequency)}
              />
              <DetailRow
                label="Amount Paid"
                value={`₦${Number(item.amountPaid ?? 0).toLocaleString()}`}
              />
              <DetailRow
                label="Status"
                value={
                  <span className={statusClass}>{item.status ?? "—"}</span>
                }
              />
              <DetailRow
                label="Created"
                value={formatDateTime(item.createdAt, "—")}
              />
              <DetailRow
                label="Last Payment"
                value={formatDateTime(item.lastPaymentDate, "—")}
              />
              {!isOneOff ? (
                <>
                  <DetailRow
                    label="Start Date"
                    value={formatDateTime(item.startDate, "—")}
                  />
                  <DetailRow
                    label="Next Due Date"
                    value={formatDateTime(item.nextDueDate, "—")}
                  />
                </>
              ) : null}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
