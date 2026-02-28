"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getBanks,
  verifyBankAccount,
} from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import type { BankItem } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import {
  clearBanks,
  clearVerifiedAccount,
} from "@/redux/slice/estate-admin/fund-wallet/fund-wallet-slice";
import { ChevronDown, Search } from "lucide-react";

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
  defaultAccountNumber?: string;
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
  maxWithdrawableAmount,
  onSubmit,
  onClose,
}: FundWalletFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    banks,
    getBanksState,
    verifyBankAccountState,
    verifiedAccountName: accountName,
    error: fundWalletError,
  } = useSelector((state: RootState) => state.estateAdminFundWallet);

  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);

  useEffect(() => {
    if (defaultAccountNumber) setAccountNumber(defaultAccountNumber);
  }, [defaultAccountNumber]);
  const [description, setDescription] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [country, setCountry] = useState<string>("NG");
  const [submitting, setSubmitting] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const bankSearchInputRef = useRef<HTMLInputElement>(null);

  const loadingBanks = getBanksState === "isLoading";
  const selectedBankName =
    banks.find((b) => b.code === selectedBank)?.name ?? "";
  const filteredBanks = bankSearchQuery.trim()
    ? banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
      )
    : banks;

  // Close bank dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setBankDropdownOpen(false);
      }
    }
    if (bankDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bankDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (bankDropdownOpen) {
      setBankSearchQuery("");
      setTimeout(() => bankSearchInputRef.current?.focus(), 0);
    }
  }, [bankDropdownOpen]);
  const verifyingAccount = verifyBankAccountState === "isLoading";
  const accountVerificationError =
    verifyBankAccountState === "failed" ? (fundWalletError ?? "") : "";

  // Toast when getBanks fails
  useEffect(() => {
    if (getBanksState === "failed" && fundWalletError) {
      toast.error(fundWalletError);
    }
  }, [getBanksState, fundWalletError]);

  // Fetch banks when country is NG
  useEffect(() => {
    if (country === "NG") {
      dispatch(getBanks(country));
    } else {
      dispatch(clearBanks());
      dispatch(clearVerifiedAccount());
      setSelectedBank("");
    }
  }, [country, dispatch]);

  // Verify bank account when both account number and bank are provided (debounced)
  useEffect(() => {
    if (country === "NG" && accountNumber.trim() && selectedBank) {
      const timeoutId = setTimeout(() => {
        dispatch(
          verifyBankAccount({
            accountNumber: accountNumber.trim(),
            bankCode: selectedBank,
          }),
        );
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      dispatch(clearVerifiedAccount());
    }
  }, [accountNumber, selectedBank, country, dispatch]);

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

          {/* <div>
            <Label>Account Number</Label>
            <Input
              type="text"
              value={accountNumber}
              readOnly
              placeholder="Enter account number"
                className="bg-gray-50 cursor-not-allowed"
              required
            />
          </div> */}

          <div>
            <Label>Currency / Country</Label>
            <select
              title="Currency / Country"
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
              <Label>
                Please select the bank linked to the account number you
                registered.
              </Label>
              <div ref={bankDropdownRef} className="relative">
                {bankDropdownOpen ? (
                  <button
                    type="button"
                    title="Select Bank"
                    className="w-full flex items-center justify-between gap-2 border border-input rounded-md bg-transparent px-3 py-2 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-9"
                    onClick={() =>
                      !loadingBanks && setBankDropdownOpen((o) => !o)
                    }
                    disabled={loadingBanks}
                    aria-expanded="true"
                    aria-haspopup="listbox"
                  >
                    <span
                      className={selectedBank ? "" : "text-muted-foreground"}
                    >
                      {selectedBankName || "-- Select Bank --"}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 opacity-50"
                      aria-hidden
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Select Bank"
                    className="w-full flex items-center justify-between gap-2 border border-input rounded-md bg-transparent px-3 py-2 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-9"
                    onClick={() =>
                      !loadingBanks && setBankDropdownOpen((o) => !o)
                    }
                    disabled={loadingBanks}
                    aria-expanded="false"
                    aria-haspopup="listbox"
                  >
                    <span
                      className={selectedBank ? "" : "text-muted-foreground"}
                    >
                      {selectedBankName || "-- Select Bank --"}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 opacity-50"
                      aria-hidden
                    />
                  </button>
                )}
                {bankDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search
                          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Input
                          ref={bankSearchInputRef}
                          type="text"
                          placeholder="Search banks..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setBankDropdownOpen(false);
                          }}
                          className="pl-8 h-9"
                          aria-label="Search banks"
                        />
                      </div>
                    </div>
                    <div
                      className="max-h-60 overflow-auto py-1"
                      role="menu"
                      aria-label="Banks"
                    >
                      {filteredBanks.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No banks match your search.
                        </div>
                      ) : (
                        filteredBanks.map((bank: BankItem) => (
                          <button
                            key={bank.id}
                            type="button"
                            role="menuitem"
                            className="w-full cursor-pointer px-3 py-2 text-sm text-left hover:bg-accent focus:bg-accent outline-none rounded-none"
                            onClick={() => {
                              setSelectedBank(bank.code);
                              dispatch(clearVerifiedAccount());
                              setBankDropdownOpen(false);
                            }}
                          >
                            {bank.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {loadingBanks && (
                <p className="text-sm text-gray-500 mt-1">Loading banks...</p>
              )}
              {verifyingAccount && accountNumber.trim() && selectedBank && (
                <p className="text-sm text-gray-500 mt-1">
                  Verifying account...
                </p>
              )}
              {accountName && !verifyingAccount && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Account Name: {accountName}
                </p>
              )}
              {accountVerificationError && !verifyingAccount && (
                <p className="text-sm text-red-600 mt-1">
                  {accountVerificationError}
                </p>
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
