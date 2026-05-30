"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  createCompanyWithdrawAudit,
  getCompanyCredits,
  getCompanyWallet,
  requestCompanyWithdrawOtp,
  transferCompanyFunds,
} from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import OtpVerification from "@/components/otp-modal/otp-verification/page";

const DEFAULT_COUNTRY = "NG";
const DEFAULT_CURRENCY = "NGN";
const CREDITS_LIMIT = 10;

interface CompanyWithdrawFundFormProps {
  userId: string;
  walletId: string;
  companyId: string;
  estateId?: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  maxWithdrawableAmount?: number;
  creditsPage?: number;
  onClose?: () => void;
}

export default function CompanyWithdrawFundForm({
  userId,
  walletId,
  companyId,
  estateId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  creditsPage = 1,
  onClose,
}: CompanyWithdrawFundFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (defaultAccountNumber) setAccountNumber(defaultAccountNumber);
  }, [defaultAccountNumber]);

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

  const refreshWalletData = async () => {
    await dispatch(getCompanyWallet(companyId));
    await dispatch(
      getCompanyCredits({
        companyId,
        estateId,
        page: creditsPage,
        limit: CREDITS_LIMIT,
      }),
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId || !companyId) {
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

    if (!accountNumber?.trim()) {
      toast.error("Account number is missing.");
      return;
    }

    if (!bankCode) {
      toast.error("Bank information is missing.");
      return;
    }

    setSubmitting(true);

    try {
      const createRes = await dispatch(
        createCompanyWithdrawAudit({
          walletId,
          type: "debit",
          amount,
          description,
          userId,
          role: "company",
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

      await dispatch(
        requestCompanyWithdrawOtp({
          companyId,
          amount,
          currency: DEFAULT_CURRENCY,
          bankCode,
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${amount.toLocaleString()}`,
          tx_ref,
        }),
      ).unwrap();

      setOtpError(null);
      setOtpRequested(true);
      toast.success("OTP sent to your email. Please enter it to confirm.");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to process withdrawal.",
      );
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
      await dispatch(
        transferCompanyFunds({
          companyId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${(amount ?? 0).toLocaleString()}`,
          tx_ref: txRef,
          otp: code,
        }),
      ).unwrap();

      toast.success("Withdrawal successful!");
      await refreshWalletData();
      onClose?.();
    } catch (err: unknown) {
      setOtpError(
        (err as { message?: string })?.message ||
          "Failed to verify OTP. Please try again.",
      );
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
      await dispatch(
        requestCompanyWithdrawOtp({
          companyId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${(amount ?? 0).toLocaleString()}`,
          tx_ref: txRef,
        }),
      ).unwrap();
    } catch (err: unknown) {
      setOtpError(
        (err as { message?: string })?.message ||
          "Failed to resend OTP. Please try again.",
      );
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
