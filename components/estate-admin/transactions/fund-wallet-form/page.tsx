"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { axiosInstance } from "@/utils/axiosInstance";

// Country/currency/payment data (you can fetch dynamically from your backend)
const countries = [
  { code: "NG", currency: "NGN", name: "Nigeria" },
  // { code: "GB", currency: "GBP", name: "United Kingdom" },
  // { code: "EU", currency: "EUR", name: "European Union" },
  // { code: "GH", currency: "GHS", name: "Ghana" },
];


interface FundWalletFormProps {
  userId: string;
  walletId: string;
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
  onSubmit,
  onClose,
}: FundWalletFormProps) {
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [country, setCountry] = useState<string>("NG");
  const [submitting, setSubmitting] = useState(false);
  const [banks, setBanks] = useState<{ id: number; code: string; name: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [accountName, setAccountName] = useState<string>("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerificationError, setAccountVerificationError] = useState<string>("");

  // Fetch banks when country is NG
  useEffect(() => {
    const fetchBanks = async () => {
      if (country === "NG") {
        setLoadingBanks(true);
        try {
          const response = await axiosInstance.get("/api/v1/payment-mgt/banks", {
            params: { country }
          });

          if (response.data?.success && response.data?.data) {
            setBanks(response.data.data);
          } else {
            toast.error("Failed to load banks");
          }
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to load banks");
        } finally {
          setLoadingBanks(false);
        }
      } else {
        setBanks([]);
        setSelectedBank("");
        setAccountName("");
        setAccountVerificationError("");
      }
    };

    fetchBanks();
  }, [country]);

  // Verify bank account when both account number and bank are provided
  useEffect(() => {
    const verifyBankAccount = async () => {
      // Only verify if country is NG, both account number and bank are provided
      if (country === "NG" && accountNumber.trim() && selectedBank) {
        setVerifyingAccount(true);
        setAccountVerificationError("");
        setAccountName("");

        try {
          const response = await axiosInstance.get("/api/v1/payment-mgt/verify-bank-account", {
            params: {
              accountNumber: accountNumber.trim(),
              bankCode: selectedBank,
            },
          });

          if (response.data?.account_name) {
            setAccountName(response.data.account_name);
            setAccountVerificationError("");
          } else {
            setAccountVerificationError("Account not found");
            setAccountName("");
          }
        } catch (error: any) {
          setAccountVerificationError("Account not found");
          setAccountName("");
        } finally {
          setVerifyingAccount(false);
        }
      } else {
        // Reset when conditions are not met
        setAccountName("");
        setAccountVerificationError("");
      }
    };

    // Debounce the verification to avoid too many API calls
    const timeoutId = setTimeout(() => {
      verifyBankAccount();
    }, 500); // Wait 500ms after user stops typing/selecting

    return () => clearTimeout(timeoutId);
  }, [accountNumber, selectedBank, country]);

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

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!accountNumber || accountNumber.trim() === "") {
      toast.error("Please enter an account number.");
      return;
    }

    if (country === "NG" && !selectedBank) {
      toast.error("Please select a bank.");
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
        bankCode: country === "NG" ? selectedBank : undefined,
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
          <CardTitle className="text-lg font-semibold text-blue-600">Withdraw Fund</CardTitle>
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
            <Label>Account Number</Label>
            <Input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                // Reset verification when account number changes
                setAccountName("");
                setAccountVerificationError("");
              }}
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <Label>Currency / Country</Label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={country}
              onChange={handleCurrencyChange}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.currency} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {country === "NG" && (
            <div>
              <Label>Select Bank</Label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedBank}
                onChange={(e) => {
                  setSelectedBank(e.target.value);
                  // Reset verification when bank changes
                  setAccountName("");
                  setAccountVerificationError("");
                }}
                disabled={loadingBanks}
                required
              >
                <option value="">-- Select Bank --</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {loadingBanks && (
                <p className="text-sm text-gray-500 mt-1">Loading banks...</p>
              )}
              {verifyingAccount && accountNumber.trim() && selectedBank && (
                <p className="text-sm text-gray-500 mt-1">Verifying account...</p>
              )}
              {accountName && !verifyingAccount && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Account Name: {accountName}
                </p>
              )}
              {accountVerificationError && !verifyingAccount && (
                <p className="text-sm text-red-600 mt-1">{accountVerificationError}</p>
              )}
            </div>
          )}

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