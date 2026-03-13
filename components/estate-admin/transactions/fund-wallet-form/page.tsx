"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

const DEFAULT_COUNTRY = "NG";
const DEFAULT_CURRENCY = "NGN";

interface FundWalletFormProps {
  userId: string;
  walletId: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  /** Max amount that can be withdrawn (e.g. estate wallet temporaryBalance). */
  maxWithdrawableAmount?: number;
  onSubmit: (data: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "debit";
    currency: string;
    country: string;
    bankCode?: string;
    accountNumber?: string;
  }) => Promise<void>;
  onClose?: () => void;
}

export default function FundWalletForm({
  userId,
  walletId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  onSubmit,
  onClose,
}: FundWalletFormProps) {
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);

  useEffect(() => {
    if (defaultAccountNumber) setAccountNumber(defaultAccountNumber);
  }, [defaultAccountNumber]);
  const [description, setDescription] = useState<string>("");
  const [currency] = useState<string>(DEFAULT_CURRENCY);
  const [country] = useState<string>(DEFAULT_COUNTRY);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId) {
      toast.error("Missing user or wallet information.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (
      typeof maxWithdrawableAmount === "number" &&
      amount > maxWithdrawableAmount
    ) {
      toast.error(
        `Amount cannot exceed withdrawable balance (₦${maxWithdrawableAmount.toLocaleString()}).`,
      );
      return;
    }

    if (!accountNumber || accountNumber.trim() === "") {
      toast.error("Account number is missing.");
      return;
    }

    if (!bankCode) {
      toast.error("Bank information is missing.");
      return;
    }

    // const MAX_AMOUNT = 200_000;
    // if (amount > MAX_AMOUNT) {
    //   toast.error(`You cannot fund more than ${MAX_AMOUNT.toLocaleString()}`);
    //   return;
    // }

    setSubmitting(true);

    try {
      await onSubmit({
        userId,
        walletId,
        amount,
        description,
        type: "debit",
        currency,
        country,
        bankCode,
        accountNumber: accountNumber || undefined,
      });

      toast.success("Fund withdrawal initiated successfully!");
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund wallet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-600">
            Withdraw Fund
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <Label>Bank</Label>
            <Input
              type="text"
              value={bankName || ""}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
              placeholder="Bank linked to this wallet"
            />
          </div>

          <div>
            <Label>Account Number</Label>
            <Input
              type="text"
              value={accountNumber}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
              placeholder="Account number linked to this wallet"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={submitting}>
            {submitting ? "Processing..." : `Withdraw Fund`}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
