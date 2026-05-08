"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createWallet,
  getWallet,
} from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import {
  createTransaction,
  initializePayment,
} from "@/redux/slice/resident/transaction/transaction";
import {
  createBillPaymentPin,
  updateBillPaymentPin,
} from "@/redux/slice/resident/set-pin/set-pin";
import {
  getBillCategories,
  getBillersByCategory,
  getBillItemsByBiller,
  payBillViaWallet,
  getBillPaymentHistory,
} from "@/redux/slice/resident/bills-payment/bills-payment";
import {
  clearPayment,
  resetBillsPaymentError,
} from "@/redux/slice/resident/bills-payment/bills-payment-slice";

import FundWalletModal from "@/components/resident/transaction/fund-wallet-modal/page";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";
import { ResidentWalletCard } from "@/components/resident/wallet/ResidentWalletCard";
import { SetUpPinCard } from "@/components/resident/pay-bills/SetUpPinCard";
import { UpdatePinCard } from "@/components/resident/pay-bills/UpdatePinCard";
import { BillPaymentFormCard } from "@/components/resident/pay-bills/BillPaymentFormCard";
import { BillPaymentHistoryCard } from "@/components/resident/pay-bills/BillPaymentHistoryCard";
import { BillPaymentResultModal } from "@/components/resident/pay-bills/BillPaymentResultModal";
import type { ResidentBillsPaymentState } from "@/redux/slice/resident/bills-payment/bills-payment-slice";

function pickPaymentReference(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== "object") return undefined;
  const root = payload as Record<string, unknown>;
  const data =
    root.data != null && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const keys = [
    "reference",
    "ref",
    "transaction_ref",
    "tx_ref",
    "request_reference",
    "requestReference",
  ];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

