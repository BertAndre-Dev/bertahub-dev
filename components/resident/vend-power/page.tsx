"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/modal/page";
import { vendPower } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { Copy, CheckCircle } from "lucide-react";

interface VendPowerFormProps {
  walletId: string;
  meterNumber: string;
  tariffPrice?: number | null;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

const SUCCESS_MODAL_AUTO_CLOSE_MS = 20000;

export default function VendPowerForm({
  walletId,
  meterNumber,
  tariffPrice = null,
  onSubmitSuccess,
  onClose,
}: Readonly<VendPowerFormProps>) {
  const dispatch = useDispatch<AppDispatch>();

  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const kwh = useMemo(() => {
    const price = Number(tariffPrice);
    if (amount <= 0) return "0";
    if (!Number.isFinite(price) || price <= 0) return "0";
    return (amount / price).toFixed(2);
  }, [amount, tariffPrice]);

  const closeSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessToken(null);
    setCopied(false);
    onSubmitSuccess?.();
    onClose?.();
  }, [onSubmitSuccess, onClose]);

  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(closeSuccessModal, SUCCESS_MODAL_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [showSuccessModal, closeSuccessModal]);

  const handleCopyToken = useCallback(() => {
    if (!successToken) return;
    navigator.clipboard.writeText(successToken).then(
      () => {
        setCopied(true);
        toast.success("Token copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error("Failed to copy"),
    );
  }, [successToken]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!walletId || !meterNumber || !amount) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        vendPower({
          walletId,
          meterNumber,
          amount,
        }),
      ).unwrap();

      const data = res as Record<string, unknown> | undefined;
      const inner = data?.data as Record<string, unknown> | undefined;
      const energyList = inner?.energyList as Array<{ token?: string }> | undefined;
      const firstEnergy = energyList?.[0];
      const token =
        (firstEnergy?.token as string) ??
        (inner?.token as string) ??
        (data?.token as string) ??
        "";

      setSuccessToken(token || null);
      setShowSuccessModal(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
              Price per kWh:{" "}
              <strong>
                {tariffPrice != null && Number.isFinite(Number(tariffPrice))
                  ? `₦${Number(tariffPrice).toLocaleString()}`
                  : "—"}
              </strong>
            </p>
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

      <Modal visible={showSuccessModal} onClose={closeSuccessModal}>
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Vending was successful
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the token below to recharge your meter.
          </p>
          {successToken ? (
            <>
              <div className="bg-gray-100 rounded-lg px-4 py-3 mb-4 font-mono text-lg break-all select-all">
                {successToken}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyToken}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy token
                  </>
                )}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No token was returned. Please check your meter or contact support.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            This modal will close automatically in 20 seconds.
          </p>
        </div>
      </Modal>
    </>
  );
}