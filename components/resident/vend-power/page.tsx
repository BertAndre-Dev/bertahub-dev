"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vendPower } from "@/redux/slice/resident/meter-mgt/meter-mgt";

interface VendPowerFormProps {
  walletId: string;
  meterNumber: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

export default function VendPowerForm({
  walletId,
  meterNumber,
  onSubmitSuccess,
  onClose,
}: VendPowerFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const kwh = useMemo(() => {
    return amount > 0 ? (amount / 500).toFixed(2) : "0";
  }, [amount]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!walletId || !meterNumber || !amount) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        vendPower({
          walletId,
          meterNumber,
          amount,
        })
      ).unwrap();

      toast.success(`Payment successful! You purchased ${kwh} kWh`);
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-600">
          Vend Power Payment
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount === 0 ? "" : amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount"
          />
          <p className="text-sm text-muted-foreground mt-1">
            You will get <strong>{kwh} kWh</strong> for this amount.
          </p>
        </div>

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Processing..." : `Pay ₦${amount}`}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}