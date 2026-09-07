"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Info } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm from "@/components/resident/bill-form/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import {
  resolveReceiptAddressLabel,
  residentDisplayName,
} from "@/components/receipt/format";
import {
  getBillsByEstate,
  getBillsForAddress,
  getResidentBills,
  payBill,
} from "@/redux/slice/resident/bill-mgt/bills-mgt";
import {
  clearAssignedBills,
  type AssignedBillData,
  type EstateBillData,
  type PaidBillData,
} from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseResidentEstate } from "@/app/dashboard/resident/asset/lib/estate";
import {
  normalizeAddresses,
  type AddressOption,
} from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format-date";
import { canUseBillInterest } from "@/lib/user-modules";
import {
  paidByEmail,
  paidByExportLabel,
  paidByName,
} from "@/lib/paid-by";
import { selectEstateModules } from "@/redux/slice/auth-mgt/auth-mgt-slice";

type BillsTab = "estate" | "assigned";

const TABS: { id: BillsTab; label: string }[] = [
  { id: "estate", label: "Estate Bills" },
  { id: "assigned", label: "Assigned Bills" },
];

function formatFrequencyLabel(frequency?: string): string {
  if (!frequency) return "";
  const map: Record<string, string> = {
    oneoff: "One-off",
    oneOff: "One-off",
    quarterly: "Quarterly",
    yearly: "Yearly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatInterestStart(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function hasActiveInterest(bill: {
  accrueInterest?: boolean;
  interestRatePercent?: number;
}): boolean {
  return Boolean(bill.accrueInterest) && Number(bill.interestRatePercent) > 0;
}

