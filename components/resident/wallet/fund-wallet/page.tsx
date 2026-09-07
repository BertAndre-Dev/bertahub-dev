"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { getPaymentGateways } from "@/redux/slice/resident/payment-mgt/payment-mgt";
import { getApiErrorMessage } from "@/lib/api-error";

const countries = [
  { code: "NG", currency: "NGN", name: "Nigeria" },
  { code: "GB", currency: "GBP", name: "United Kingdom" },
  { code: "EU", currency: "EUR", name: "European Union" },
  { code: "GH", currency: "GHS", name: "Ghana" },
];

/** Always sent as payment_options — not shown in the UI */
const PAYMENT_OPTION = "all";

interface FundWalletFormProps {
  userId: string;
  walletId: string;
  onSubmit: (data: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
    gatewayType: string;
  }) => Promise<void>;
  onClose?: () => void;
}

export default function FundWalletForm({
  userId,
  walletId,
  onSubmit,
  onClose,
}: FundWalletFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    gateways,
    defaultGateway,
    getPaymentGatewaysState,
    error: gatewaysError,
  } = useSelector((state: RootState) => state.residentPaymentMgt);

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [country, setCountry] = useState<string>("NG");
  const [gatewayType, setGatewayType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const loadingGateways = getPaymentGatewaysState === "isLoading";

  useEffect(() => {
    dispatch(getPaymentGateways());
  }, [dispatch]);

  useEffect(() => {
    if (gateways.length === 0) return;
    const preferred =
      (defaultGateway && gateways.find((g) => g.id === defaultGateway)?.id) ||
      gateways[0]?.id ||
      "";
    setGatewayType((current) =>
      current && gateways.some((g) => g.id === current) ? current : preferred,
    );
  }, [gateways, defaultGateway]);

  useEffect(() => {
    if (getPaymentGatewaysState === "failed" && gatewaysError) {
      toast.error(gatewaysError);
    }
  }, [getPaymentGatewaysState, gatewaysError]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const countryObj = countries.find((c) => c.code === selectedCode);
    if (!countryObj) return;

    setCurrency(countryObj.currency);
    setCountry(countryObj.code);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId) {
      toast.error("Missing user or wallet information.");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a payment description.");
      return;
    }

    if (!country || !currency) {
      toast.error("Please select a currency / country.");
      return;
    }

    if (!gatewayType) {
      toast.error("Please select a payment gateway.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        userId,
        walletId,
        amount: numAmount,
        description: description.trim(),
        type: "credit",
        currency,
        paymentOption: PAYMENT_OPTION,
        country,
        gatewayType,
      });

      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    Boolean(userId && walletId) &&
    Number(amount) > 230 &&
    description.trim().length > 0 &&
    Boolean(country && currency && gatewayType);

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-600">
            Fund Wallet
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fund-wallet-amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fund-wallet-amount"
              type="number"
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            {Number(amount) > 0 && (
              <p className="text-red-600 text-sm mt-1.5">
                A service charge of ₦230 applies to every transaction.
                <br />
                <span className="text-xs text-red-500">
                  The Pay button will be enabled once you enter an amount of at
                  least ₦230.
                </span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="fund-wallet-description">
              Payment Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fund-wallet-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter payment description"
              required
            />
          </div>

          <div>
            <Label htmlFor="fund-wallet-country">
              Currency / Country <span className="text-destructive">*</span>
            </Label>
            <select
              id="fund-wallet-country"
              title="Currency / Country"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={country}
              onChange={handleCurrencyChange}
              required
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.currency} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* <div>
            <Label htmlFor="fund-wallet-gateway">
              Payment Gateway <span className="text-destructive">*</span>
            </Label>
            <select
              id="fund-wallet-gateway"
              title="Payment Gateway"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={gatewayType}
              onChange={(e) => setGatewayType(e.target.value)}
              disabled={loadingGateways || gateways.length === 0}
              required
            >
              <option value="">
                {loadingGateways
                  ? "Loading gateways..."
                  : gateways.length === 0
                    ? "No gateways available"
                    : "Select gateway"}
              </option>
              {gateways.map((gateway) => (
                <option key={gateway.id} value={gateway.id}>
                  {gateway.name}
                </option>
              ))}
            </select>
          </div> */}

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={submitting || !isFormValid}
          >
            {submitting ? "Processing..." : `Fund Wallet ₦${amount || 0}`}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
