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
} from "@/redux/slice/resident/payment-mgt/payment-mgt";
import type { BankItem } from "@/redux/slice/resident/payment-mgt/payment-mgt";
import {
  clearResidentBanks,
  clearResidentVerifiedAccount,
} from "@/redux/slice/resident/payment-mgt/payment-mgt-slice";
import { createWallet } from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import { ChevronDown, Search } from "lucide-react";

const COUNTRY = "NG";

interface CreateWalletModalProps {
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CreateWalletModal({
  userId,
  onSuccess,
  onClose,
}: CreateWalletModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    banks,
    getBanksState,
    verifyBankAccountState,
    verifiedAccountName,
    error: paymentError,
  } = useSelector((state: RootState) => state.residentPaymentMgt);

  const [ownerName, setOwnerName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const bankSearchInputRef = useRef<HTMLInputElement>(null);

  const loadingBanks = getBanksState === "isLoading";
  const selectedBank = banks.find((b) => b.code === selectedBankCode);
  const selectedBankName = selectedBank?.name ?? "";
  const filteredBanks = bankSearchQuery.trim()
    ? banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
      )
    : banks;
  const verifyingAccount = verifyBankAccountState === "isLoading";
  const accountVerified =
    verifyBankAccountState === "succeeded" && !!verifiedAccountName;
  const accountError =
    verifyBankAccountState === "failed"
      ? (paymentError ?? "Account not found")
      : "";

  useEffect(() => {
    dispatch(getBanks(COUNTRY));
    return () => {
      dispatch(clearResidentBanks());
      dispatch(clearResidentVerifiedAccount());
    };
  }, [dispatch]);

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

  useEffect(() => {
    if (bankDropdownOpen) {
      setBankSearchQuery("");
      setTimeout(() => bankSearchInputRef.current?.focus(), 0);
    }
  }, [bankDropdownOpen]);

  useEffect(() => {
    if (
      COUNTRY === "NG" &&
      accountNumber.trim().length >= 10 &&
      selectedBankCode
    ) {
      const timeoutId = setTimeout(() => {
        dispatch(
          verifyBankAccount({
            accountNumber: accountNumber.trim(),
            bankCode: selectedBankCode,
          }),
        );
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      dispatch(clearResidentVerifiedAccount());
    }
  }, [accountNumber, selectedBankCode, dispatch]);

  useEffect(() => {
    if (getBanksState === "failed" && paymentError) {
      toast.error(paymentError);
    }
  }, [getBanksState, paymentError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      toast.error("Please enter account owner name.");
      return;
    }
    if (!selectedBankCode) {
      toast.error("Please select a bank.");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter account number.");
      return;
    }
    if (accountNumber.trim().length < 10) {
      toast.error("Account number must be at least 10 digits.");
      return;
    }
    if (!accountVerified) {
      toast.error(
        "Please wait for account verification or check account details.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        createWallet({
          userId,
          balance: 0,
          lockedBalance: 0,
          residentType: "owner",
          ownerName: ownerName.trim(),
          bankCode: selectedBankCode,
          bankSortCode: selectedBankCode,
        }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to create wallet.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Create Wallet (Owner)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your bank details to create your wallet.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bank name</Label>
            <div ref={bankDropdownRef} className="relative mt-1">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 border border-input rounded-md bg-transparent px-3 py-2 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-9"
                onClick={() => !loadingBanks && setBankDropdownOpen((o) => !o)}
                disabled={loadingBanks}
                aria-expanded={bankDropdownOpen ? "true" : "false"}
                aria-haspopup="listbox"
              >
                <span
                  className={selectedBankCode ? "" : "text-muted-foreground"}
                >
                  {selectedBankName || "Select bank"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </button>
              {bankDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      />
                    </div>
                  </div>
                  <div
                    className="max-h-60 overflow-auto py-1"
                    role="listbox"
                    aria-label="Banks"
                  >
                    {filteredBanks.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {loadingBanks
                          ? "Loading banks..."
                          : "No banks match your search."}
                      </div>
                    ) : (
                      filteredBanks.map((bank: BankItem) => (
                        <button
                          key={bank.id}
                          type="button"
                          role="option"
                          className="w-full cursor-pointer px-3 py-2 text-sm text-left hover:bg-accent focus:bg-accent outline-none rounded-none"
                          onClick={() => {
                            setSelectedBankCode(bank.code);
                            dispatch(clearResidentVerifiedAccount());
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
              <p className="text-sm text-muted-foreground mt-1">
                Loading banks...
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="accountNumber">Account number</Label>
            <Input
              id="accountNumber"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                const v = e.target.value.replaceAll(/\D/g, "").slice(0, 10);
                setAccountNumber(v);
              }}
              placeholder="10 digits"
              maxLength={10}
              className="mt-1"
            />
            {verifyingAccount && accountNumber.trim() && selectedBankCode && (
              <p className="text-sm text-muted-foreground mt-1">
                Verifying account...
              </p>
            )}
            {accountVerified && !verifyingAccount && (
              <p className="text-sm text-green-600 font-medium mt-1">
                Account name: {verifiedAccountName}
              </p>
            )}
            {accountError &&
              !verifyingAccount &&
              accountNumber.trim().length >= 10 &&
              selectedBankCode && (
                <p className="text-sm text-red-600 mt-1">{accountError}</p>
              )}
          </div>

          <div>
            <Label htmlFor="ownerName">Account owner name</Label>
            <Input
              id="ownerName"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Full name as on bank account"
              required
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !accountVerified}
              className="flex-1"
            >
              {submitting ? "Creating..." : "Create wallet"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