function PayableBillCard({
  name,
  description,
  frequency,
  compulsory,
  amountPayable,
  principalDue,
  accruedInterest,
  interestRatePercent,
  interestStartsAt,
  onPay,
}: {
  name: string;
  description?: string;
  frequency?: string;
  compulsory?: boolean;
  amountPayable: number;
  principalDue?: number;
  accruedInterest?: number;
  interestRatePercent?: number;
  interestStartsAt?: string;
  onPay: () => void;
}) {
  const showInterest =
    Boolean(interestRatePercent) && Number(interestRatePercent) > 0;
  const badgeParts = [
    formatFrequencyLabel(frequency),
    compulsory ? "Compulsory" : null,
  ].filter(Boolean) as string[];
  const startsLabel = formatInterestStart(interestStartsAt);

  return (
    <button
      type="button"
      onClick={onPay}
      className={[
        "flex w-full cursor-pointer flex-col rounded-2xl border border-border/80 bg-card p-5 text-left",
        "shadow-sm transition-[transform,background-color,box-shadow] duration-100 ease-out",
        "hover:bg-muted/30 hover:shadow-md",
        "active:scale-[0.99] active:bg-muted/50",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg text-primary font-semibold leading-tight tracking-[-0.02em] capitalize">
            {name}
          </h3>
          {description ? (
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {badgeParts.length > 0 ? (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
            {badgeParts.join(" · ")}
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm">Amount payable</span>
          <span className="text-lg font-semibold tabular-nums tracking-tight">
            {formatNaira(amountPayable)}
          </span>
        </div>
        {showInterest ? (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
              <span>Principal due</span>
              <span className="tabular-nums">
                {formatNaira(Number(principalDue ?? 0))}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
              <span>Accrued interest</span>
              <span className="tabular-nums">
                {formatNaira(Number(accruedInterest ?? 0))}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {showInterest ? (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-700/45 dark:bg-amber-950/35"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500"
            aria-hidden
          />
          <p className="text-[13px] leading-snug text-muted-foreground">
            This fee accrues interest at{" "}
            <span className="font-semibold text-foreground">
              {Number(interestRatePercent)}% monthly
            </span>. Unpaid balances
            will continue to grow — the amount shown reflects interest accrued
            as of today and will increase if left unpaid.
          </p>
        </div>
      ) : null}
    </button>
  );
}

function assignedBillName(bill: AssignedBillData): string {
  return bill.billName || bill.name || "Untitled bill";
}

function assignedBillAmount(bill: AssignedBillData): number {
  return Number(
    bill.amountPayable ?? bill.amountDue ?? bill.amount ?? bill.yearlyAmount ?? 0,
  );
}

function assignedBillPayId(bill: AssignedBillData): string | null {
  return bill.billId || bill.id || bill._id || null;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const canAccrueInterest = canUseBillInterest(authUser, estateModules);
  const [activeTab, setActiveTab] = useState<BillsTab>("estate");
  const [paidStartDate, setPaidStartDate] = useState("");
  const [paidEndDate, setPaidEndDate] = useState("");
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [bootstrapping, setBootstrapping] = useState(true);
  const [viewBill, setViewBill] = useState<PaidBillData | null>(null);
  const [payBillId, setPayBillId] = useState<string | null>(null);

  const {
    estateBills,
    assignedBills,
    paidBills,
    paidPagination,
    getBillsByEstateState,
    getBillsForAddressState,
    getResidentBillsState,
    paying,
  } = useSelector((state: RootState) => {
    const s = state.residentBill as any;
    return {
      estateBills: (s?.estateBills?.data || []) as EstateBillData[],
      assignedBills: (s?.assignedBills?.data || []) as AssignedBillData[],
      paidBills: (s?.paidBills?.data || []) as PaidBillData[],
      paidPagination: s?.paidBills?.pagination || {},
      getBillsByEstateState: s?.getBillsByEstateState as string,
      getBillsForAddressState: s?.getBillsForAddressState as string,
      getResidentBillsState: s?.getResidentBillsState as string,
      paying: s?.payBillState === "isLoading",
    };
  });

  const loadingEstate = isPending(getBillsByEstateState);
  const loadingAssigned = isPending(getBillsForAddressState);
  const loadingPaid = isPending(getResidentBillsState);

  // Bootstrap user / addresses / estate bills
  useEffect(() => {
    (async () => {
      setBootstrapping(true);
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        if (!user) {
          toast.warning("No signed in user found");
          return;
        }

        const uId = (user.id ?? user._id ?? "") as string;
        const wId =
          (user.walletId as string | undefined) ??
          ((user.wallet as { id?: string } | undefined)?.id ?? "");

        const estate = parseResidentEstate(user);
        const eId = estate?.id ?? "";
        const addresses = normalizeAddresses(user);
        const firstId = addresses.length > 0 ? addresses[0].id : null;

        setUserId(uId);
        setWalletId(wId);
        setEstateId(eId);
        setEstateName(estate?.name ?? "");
        setPayerName(
          residentDisplayName(user.firstName, user.lastName) ?? "",
        );
        setPayerEmail(
          typeof user.email === "string" ? user.email : "",
        );
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);

        if (!eId) {
          toast.warning("The signed-in user does not have an estate assigned.");
        } else {
          await dispatch(
            getBillsByEstate({ estateId: eId, page: 1, limit: 50 }),
          ).unwrap();
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  // Paid bills — date filter pattern matches rent/other pages
  useEffect(() => {
    if (!userId) return;

    const shouldApplyDate = Boolean(paidStartDate && paidEndDate);
    dispatch(
      getResidentBills({
        residentId: userId,
        page: 1,
        limit: 10,
        startDate: shouldApplyDate ? paidStartDate : undefined,
        endDate: shouldApplyDate ? paidEndDate : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, userId, paidStartDate, paidEndDate]);

  // Assigned bills for selected address
  useEffect(() => {
    if (!selectedAddressId || !estateId) {
      dispatch(clearAssignedBills());
      return;
    }

    dispatch(
      getBillsForAddress({
        addressId: selectedAddressId,
        estateId,
        page: 1,
        limit: 50,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, selectedAddressId, estateId]);

  const refreshAfterPay = async () => {
    if (!userId) return;
    const shouldApplyDate = Boolean(paidStartDate && paidEndDate);

    if (estateId) {
      dispatch(getBillsByEstate({ estateId, page: 1, limit: 50 })).catch(
        () => {},
      );
    }
    if (selectedAddressId && estateId) {
      dispatch(
        getBillsForAddress({
          addressId: selectedAddressId,
          estateId,
          page: 1,
          limit: 50,
        }),
      ).catch(() => {});
    }
    dispatch(
      getResidentBills({
        residentId: userId,
        page: Number(paidPagination?.page) || 1,
        limit: Number(paidPagination?.limit) || 10,
        startDate: shouldApplyDate ? paidStartDate : undefined,
        endDate: shouldApplyDate ? paidEndDate : undefined,
      }),
    ).catch(() => {});
  };

  const handlePayBill = async (payload: {
    billId: string;
    frequency: string;
    amountPaid: number;
  }) => {
    if (!payload.billId) return;

    if (!userId || !walletId) {
      toast.error("Missing wallet information. Please refresh and try again.");
      return;
    }

    if (!estateId) {
      toast.error("Missing estate information. Please refresh and try again.");
      return;
    }

    if (addressOptions.length > 1 && !selectedAddressId) {
      toast.error("Please select an address before paying.");
      return;
    }

    if (paying) return;

    try {
      await dispatch(
        payBill({
          billId: payload.billId,
          userId,
          walletId,
          estateId,
          addressId: selectedAddressId ?? undefined,
          frequency: payload.frequency,
          amountPaid: payload.amountPaid,
        }),
      ).unwrap();
      toast.success("Bill payment successful");
      await refreshAfterPay();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: PaidBillData) => formatDateTime(item.createdAt, "-"),
      exportValue: (item: PaidBillData) => formatDateTime(item.createdAt, ""),
    },
    {
      key: "billName",
      header: "Bill Name",
      render: (item: PaidBillData) => item.billName || "-",
    },
    {
      key: "paidBy",
      header: "Paid By",
      render: (item: PaidBillData) => {
        const name = paidByName(item.paidBy);
        const email = paidByEmail(item.paidBy);
        if (!name && !email) return "-";
        return (
          <div className="min-w-0">
            <p className="truncate">{name || email}</p>
            {name && email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
        );
      },
      exportValue: (item: PaidBillData) => paidByExportLabel(item.paidBy),
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: PaidBillData) =>
        formatFrequencyLabel(item.frequency) || item.frequency || "-",
    },
    {
      key: "amountPaid",
      header: "Amount Paid",
      render: (item: PaidBillData) =>
        `₦${Number(item.amountPaid ?? 0).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: PaidBillData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            item.status === "paid"
              ? "bg-green-100 text-green-700"
              : item.status === "active"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {item.status || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      exportable: false as const,
      render: (item: PaidBillData) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewBill(item)}
          title="View receipt"
          aria-label="View receipt"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const showLoader =
    bootstrapping ||
    (activeTab === "estate" && Boolean(estateId) && loadingEstate) ||
    (activeTab === "assigned" &&
      Boolean(selectedAddressId) &&
      loadingAssigned) ||
    paying;

  return (
    <div className="relative">
      {showLoader && (
        <Loader
          fullScreen
          label={paying ? "Processing payment..." : "Loading bills..."}
        />
      )}

      <div
        className={[
          "space-y-6",
          showLoader ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-1">
          <h1 className="font-heading text-3xl font-bold">Estate Bills</h1>
          <button
            type="button"
            onClick={() =>
              toast.info(
                "Estate bills open a payment form. Assigned bills pay when you click the card.",
              )
            }
            aria-label="How to pay"
            title="How to pay"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>

        <SwitchAddress
          addresses={addressOptions}
          value={selectedAddressId}
          onChange={setSelectedAddressId}
        />

        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "estate" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!bootstrapping &&
            isSettled(getBillsByEstateState) &&
            estateBills.length === 0 ? (
              <p className="text-muted-foreground">
                No payable bills for this estate.
              </p>
            ) : (
              estateBills.map((b) => (
                <PayableBillCard
                  key={b.id}
                  name={b.name || "Untitled bill"}
                  description={b.description}
                  frequency={b.frequency}
                  compulsory={b.compulsory}
                  amountPayable={Number(
                    b.amountPayable ?? b.yearlyAmount ?? 0,
                  )}
                  principalDue={Number(
                    b.principalDue ?? b.amount ?? b.yearlyAmount ?? 0,
                  )}
                  accruedInterest={Number(b.accruedInterest ?? 0)}
                  interestRatePercent={
                    canAccrueInterest && hasActiveInterest(b)
                      ? Number(b.interestRatePercent)
                      : undefined
                  }
                  interestStartsAt={b.interestStartsAt}
                  onPay={() => b.id && setPayBillId(b.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!selectedAddressId ? (
              <p className="text-muted-foreground">
                Select an address to view assigned bills.
              </p>
            ) : !bootstrapping &&
              isSettled(getBillsForAddressState) &&
              assignedBills.length === 0 ? (
              <p className="text-muted-foreground">
                No bills assigned to this address.
              </p>
            ) : (
              assignedBills.map((b) => {
                const payId = assignedBillPayId(b);
                const amount = assignedBillAmount(b);
                return (
                  <PayableBillCard
                    key={b.id || b._id || payId || assignedBillName(b)}
                    name={assignedBillName(b)}
                    frequency={b.frequency}
                    amountPayable={amount}
                    principalDue={Number(b.principalDue ?? amount)}
                    accruedInterest={Number(b.accruedInterest ?? 0)}
                    interestRatePercent={
                      canAccrueInterest && hasActiveInterest(b)
                        ? Number(b.interestRatePercent)
                        : undefined
                    }
                    interestStartsAt={b.interestStartsAt}
                    onPay={() =>
                      payId &&
                      handlePayBill({
                        billId: payId,
                        frequency: b.frequency || "oneOff",
                        amountPaid: amount,
                      })
                    }
                  />
                );
              })
            )}
          </div>
        )}

        <Card className="p-4">
          <h2 className="font-semibold mb-4">Your Paid Bills</h2>
          <Table
            columns={columns}
            data={paidBills}
            emptyMessage={
              isSettled(getResidentBillsState)
                ? "You haven't paid any bills yet."
                : " "
            }
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={paidStartDate}
            endDate={paidEndDate}
            onDateRangeChange={({ startDate, endDate }) => {
              setPaidStartDate(startDate);
              setPaidEndDate(endDate);
            }}
            showPagination
            paginationInfo={{
              total: paidPagination?.total || paidBills.length || 0,
              current:
                Number(paidPagination?.page) ||
                Number(paidPagination?.currentPage) ||
                1,
              pageSize:
                Number(paidPagination?.limit) ||
                Number(paidPagination?.pageSize) ||
                10,
            }}
            onPageChange={(page) => {
              if (!userId) return;
              const shouldApplyDate = Boolean(paidStartDate && paidEndDate);
              dispatch(
                getResidentBills({
                  residentId: userId,
                  page,
                  limit: Number(paidPagination?.limit) || 10,
                  startDate: shouldApplyDate ? paidStartDate : undefined,
                  endDate: shouldApplyDate ? paidEndDate : undefined,
                }),
              )
                .unwrap()
                .catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
            }}
            enableExport
            exportFileName="paid-bills"
            onExportRequest={
              userId
                ? async () => {
                    const shouldApplyDate = Boolean(
                      paidStartDate && paidEndDate,
                    );
                    const res = await dispatch(
                      getResidentBills({
                        residentId: userId,
                        page: 1,
                        limit: 50000,
                        startDate: shouldApplyDate
                          ? paidStartDate
                          : undefined,
                        endDate: shouldApplyDate ? paidEndDate : undefined,
                      }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
          {loadingPaid ? (
            <p className="text-xs text-muted-foreground mt-2">
              Loading paid bills...
            </p>
          ) : null}
        </Card>

        <Modal visible={!!payBillId} onClose={() => setPayBillId(null)}>
          {payBillId ? (
            <BillsForm
              billId={payBillId}
              estateId={estateId}
              addressOptions={addressOptions}
              selectedAddressId={selectedAddressId}
              onSelectedAddressChange={setSelectedAddressId}
              onSubmitSuccess={refreshAfterPay}
              onClose={() => setPayBillId(null)}
            />
          ) : null}
        </Modal>

        <ReceiptModal
          isOpen={!!viewBill}
          onClose={() => setViewBill(null)}
          type="bill"
          bill={viewBill}
          party={{
            payerName: payerName || undefined,
            email: payerEmail || undefined,
            estateName: estateName || undefined,
            addressLabel: resolveReceiptAddressLabel(
              addressOptions,
              viewBill?.addressId || selectedAddressId,
            ),
          }}
        />
      </div>
    </div>
  );
}