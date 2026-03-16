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
import {
  requestResidentOwnerWithdrawalOtp,
  transferFundsResident,
} from "@/redux/slice/resident/transaction/transaction";
import { getWallet, getEstateCredits } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import OtpVerification from "@/components/otp-modal/otp-verification/page";
 
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
  /** When true, use resident-owner withdrawal APIs instead of estate-admin ones. */
  isResidentOwner?: boolean;
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
  isResidentOwner = false,
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
  const [txRef, setTxRef] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const res = await dispatch(getSignedInUser()).unwrap();
        const user = res?.data ?? (res as Record<string, unknown>) ?? null;
        const email = (user?.email as string) ?? "";
        if (!email) return;
        const [local, domain] = email.split("@");
        if (!local || !domain) {
          setEmailHint(email);
          return;
        }
        const visible = local.slice(0, 2);
        const masked = `${visible}${"*".repeat(Math.max(local.length - 2, 3))}`;
        setEmailHint(`${masked}@${domain}`);
      } catch {
        // ignore email hint failure
      }
    })();
  }, [dispatch]);

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
        // First-time click on "Request OTP"
        let tx_ref = "";

        // 1) Create audit-only transaction; backend returns tx_ref in response
        const createRes = await dispatch(
          createTransaction({
            walletId,
            type: "debit",
            amount,
            description,
            userId,
            role: isResidentOwner ? "resident" : "estate admin",
            residentType: isResidentOwner ? "owner" : null,
            balanceType: "withdrawableBalance",
            isAuditOnly: true,
          }),
        ).unwrap();

        const resBody = createRes as Record<string, unknown> | undefined;
        const resData = resBody?.data as Record<string, unknown> | undefined;
        tx_ref =
          (resData?.tx_ref as string) ?? (resBody?.tx_ref as string) ?? "";
        if (!tx_ref && typeof crypto !== "undefined" && crypto.randomUUID) {
          tx_ref = `tx-${crypto.randomUUID()}`;
        }
        if (!tx_ref) {
          tx_ref = `tx-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 11)}`;
        }
        setTxRef(tx_ref);

        // 2) Request OTP using correct endpoint for the role
        if (isResidentOwner) {
          await dispatch(
            requestResidentOwnerWithdrawalOtp({
              userId,
              estateId,
              amount: amount ?? 0,
              currency,
              bankCode: bankCode ?? "",
              accountNumber,
              narration:
                description ||
                `Withdrawal of ${currency} ${(amount ?? 0).toLocaleString()}`,
              tx_ref,
            }),
          ).unwrap();
        } else {
          await dispatch(
            requestEstateAdminOtp({
              estateId,
              amount,
              currency,
              bankCode,
              accountNumber,
              narration:
                description ||
                `Withdrawal of ${currency} ${amount.toLocaleString()}`,
              tx_ref,
            }),
          ).unwrap();
        }

        setOtpError(null);
        setOtpRequested(true);
        toast.success("OTP sent to your email. Please enter it to confirm.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to process withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async (code: string) => {
    if (!txRef) {
      setOtpError("Missing transaction reference. Please close and try again.");
      return;
    }

    if (code.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    setSubmitting(true);
    setOtpError(null);

    try {
      if (isResidentOwner) {
        await dispatch(
          transferFundsResident({
            userId,
            estateId,
            amount: amount ?? 0,
            currency,
            bankCode: bankCode ?? "",
            accountNumber,
            narration:
              description ||
              `Withdrawal of ${currency} ${(amount ?? 0).toLocaleString()}`,
            tx_ref: txRef,
            otp: code,
          }),
        ).unwrap();
      } else {
        await dispatch(
          transferFunds({
            estateId,
            amount: amount ?? 0,
            currency,
            bankCode: bankCode ?? "",
            accountNumber,
            narration:
              description ||
              `Withdrawal of ${currency} ${(amount ?? 0).toLocaleString()}`,
            tx_ref: txRef,
            otp: code,
          }),
        ).unwrap();
      }

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
    } catch (err: any) {
      setOtpError(err?.message || "Failed to verify OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!txRef) {
      setOtpError("Missing transaction reference. Please close and try again.");
      return;
    }

    setSubmitting(true);
    setOtpError(null);

    try {
      if (isResidentOwner) {
        await dispatch(
          requestResidentOwnerWithdrawalOtp({
            userId,
            estateId,
            amount: amount ?? 0,
            currency,
            bankCode: bankCode ?? "",
            accountNumber,
            narration:
              description ||
              `Withdrawal of ${currency} ${(amount ?? 0).toLocaleString()}`,
            tx_ref: txRef,
          }),
        ).unwrap();
      } else {
        await dispatch(
          requestEstateAdminOtp({
            estateId,
            amount: amount ?? 0,
            currency,
            bankCode: bankCode ?? "",
            accountNumber,
            narration:
              description ||
              `Withdrawal of ${currency} ${(amount ?? 0).toLocaleString()}`,
            tx_ref: txRef,
          }),
        ).unwrap();
      }
    } catch (err: any) {
      setOtpError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-600 mx-auto">
            {otpRequested ? "OTP Verification" : "Withdraw Fund"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!otpRequested ? (
            <>
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

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Request OTP"}
              </Button>
            </>
          ) : (
            <OtpVerification
              length={6}
              initialCountdown={60}
              submitting={submitting}
              errorMessage={otpError}
              emailHint={emailHint}
              onCancel={onClose ?? (() => undefined)}
              onConfirm={handleConfirmOtp}
              onResend={handleResendOtp}
            />
          )}
        </CardContent>
      </form>
    </Card>
  );
}
