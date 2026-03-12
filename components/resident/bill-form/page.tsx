"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getBill, payBill } from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select"; 
import { toast } from "react-toastify";

interface BillsFormProps {
  billId: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

type FrequencyOption = "monthly" | "quarterly" | "yearly";

export default function BillsForm({ billId, onSubmitSuccess, onClose }: BillsFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billName, setBillName] = useState("");
  const [yearlyAmount, setYearlyAmount] = useState<number>(0);
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [frequency, setFrequency] = useState<FrequencyOption>("yearly");

  const frequencyOptions = [
    // { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" }
  ];

  const proratedAmount = useMemo(() => {
    switch (frequency) {
      case "monthly":
        return (yearlyAmount / 12).toFixed(2);
      case "quarterly":
        return (yearlyAmount / 4).toFixed(2);
      default:
        return yearlyAmount.toFixed(2);
    }
  }, [yearlyAmount, frequency]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const billRes = await dispatch(getBill(billId)).unwrap();
        const billData = billRes?.data;
        if (billData) {
          setBillName(billData.name || "");
          setYearlyAmount(Number(billData.yearlyAmount ?? 0));
        }

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data;
        if (user) {
          setUserId(user.id || "");
          setWalletId(user.walletId ?? user.wallet?.id ?? "");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load bill or user details");
      } finally {
        setLoading(false);
      }
    };

    if (billId) load();
  }, [billId, dispatch]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!billId || !userId || !walletId) {
      toast.error("Missing bill or wallet information.");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        payBill({
          billId,
          userId,
          walletId,
          frequency,
          amountPaid: Number(proratedAmount),
        })
      ).unwrap();

      toast.success("Bill payment successful");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Failed to pay bill";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          {billName} Bill
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-gray-500 italic">Loading bill details...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Payment Frequency</Label>
              <Select
                options={frequencyOptions}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyOption)}
              />
            </div>


            <div>
              <Label>Amount to Pay</Label>
              <Input readOnly type="number" value={proratedAmount} />
              <p className="text-sm text-muted-foreground mt-1">
                Yearly total is ₦{yearlyAmount.toLocaleString()}. Prorated based on selected period.
              </p>
            </div>
          </div>
        )}

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={loading || submitting}>
            {submitting ? "Processing..." : `Pay ₦${proratedAmount}`}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
