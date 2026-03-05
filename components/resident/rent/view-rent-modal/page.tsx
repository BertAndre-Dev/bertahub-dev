"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { RentItem } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import { formatDate } from "../utils";

export interface ViewRentModalProps {
  readonly rent: RentItem | null;
  readonly loading: boolean;
  readonly onClose: () => void;
}

export default function ViewRentModal({
  rent,
  loading,
}: ViewRentModalProps) {
  if (loading) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">
          Loading rent details...
        </p>
      </Card>
    );
  }
  if (!rent) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">Rent not found.</p>
      </Card>
    );
  }
  const tenant = typeof rent.tenantId === "object" ? rent.tenantId : null;
  const addr = typeof rent.addressId === "object" ? rent.addressId : null;
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="font-heading text-xl font-bold mb-4">Rent Details</h2>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="font-medium">
            {addr?.data
              ? Object.entries(addr.data as Record<string, string>)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
              : typeof rent.addressId === "string"
                ? rent.addressId
                : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tenant</dt>
          <dd className="font-medium">
            {tenant
              ? [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") ||
                tenant.email
              : typeof rent.tenantId === "string"
                ? rent.tenantId
                : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">
            ₦{rent.amount != null ? Number(rent.amount).toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Start Date</dt>
          <dd className="font-medium">{formatDate(rent.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">End Date</dt>
          <dd className="font-medium">{formatDate(rent.endDate)}</dd>
        </div>
        {rent.notes && (
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="font-medium">{rent.notes}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
