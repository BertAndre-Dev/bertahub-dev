"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { updateRent } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import type { RentItem, UpdateRentPayload } from "@/redux/slice/resident/rent-mgt/rent-mgt";
import type { AppDispatch } from "@/redux/store";
import { formatAddress, isoToDateInput } from "../utils";

export interface UpdateRentFormProps {
  readonly rent: RentItem | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export default function UpdateRentForm({
  rent,
  onClose,
  onSuccess,
}: UpdateRentFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(rent?.amount ?? 0);
  const [startDate, setStartDate] = useState(isoToDateInput(rent?.startDate));
  const [endDate, setEndDate] = useState(isoToDateInput(rent?.endDate));
  const [notes, setNotes] = useState(rent?.notes ?? "");

  useEffect(() => {
    if (rent) {
      setAmount(rent.amount ?? 0);
      setStartDate(isoToDateInput(rent.startDate));
      setEndDate(isoToDateInput(rent.endDate));
      setNotes(rent.notes ?? "");
    }
  }, [rent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rent?.id) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!startDate?.trim()) {
      toast.error("Please enter start date.");
      return;
    }
    if (!endDate?.trim()) {
      toast.error("Please enter end date.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: UpdateRentPayload = {
        id: rent.id,
        amount: amt,
        startDate: new Date(startDate + "T00:00:00Z").toISOString(),
        endDate: new Date(endDate + "T00:00:00Z").toISOString(),
        currency: "NGN",
        notes: notes.trim() || undefined,
      };
      await dispatch(updateRent(payload)).unwrap();
      toast.success("Rent updated.");
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to update rent.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!rent) {
    return (
      <Card className="max-w-lg mx-auto p-6">
        <p className="text-muted-foreground text-center">Rent not found.</p>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <h2 className="font-heading text-xl font-bold mb-1">Edit Rent</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update amount, dates, or notes. Tenant and address cannot be changed
          here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Address</Label>
            <p className="text-sm mt-1 text-muted-foreground">
              {formatAddress(rent)}
            </p>
          </div>
          <div>
            <Label>Tenant</Label>
            <p className="text-sm mt-1 text-muted-foreground">
              {typeof rent.tenantId === "object"
                ? [rent.tenantId.firstName, rent.tenantId.lastName]
                    .filter(Boolean)
                    .join(" ") || rent.tenantId.email
                : rent.tenantId ?? "—"}
            </p>
          </div>
          <div>
            <Label htmlFor="edit-amount">Amount (₦)</Label>
            <Input
              id="edit-amount"
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-startDate">Start Date</Label>
            <Input
              id="edit-startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-endDate">End Date</Label>
            <Input
              id="edit-endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly rent"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
