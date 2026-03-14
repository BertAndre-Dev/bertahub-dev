"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  createTransaction,
  requestEstateAdminOtp,
  transferFunds,
} from "@/redux/slice/estate-admin/transaction/transaction";
import { getWallet, getEstateCredits } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";

const DEFAULT_COUNTRY = "NG";
const DEFAULT_CURRENCY = "NGN";

interface FundWalletFormProps {
  userId: string;
  walletId: string;
  estateId: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  /** Max amount that can be withdrawn (e.g. estate wallet temporaryBalance). */
  maxWithdrawableAmount?: number;
  onClose?: () => void;
}

export default function FundWalletForm({
  userId,
  walletId,
  estateId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  onClose,
}: FundWalletFormProps) {
  const dispatch = useDispatch<AppDispatch>();
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
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [txRef, setTxRef] = useState<string | null>(null);

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
      if (!otpRequested) {
        // Step 1: Create transaction (isAuditOnly: true, residentType: null)
        // API returns tx_ref in response – use it for request-otp and transfer
        const createRes = await dispatch(
          createTransaction({
            walletId,
            type: "debit",
            amount,
            description,
            userId,
            role: "estate admin",
            residentType: null,
            balanceType: "withdrawableBalance",
            isAuditOnly: true,
          }),
        ).unwrap();

        const resBody = createRes as Record<string, unknown> | undefined;
        const resData = resBody?.data as Record<string, unknown> | undefined;
        let tx_ref =
          (resData?.tx_ref as string) ?? (resBody?.tx_ref as string) ?? "";
        if (!tx_ref && typeof crypto !== "undefined" && crypto.randomUUID) {
          tx_ref = `tx-${crypto.randomUUID()}`;
        }
        if (!tx_ref) {
          tx_ref = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        }
        setTxRef(tx_ref);

        // Step 2: Request OTP with tx_ref from create transaction
        await dispatch(
          requestEstateAdminOtp({
            estateId,
            amount,
            currency,
            bankCode,
            accountNumber,
            narration:
              description || `Withdrawal of ${currency} ${amount.toLocaleString()}`,
            tx_ref,
          }),
        ).unwrap();

        setOtpRequested(true);
        toast.success("OTP sent to your email. Please enter it to confirm.");
      } else {
        // Step 3: Transfer with OTP
        if (!otp.trim()) {
          toast.error("Please enter the OTP sent to your email.");
          setSubmitting(false);
          return;
        }

        const tx_ref_to_use = txRef || "";

        await dispatch(
          transferFunds({
            estateId,
            amount,
            currency,
            bankCode,
            accountNumber,
            narration:
              description || `Withdrawal of ${currency} ${amount.toLocaleString()}`,
            tx_ref: tx_ref_to_use,
            otp: otp.trim(),
          }),
        ).unwrap();

        toast.success("Withdrawal successful!");

        // Refresh wallet + credits
        await dispatch(getWallet(estateId));
        await dispatch(
          getEstateCredits({
            estateId,
            page: 1,
            limit: 10,
          }),
        );

        onClose?.();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to process withdrawal.");
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

          {otpRequested && (
            <div>
              <Label>OTP</Label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP sent to your email"
              />
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={submitting}>
            {submitting
              ? "Processing..."
              : otpRequested
                ? "Confirm Withdrawal"
                : "Request OTP"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
