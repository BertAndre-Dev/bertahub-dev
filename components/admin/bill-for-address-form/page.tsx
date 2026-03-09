"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

export interface BillForAddressFormData {
  addressId: string;
  frequency: string;
  amountPerBillingPeriod: number;
  startDate: string;
}

interface BillForAddressFormProps {
  readonly estateId: string;
  readonly billName: string;
  readonly onSubmit: (data: BillForAddressFormData) => Promise<void> | void;
  readonly onClose?: () => void;
}

export default function BillForAddressForm(props: BillForAddressFormProps) {
  const { estateId, billName, onSubmit, onClose } = props;
  const dispatch = useDispatch<AppDispatch>();
  const [addressOptions, setAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<BillForAddressFormData>({
    addressId: "",
    frequency: "monthly",
    amountPerBillingPeriod: 0,
    startDate: "",
  });

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured for this estate.");
          return;
        }

        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();

        const entries =
          entryRes?.data ??
          (entryRes as {
            data?: Array<{ id: string; data?: Record<string, string> }>;
          })?.data ??
          [];
        const options = entries.map(
          (entry: { id: string; data?: Record<string, string> }) => {
            const d = entry.data ?? {};
            const label = Object.entries(d)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return {
              label: label || entry.id,
              value: entry.id,
            };
          },
        );

        setAddressOptions(options);
      } catch {
        toast.error("Failed to load addresses.");
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (estateId) {
      loadAddresses();
    }
  }, [dispatch, estateId]);

  const handleChange = (
    field: keyof BillForAddressFormData,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.addressId) {
      toast.error("Please select an address.");
      return;
    }
    if (!form.frequency?.trim()) {
      toast.error("Please enter billing frequency.");
      return;
    }
    const amount = Number(form.amountPerBillingPeriod);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount per billing period.");
      return;
    }
    if (!form.startDate?.trim()) {
      toast.error("Please enter a start date.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...form,
        amountPerBillingPeriod: amount,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg pb-4 pt-8 font-semibold">
          Assign "{billName}" to an address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="addressId">Address</Label>
          <select
            id="addressId"
            aria-label="Select address"
            className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
            value={form.addressId}
            onChange={(e) => handleChange("addressId", e.target.value)}
            disabled={loadingAddresses || addressOptions.length === 0}
          >
            <option value="">Select address...</option>
            {addressOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {loadingAddresses && (
            <p className="text-xs text-muted-foreground mt-1">
              Loading addresses...
            </p>
          )}
          {!loadingAddresses && addressOptions.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No addresses configured for this estate.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <select
            id="frequency"
            aria-label="Select billing frequency"
            className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
            value={form.frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountPerBillingPeriod">
            Amount per billing period (₦)
          </Label>
          <Input
            id="amountPerBillingPeriod"
            type="number"
            min={0}
            value={form.amountPerBillingPeriod || ""}
            onChange={(e) =>
              handleChange(
                "amountPerBillingPeriod",
                Number(e.target.value) || 0,
              )
            }
            placeholder="10000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? "Assigning..." : "Assign Bill"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}

