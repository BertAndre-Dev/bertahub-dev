"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
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
  type MissedBillPeriod,
  type PaidBillData,
} from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseResidentEstate } from "@/app/(platform)/dashboard/resident/asset/lib/estate";
import {
  formatAddressEntryLabel,
  formatAddressLabel,
  normalizeAddresses,
  type AddressOption,
} from "@/lib/address";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
} from "@/lib/table-pagination";
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

function formatPeriodRange(period: MissedBillPeriod): string {
  const start = period.periodStart ? new Date(period.periodStart) : null;
  const end = period.periodEnd ? new Date(period.periodEnd) : null;
  const startOk = start != null && !Number.isNaN(start.getTime());
  const endOk = end != null && !Number.isNaN(end.getTime());
  if (!startOk || !start) return period.label?.trim() || "Missed Payment";
  const full: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (!endOk || !end || start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", full);
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString(
    "en-US",
    sameYear ? { month: "short", day: "numeric" } : full,
  );
  return `${startText} – ${end.toLocaleDateString("en-US", full)}`;
}

function PayableBillCard({
  name,
  description,
  frequency,
  compulsory,
  isActive = true,
  nextDueDate,
  amountPayable,
  principalDue,
  accruedInterest,
  interestRatePercent,
  missedPeriods,
  onPay,
}: {
  name: string;
  description?: string;
  frequency?: string;
  compulsory?: boolean;
  isActive?: boolean;
  nextDueDate?: string | null;
  amountPayable: number;
  principalDue?: number;
  accruedInterest?: number;
  interestRatePercent?: number;
  interestStartsAt?: string;
  missedPeriods?: MissedBillPeriod[];
  onPay: () => void;
}) {
  const showInterest =
    Boolean(interestRatePercent) && Number(interestRatePercent) > 0;
  const isSuspended = isActive === false;
  const badgeParts = [
    formatFrequencyLabel(frequency),
    compulsory ? "Compulsory" : null,
  ].filter(Boolean) as string[];
  const nextDueLabel = formatInterestStart(nextDueDate);
  const periods = (missedPeriods ?? []).filter(
    (period) => period.label || period.periodStart || period.total != null,
  );
  const missedCount = periods.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [missedCount, showInterest, description]);

  return (
    <article
      className={[
        "relative flex h-72 w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-sm",
        isSuspended ? "opacity-90" : "",
      ].join(" ")}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:thin]"
      >
      <button
        type="button"
        onClick={onPay}
        className={[
          "flex w-full cursor-pointer flex-col p-5 text-left",
          "transition-[transform,background-color] duration-100 ease-out",
          "hover:bg-muted/30",
          "active:scale-[0.99] active:bg-muted/50",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight tracking-[-0.02em] text-primary capitalize">
              {name}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {isSuspended ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                Bill suspended
              </span>
            ) : null}
            {badgeParts.length > 0 ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
                {badgeParts.join(" · ")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm">Amount payable</span>
            <span className="text-lg font-semibold tabular-nums tracking-tight">
              {formatNaira(amountPayable)}
            </span>
          </div>
          {nextDueLabel ? (
            <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
              <span>Next payment date</span>
              <span className="tabular-nums">{nextDueLabel}</span>
            </div>
          ) : null}
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
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-700/45 dark:bg-amber-950/35">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500"
              aria-hidden
            />
            <p className="text-[13px] leading-snug text-muted-foreground">
              This fee accrues interest at{" "}
              <span className="font-semibold text-foreground">
                {Number(interestRatePercent)}% monthly
              </span>
              . Unpaid balances will continue to grow — the amount shown
              reflects interest accrued as of today and will increase if left
              unpaid.
            </p>
          </div>
        ) : null}
      </button>

      {missedCount > 0 ? (
        <div className="border-t border-border/70 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-medium tracking-tight">
              {missedCount === 1 ? "Missed Payment" : "Missed Payments"}
            </h4>
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-red-700 dark:text-red-300">
              {missedCount}
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {periods.map((period, index) => {
              const interest = Number(period.interest ?? 0);
              const total = Number(period.total ?? period.principal ?? 0);
              return (
                <li
                  key={period.index ?? `${period.periodStart}-${index}`}
                  className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm"
                >
                  <span className="min-w-0 leading-snug text-muted-foreground">
                    {formatPeriodRange(period)}
                    {interest > 0 ? (
                      <span className="mt-0.5 block text-[12px]">
                        Includes {formatNaira(interest)} interest
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatNaira(total)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      </div>
      {moreBelow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card to-transparent"
        />
      ) : null}
    </article>
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

function addressOptionLabel(address: AddressOption): string {
  const fromData = formatAddressEntryLabel(address.data);
  if (fromData) return fromData;
  const formatted = formatAddressLabel(address);
  return formatted && formatted !== address.id ? formatted : "";
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const canAccrueInterest = canUseBillInterest(authUser, estateModules);
  const [activeTab, setActiveTab] = useState<BillsTab>("estate");
  const [paidStartDate, setPaidStartDate] = useState("");
  const [paidEndDate, setPaidEndDate] = useState("");
  const [paidPageSize, setPaidPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [estatePageSize, setEstatePageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [assignedPageSize, setAssignedPageSize] = useState(
    DEFAULT_TABLE_PAGE_SIZE,
  );
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
  const [extraAddressLabels, setExtraAddressLabels] = useState<
    Record<string, string>
  >({});
  const fetchedAddressIds = useRef(new Set<string>());
  const [payBillId, setPayBillId] = useState<string | null>(null);

  const {
    estateBills,
    assignedBills,
    paidBills,
    estatePagination,
    assignedPagination,
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
      estatePagination: s?.estateBills?.pagination || {},
      assignedPagination: s?.assignedBills?.pagination || {},
      paidPagination: s?.paidBills?.pagination || {},
      getBillsByEstateState: s?.getBillsByEstateState as string,
      getBillsForAddressState: s?.getBillsForAddressState as string,
      getResidentBillsState: s?.getResidentBillsState as string,
      paying: s?.payBillState === "isLoading",
    };
  });

  const addressLabels = useMemo(() => {
    const labels: Record<string, string> = { ...extraAddressLabels };
    for (const address of addressOptions) {
      const label = addressOptionLabel(address);
      if (label) labels[address.id] = label;
    }
    return labels;
  }, [addressOptions, extraAddressLabels]);

  const paidAddressIds = useMemo(() => {
    const ids = paidBills
      .map((bill) => bill.addressId?.trim())
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  }, [paidBills]);

  useEffect(() => {
    const missing = paidAddressIds.filter(
      (id) => !addressLabels[id] && !fetchedAddressIds.current.has(id),
    );
    if (missing.length === 0) return;
    for (const id of missing) fetchedAddressIds.current.add(id);

    (async () => {
      const found: Record<string, string> = {};
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await axiosInstance.get(
              `/api/v1/address-mgt/entry/${id}`,
            );
            const entry = (res.data?.data ?? res.data) as {
              data?: Record<string, unknown>;
            };
            const label = formatAddressEntryLabel(entry?.data);
            if (label) found[id] = label;
          } catch {
            // Leave the cell empty when this address cannot be loaded.
          }
        }),
      );
      if (Object.keys(found).length > 0) {
        setExtraAddressLabels((prev) => ({ ...prev, ...found }));
      }
    })();
  }, [addressLabels, paidAddressIds]);

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
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getBillsByEstate({ estateId, page: 1, limit: estatePageSize }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, estatePageSize]);

  // Paid bills — date filter pattern matches rent/other pages
  useEffect(() => {
    if (!userId) return;

    dispatch(
      getResidentBills({
        residentId: userId,
        page: 1,
        limit: paidPageSize,
        startDate: paidStartDate || undefined,
        endDate: paidEndDate || undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, userId, paidStartDate, paidEndDate, paidPageSize]);

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
        limit: assignedPageSize,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, selectedAddressId, estateId, assignedPageSize]);

  const refreshAfterPay = async () => {
    if (!userId) return;

    if (estateId) {
      dispatch(
        getBillsByEstate({
          estateId,
          page:
            Number(estatePagination?.page) ||
            Number(estatePagination?.currentPage) ||
            1,
          limit: estatePageSize,
        }),
      ).catch(() => {});
    }
    if (selectedAddressId && estateId) {
      dispatch(
        getBillsForAddress({
          addressId: selectedAddressId,
          estateId,
          page:
            Number(assignedPagination?.page) ||
            Number(assignedPagination?.currentPage) ||
            1,
          limit: assignedPageSize,
        }),
      ).catch(() => {});
    }
    dispatch(
      getResidentBills({
        residentId: userId,
        page: Number(paidPagination?.page) || 1,
        limit: paidPageSize,
        startDate: paidStartDate || undefined,
        endDate: paidEndDate || undefined,
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
      key: "paidDate",
      header: "Paid Date",
      render: (item: PaidBillData) =>
        formatDateTime(item.paidDate || item.lastPaymentDate || item.createdAt, "-"),
      exportValue: (item: PaidBillData) =>
        formatDateTime(item.paidDate || item.lastPaymentDate || item.createdAt, ""),
    },
    {
      key: "billName",
      header: "Bill Name",
      render: (item: PaidBillData) => item.billName || "-",
    },
    {
      key: "address",
      header: "Address",
      render: (item: PaidBillData) =>
        (item.addressId && addressLabels[item.addressId]) || "-",
      exportValue: (item: PaidBillData) =>
        (item.addressId && addressLabels[item.addressId]) || "",
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
      key: "nextDueDate",
      header: "Next Payment Date",
      render: (item: PaidBillData) => formatDateTime(item.nextDueDate, "-"),
      exportValue: (item: PaidBillData) => formatDateTime(item.nextDueDate, ""),
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
        <IconTooltip label="View receipt">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewBill(item)}
            aria-label="View receipt"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </IconTooltip>
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
          <div className="space-y-4">
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
                    isActive={b.isActive}
                    nextDueDate={b.nextDueDate}
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
                    missedPeriods={b.missedPeriods}
                    onPay={() => b.id && setPayBillId(b.id)}
                  />
                ))
              )}
            </div>
            {estateId ? (
              <Pagination
                itemLabel="bills"
                disabled={loadingEstate}
                pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
                paginationInfo={{
                  total: Number(estatePagination?.total) || estateBills.length || 0,
                  current:
                    Number(estatePagination?.page) ||
                    Number(estatePagination?.currentPage) ||
                    1,
                  pageSize: estatePageSize,
                }}
                onPageChange={(page) => {
                  if (!estateId) return;
                  dispatch(
                    getBillsByEstate({
                      estateId,
                      page,
                      limit: estatePageSize,
                    }),
                  )
                    .unwrap()
                    .catch((err: unknown) => {
                      const message = getApiErrorMessage(err);
                      if (message) toast.error(message);
                    });
                }}
                onPageSizeChange={setEstatePageSize}
              />
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
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
                      isActive={b.isActive}
                      nextDueDate={b.nextDueDate}
                      amountPayable={amount}
                      principalDue={Number(b.principalDue ?? amount)}
                      accruedInterest={Number(b.accruedInterest ?? 0)}
                      interestRatePercent={
                        canAccrueInterest && hasActiveInterest(b)
                          ? Number(b.interestRatePercent)
                          : undefined
                      }
                      interestStartsAt={b.interestStartsAt}
                      missedPeriods={b.missedPeriods}
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
            {selectedAddressId ? (
              <Pagination
                itemLabel="bills"
                disabled={loadingAssigned}
                pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
                paginationInfo={{
                  total:
                    Number(assignedPagination?.total) ||
                    assignedBills.length ||
                    0,
                  current:
                    Number(assignedPagination?.page) ||
                    Number(assignedPagination?.currentPage) ||
                    1,
                  pageSize: assignedPageSize,
                }}
                onPageChange={(page) => {
                  if (!selectedAddressId || !estateId) return;
                  dispatch(
                    getBillsForAddress({
                      addressId: selectedAddressId,
                      estateId,
                      page,
                      limit: assignedPageSize,
                    }),
                  )
                    .unwrap()
                    .catch((err: unknown) => {
                      const message = getApiErrorMessage(err);
                      if (message) toast.error(message);
                    });
                }}
                onPageSizeChange={setAssignedPageSize}
              />
            ) : null}
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
              pageSize: paidPageSize,
            }}
            onPageChange={(page) => {
              if (!userId) return;
              dispatch(
                getResidentBills({
                  residentId: userId,
                  page,
                  limit: paidPageSize,
                  startDate: paidStartDate || undefined,
                  endDate: paidEndDate || undefined,
                }),
              )
                .unwrap()
                .catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
            }}
            onPageSizeChange={(size) => {
              setPaidPageSize(size);
            }}
            enableExport
            exportFileName="paid-bills"
            onExportRequest={
              userId
                ? async () => {
                    const res = await dispatch(
                      getResidentBills({
                        residentId: userId,
                        page: 1,
                        limit: 50000,
                        startDate: paidStartDate || undefined,
                        endDate: paidEndDate || undefined,
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
            addressLabel:
              (viewBill?.addressId && addressLabels[viewBill.addressId]) ||
              resolveReceiptAddressLabel(
                addressOptions,
                viewBill?.addressId || selectedAddressId,
              ),
          }}
        />
      </div>
    </div>
  );
}