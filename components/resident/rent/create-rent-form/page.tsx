"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "react-toastify";
import { createRent } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import type { CreateRentPayload } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import type { InvitedTenantItem } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import type { AppDispatch } from "@/redux/store";
import { formatAddressFromData } from "../utils";

export interface CreateRentFormProps {
  readonly tenantList: InvitedTenantItem[];
  readonly tenantListLoading: boolean;
  readonly createLoading: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export default function CreateRentForm({
  tenantList,
  tenantListLoading,
  createLoading,
  onSuccess,
}: CreateRentFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState<CreateRentPayload>({
    addressId: "",
    tenantId: "",
    amount: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });

  const selectedTenant = tenantList.find((t) => t.id === form.tenantId);
  const addressOptions = (selectedTenant?.addressIds ?? []).map((addr) => ({
    label: formatAddressFromData(addr.data),
    value: addr.id,
  }));

  const handleTenantChange = (tenantId: string) => {
    setForm((p) => ({ ...p, tenantId, addressId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId?.trim()) {
      toast.error("Please select a tenant.");
      return;
    }
    if (!form.addressId?.trim()) {
      toast.error("Please select an address for this tenant.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!form.startDate?.trim()) {
      toast.error("Please enter start date.");
      return;
    }
    if (!form.endDate?.trim()) {
      toast.error("Please enter end date.");
      return;
    }
    try {
      const payload: CreateRentPayload = {
        ...form,
        startDate: form.startDate
          ? new Date(form.startDate + "T00:00:00Z").toISOString()
          : "",
        endDate: form.endDate
          ? new Date(form.endDate + "T00:00:00Z").toISOString()
          : "",
      };
      await dispatch(createRent(payload)).unwrap();
      toast.success("Rent created successfully.");
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to create rent.";
      toast.error(msg);
    }
  };

  const tenantSelectOptions = [
    { label: "Select tenant...", value: "" },
    ...tenantList.map((t) => ({
      label:
        [t.firstName, t.lastName].filter(Boolean).join(" ") || t.email || t.id,
      value: t.id,
    })),
  ];

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <h2 className="font-heading text-xl font-bold mb-1">Create Rent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenantId">Tenant</Label>
            <Select
              id="tenantId"
              options={tenantSelectOptions}
              value={form.tenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              className="mt-1 w-full"
              required
            />
            {tenantListLoading && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading tenants...
              </p>
            )}
            {form.tenantId && selectedTenant && (
              <div className="mt-2 rounded-md border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Addresses for this tenant
                </p>
                {addressOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No addresses on file.
                  </p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {addressOptions.map((o) => (
                      <li key={o.value}>{o.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="addressId">Address (for this tenant)</Label>
            <Select
              id="addressId"
              options={[
                { label: "Select address...", value: "" },
                ...addressOptions,
              ]}
              value={form.addressId}
              onChange={(e) =>
                setForm((p) => ({ ...p, addressId: e.target.value }))
              }
              className="mt-1 w-full"
              required
              disabled={!form.tenantId || addressOptions.length === 0}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={form.amount || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: Number(e.target.value) || 0 }))
              }
              placeholder="500000"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="e.g. Monthly rent for apartment 301"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={tenantListLoading || createLoading}
              className="flex-1"
            >
              {createLoading ? "Creating..." : "Create Rent"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