export default function PayBillsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [open, setOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [residentType, setResidentType] = useState<string | null>(null);
  const [hasBillPaymentPin, setHasBillPaymentPin] = useState<boolean>(false);

  const [country, setCountry] = useState("NG");
  const [categoryCode, setCategoryCode] = useState("");
  const [billerCode, setBillerCode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [billRef, setBillRef] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [pin, setPin] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  const [payResultModal, setPayResultModal] = useState<{
    open: boolean;
    success: boolean;
    title: string;
    message: string;
    reference?: string;
  }>({
    open: false,
    success: false,
    title: "",
    message: "",
  });

  const closePayResultModal = () => {
    setPayResultModal((prev) => ({ ...prev, open: false }));
    dispatch(resetBillsPaymentError());
    dispatch(clearPayment());
  };

  const wallet = useSelector(
    (state: RootState) => state.wallet.wallet,
  ) as WalletData | null;
  const createWalletState = useSelector(
    (state: RootState) => state.wallet.createWalletState,
  );

  const billsPayment = useSelector(
    (state: RootState) => state.residentBillsPayment,
  ) as ResidentBillsPaymentState;

  const isOwner = residentType === "owner";
  const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

  // ── 1. On mount: load user + wallet ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.id;
        const userEmail = userRes?.data?.email;
        const rType =
          userRes?.data?.residentType ?? userRes?.data?.resident_type ?? null;
        const billPaymentPinHash = userRes?.data?.billPaymentPinHash ?? null;

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");
        setResidentType(rType ?? null);
        setHasBillPaymentPin(Boolean(billPaymentPinHash));

        await dispatch(getWallet(id)).unwrap();
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load data.");
      }
    })();
  }, [dispatch]);

  // ── 2. Fetch categories when country changes ──────────────────────────────
  useEffect(() => {
    dispatch(getBillCategories({ country })).catch(() => {});
  }, [dispatch, country]);

  // ── 3. Fetch history when page changes (covers initial load too) ──────────
  useEffect(() => {
    dispatch(
      getBillPaymentHistory({ page: historyPage, limit: historyLimit }),
    ).catch(() => {});
  }, [dispatch, historyPage]);

  // ── 4. Fetch billers when category changes ────────────────────────────────
  useEffect(() => {
    if (!categoryCode) return;
    dispatch(getBillersByCategory({ country, category_code: categoryCode }))
      .unwrap()
      .catch((e: any) => {
        toast.error(e?.message ?? "Failed to load billers.");
      });
    setBillerCode("");
    setItemCode("");
  }, [dispatch, country, categoryCode]);

  // ── 5. Fetch items when biller changes ────────────────────────────────────
  useEffect(() => {
    if (!billerCode) return;
    dispatch(getBillItemsByBiller({ country, biller_code: billerCode }))
      .unwrap()
      .catch((e: any) => {
        toast.error(e?.message ?? "Failed to load bill items.");
      });
    setItemCode("");
  }, [dispatch, country, billerCode]);

  const handleCreateWalletDirect = async () => {
    if (!userId) return;
    try {
      await dispatch(
        createWallet({ userId, balance: 0, lockedBalance: 0 }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      dispatch(getWallet(userId));
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message || "Failed to create wallet.";
      toast.error(msg);
    }
  };

  const handleCreateWalletClick = () => {
    if (!userId) return;
    if (isOwner) {
      setCreateWalletModalOpen(true);
    } else {
      handleCreateWalletDirect();
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleFundWallet = async ({
    userId,
    walletId,
    amount,
    description,
    type,
    currency,
    paymentOption,
    country,
  }: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
  }) => {
    try {
      const txRes = await dispatch(
        createTransaction({ userId, walletId, amount, description, type }),
      ).unwrap();

      const tx_ref = txRes?.data?.tx_ref;
      if (!tx_ref) throw new Error("Transaction reference not found");

      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country,
          currency,
          redirect_url: `${globalThis.location.origin}/dashboard/resident/pay-bills`,
          payment_options: paymentOption,
          customer: { email },
          customizations: { title: "Wallet Funding", description },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");

      globalThis.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund wallet.");
    }
  };

  const handleSubmitBillPin = async (pin: string) => {
    await dispatch(createBillPaymentPin({ pin })).unwrap();
    setHasBillPaymentPin(true);
  };

  const handleUpdateBillPin = async ({
    currentPin,
    newPin,
  }: {
    currentPin: string;
    newPin: string;
  }) => {
    await dispatch(updateBillPaymentPin({ currentPin, newPin })).unwrap();
    toast.success("PIN updated successfully.");
    setHasBillPaymentPin(true);
    dispatch(getSignedInUser()).catch(() => {});
  };

  // ── PIN-first flow: user must set PIN before seeing full Pay Bills UI ──
  if (!hasBillPaymentPin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Pay Bills</h1>
        <p className="text-sm text-muted-foreground">
          Set up your 4-digit bill payment PIN to continue.
        </p>
        <div className="w-full">
          <SetUpPinCard onSubmitPin={handleSubmitBillPin} />
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (!hasBillPaymentPin) {
      toast.error("Please set up your bill payment PIN first.");
      return;
    }
    if (!billerCode) return toast.error("Please select a biller.");
    if (!itemCode) return toast.error("Please select a bill item/package.");
    if (!customerId.trim())
      return toast.error("Please enter customer identifier.");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0)
      return toast.error("Please enter a valid amount.");
    const trimmedPin = pin.trim();
    if (trimmedPin.length !== 4)
      return toast.error("Enter your 4-digit PIN to proceed.");

    const ref =
      (globalThis.crypto as any)?.randomUUID?.() ??
      `bill-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const callbackUrl = globalThis.window
      ? `${globalThis.location.origin}/dashboard/resident/pay-bills`
      : undefined;

    try {
      const payPayload = await dispatch(
        payBillViaWallet({
          country,
          customer_id: customerId.trim(),
          item_code: itemCode,
          amount: amt,
          biller_code: billerCode,
          reference: ref,
          callback_url: callbackUrl,
          pin: trimmedPin,
        }),
      ).unwrap();

      const apiRef = pickPaymentReference(payPayload);
      setPayResultModal({
        open: true,
        success: true,
        title: "Payment successful",
        message:
          "Your bill payment was processed. Wallet balance and history will update shortly.",
        reference: apiRef ?? ref,
      });

      if (userId) dispatch(getWallet(userId)).catch(() => {});
      setHistoryPage(1);
      dispatch(
        getBillPaymentHistory({ page: 1, limit: historyLimit }),
      ).catch(() => {});
      setPin("");
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Payment failed. Please try again.";
      setPayResultModal({
        open: true,
        success: false,
        title: "Payment unsuccessful",
        message: msg,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pay Bills</h1>
      <p className="text-sm text-muted-foreground">
        Pay your bills securely and conveniently.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResidentWalletCard
          wallet={wallet}
          isOwner={isOwner}
          formatNaira={formatNaira}
          variant="fundOnly"
          createWalletState={String(createWalletState)}
          createWalletModalOpen={createWalletModalOpen}
          onFundWalletClick={handleOpenModal}
          onWithdrawClick={() => {}}
          onTransferToBalanceClick={() => {}}
          onCreateWalletClick={handleCreateWalletClick}
        />

        <UpdatePinCard onSubmitPin={handleUpdateBillPin} />
      </div>

      <BillPaymentFormCard
        billsPayment={billsPayment}
        country={country}
        onCountryChange={setCountry}
        categoryCode={categoryCode}
        onCategoryChange={setCategoryCode}
        billerCode={billerCode}
        onBillerChange={setBillerCode}
        itemCode={itemCode}
        onItemChange={setItemCode}
        customerId={customerId}
        onCustomerIdChange={setCustomerId}
        billRef={billRef}
        onBillRefChange={setBillRef}
        amount={amount}
        onAmountChange={setAmount}
        pin={pin}
        onPinChange={setPin}
        onPay={handlePay}
      />

      <BillPaymentHistoryCard
        billsPayment={billsPayment}
        historyPage={historyPage}
        historyLimit={historyLimit}
        onHistoryPageChange={setHistoryPage}
      />

      <FundWalletModal
        visible={open}
        onClose={handleOpenModal}
        userId={userId}
        walletId={wallet?.id ?? null}
        onSubmit={handleFundWallet}
      />

      <BillPaymentResultModal
        open={payResultModal.open}
        onClose={closePayResultModal}
        success={payResultModal.success}
        title={payResultModal.title}
        message={payResultModal.message}
        reference={payResultModal.reference}
      />
    </div>
  );
}