"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

// Example country/currency/payment data (you can fetch dynamically from your backend)
const countries = [
  { code: "NG", currency: "NGN", name: "Nigeria" },
  { code: "GB", currency: "GBP", name: "United Kingdom" },
  { code: "EU", currency: "EUR", name: "European Union" },
  { code: "GH", currency: "GHS", name: "Ghana" },
];

const paymentOptionsMap: Record<string, { code: string; label: string }[]> = {
  NGN: [
    { code: "card", label: "Card Payment" },
    { code: "bank transfer", label: "Bank Transfer" },
    { code: "ussd", label: "USSD Payment" },
    { code: "barter", label: "Barter Wallet" },
    { code: "mpesa", label: "M-Pesa" },
  ],
  GBP: [
    { code: "card", label: "Card Payment" },
    { code: "account", label: "UK Bank Transfer" },
  ],
  EUR: [
    { code: "card", label: "Card Payment" },
    { code: "account", label: "SEPA Bank Transfer" },
    { code: "ach", label: "ACH Transfer" },
  ],
  GHS: [
    { code: "card", label: "Card Payment" },
    { code: "bank transfer", label: "Bank Transfer" },
    { code: "mobilemoneyghana", label: "Mobile Money (Ghana)" },
    { code: "ussd", label: "USSD Payment" },
    { code: "barter", label: "Barter Wallet" },
  ],
};

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
  }) => Promise<void>;
  onClose?: () => void;
}

export default function FundWalletForm({
  userId,
  walletId,
  onSubmit,
  onClose,
}: FundWalletFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [country, setCountry] = useState<string>("NG");
  const [paymentOption, setPaymentOption] = useState<string>("card");
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState<
    { code: string; label: string }[]
  >(paymentOptionsMap["NGN"]);
  const [submitting, setSubmitting] = useState(false);

  // Update payment options when currency changes
  useEffect(() => {
    const options = paymentOptionsMap[currency] || [];
    setAvailablePaymentOptions(options);
    if (!options.find((opt) => opt.code === paymentOption)) {
      setPaymentOption(options[0]?.code || "");
    }
  }, [currency]);

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

    if (!paymentOption) {
      toast.error("Please select a payment option.");
      return;
    }

    // const MAX_AMOUNT = 200_000;
    // if (numAmount > MAX_AMOUNT) {
    //   toast.error(`You cannot fund more than ${MAX_AMOUNT.toLocaleString()}`);
    //   return;
    // }

    setSubmitting(true);

    try {
      await onSubmit({
        userId,
        walletId,
        amount: numAmount,
        description: description.trim(),
        type: "credit",
        currency,
        paymentOption,
        country,
      });

      toast.success("Wallet funded successfully!");
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund wallet.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    Boolean(userId && walletId) &&
    Number(amount) > 0 &&
    description.trim().length > 0 &&
    Boolean(country && currency && paymentOption);

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
                A service charge of ₦230 will be applied.
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

          <div>
            <Label htmlFor="fund-wallet-payment-option">
              Payment Option <span className="text-destructive">*</span>
            </Label>
            <select
              id="fund-wallet-payment-option"
              title="Payment Option"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={paymentOption}
              onChange={(e) => setPaymentOption(e.target.value)}
              required
            >
              {availablePaymentOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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
