"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import Table from "@/components/tables/list/page";
import { formatAmountDisplay } from "@/lib/format-number";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatAddressEntryLabel } from "@/lib/address";
import type { AppDispatch } from "@/redux/store";
import {
  getBillsByEstate,
  getBillsForAddress,
} from "@/redux/slice/admin/bills-mgt/bills";
import type { AssignedBillData } from "@/redux/slice/admin/bills-mgt/bills-slice";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";

type BillsSubTab = "bills" | "assigned";

type BillRow = {
  id?: string;
  createdAt?: string;
  name: string;
  description: string;
  yearlyAmount?: number;
  amount?: number;
  frequency?: string;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
  isActive?: boolean;
};

const SUB_TABS: { id: BillsSubTab; label: string }[] = [
  { id: "bills", label: "Bills" },
  { id: "assigned", label: "Assigned bills" },
];

function formatFrequencyLabel(frequency?: string): string {
  if (!frequency) return "—";
  const map: Record<string, string> = {
    oneoff: "One-off",
    oneOff: "One-off",
    quarterly: "Quarterly",
    yearly: "Yearly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

function formatInterestRate(item: {
  accrueInterest?: boolean;
  interestRatePercent?: number;
}) {
  if (!item.accrueInterest) return "—";
  const rate = item.interestRatePercent;
  if (rate == null || Number.isNaN(Number(rate))) return "—";
  return `${Number(rate)}%`;
}

function formatInterestStartsAt(item: {
  accrueInterest?: boolean;
  interestStartsAt?: string;
}) {
  if (!item.accrueInterest || !item.interestStartsAt) return "—";
  const date = new Date(item.interestStartsAt);
  if (Number.isNaN(date.getTime())) return item.interestStartsAt;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function YesNoBadge({ value }: Readonly<{ value?: boolean }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        value ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

type Props = Readonly<{
  estateId: string;
}>;

export function EstateBillsTab({ estateId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [activeSubTab, setActiveSubTab] = useState<BillsSubTab>("bills");

  const [bills, setBills] = useState<BillRow[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsPage, setBillsPage] = useState(1);
  const [billsPageSize, setBillsPageSize] = useState(10);
  const [billsPagination, setBillsPagination] = useState<{
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [billsStartDate, setBillsStartDate] = useState("");
  const [billsEndDate, setBillsEndDate] = useState("");

  const [addressOptions, setAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [assignedAddressId, setAssignedAddressId] = useState("");
  const [assignedBills, setAssignedBills] = useState<AssignedBillData[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(10);
  const [assignedPagination, setAssignedPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    currentPage?: number;
    pageSize?: number;
  } | null>(null);
  const [assignedStartDate, setAssignedStartDate] = useState("");
  const [assignedEndDate, setAssignedEndDate] = useState("");

  const fetchBills = useCallback(
    async (page = 1, limit = billsPageSize) => {
      if (!estateId) return;
      setBillsLoading(true);
      try {
        const shouldApplyDate = Boolean(billsStartDate && billsEndDate);
        const res = await dispatch(
          getBillsByEstate({
            estateId,
            page,
            limit,
            startDate: shouldApplyDate ? billsStartDate : undefined,
            endDate: shouldApplyDate ? billsEndDate : undefined,
          }),
        ).unwrap();
        setBills(Array.isArray(res?.data) ? res.data : []);
        setBillsPagination(res?.pagination ?? null);
        setBillsPage(page);
      } catch (err: unknown) {
        setBills([]);
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBillsLoading(false);
      }
    },
    [dispatch, estateId, billsStartDate, billsEndDate, billsPageSize],
  );

  const fetchAssignedBills = useCallback(
    async (addressId: string, page = 1, limit = assignedPageSize) => {
      if (!estateId || !addressId) return;
      setAssignedLoading(true);
      try {
        const shouldApplyDate = Boolean(assignedStartDate && assignedEndDate);
        const res = await dispatch(
          getBillsForAddress({
            addressId,
            estateId,
            page,
            limit,
            startDate: shouldApplyDate ? assignedStartDate : undefined,
            endDate: shouldApplyDate ? assignedEndDate : undefined,
          }),
        ).unwrap();
        setAssignedBills(Array.isArray(res?.data) ? res.data : []);
        setAssignedPagination(res?.pagination ?? null);
        setAssignedPage(page);
      } catch (err: unknown) {
        setAssignedBills([]);
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setAssignedLoading(false);
      }
    },
    [dispatch, estateId, assignedStartDate, assignedEndDate, assignedPageSize],
  );

  useEffect(() => {
    if (!estateId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingAddresses(true);
        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        if (cancelled) return;

        const fields = fieldRes?.data || [];
        if (!fields.length) {
          setAddressOptions([]);
          return;
        }

        const entryRes = await dispatch(
          getEntriesByField({ fieldId: fields[0].id, page: 1, limit: 500 }),
        ).unwrap();
        if (cancelled) return;

        const entries = entryRes?.data || [];
        const options = entries.map(
          (entry: { id: string; data?: Record<string, string> }) => ({
            label: formatAddressEntryLabel(entry.data) || entry.id,
            value: entry.id,
          }),
        );
        setAddressOptions(options);
        if (options.length === 1) {
          setAssignedAddressId((prev) => prev || options[0].value);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
      } finally {
        if (!cancelled) setLoadingAddresses(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, estateId]);

  useEffect(() => {
    if (activeSubTab === "bills") {
      fetchBills(1).catch(() => {});
    }
  }, [activeSubTab, fetchBills]);

  useEffect(() => {
    if (activeSubTab === "assigned" && assignedAddressId) {
      fetchAssignedBills(assignedAddressId, 1).catch(() => {});
    }
  }, [activeSubTab, assignedAddressId, fetchAssignedBills]);

  const billColumns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: BillRow) =>
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
      },
      { key: "name", header: "Bill name" },
      { key: "description", header: "Description" },
      {
        key: "amount",
        header: "Amount (₦)",
        render: (item: BillRow) =>
          formatAmountDisplay(item.amount ?? item.yearlyAmount),
      },
      {
        key: "frequency",
        header: "Frequency",
        render: (item: BillRow) => formatFrequencyLabel(item.frequency),
      },
      {
        key: "compulsory",
        header: "Compulsory",
        render: (item: BillRow) => <YesNoBadge value={item.compulsory} />,
      },
      {
        key: "accrueInterest",
        header: "Accrue interest",
        render: (item: BillRow) => <YesNoBadge value={item.accrueInterest} />,
      },
      {
        key: "interestRatePercent",
        header: "Interest rate",
        render: (item: BillRow) => formatInterestRate(item),
      },
      {
        key: "interestStartsAt",
        header: "Interest starts",
        render: (item: BillRow) => formatInterestStartsAt(item),
      },
      {
        key: "isActive",
        header: "Status",
        render: (item: BillRow) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.isActive ? "Active" : "Suspended"}
          </span>
        ),
      },
    ],
    [],
  );

  const assignedColumns = useMemo(
    () => [
      {
        key: "billName",
        header: "Bill name",
        render: (item: AssignedBillData) => item.billName || "—",
      },
      {
        key: "createdAt",
        header: "Created",
        render: (item: AssignedBillData) =>
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
      },
      {
        key: "frequency",
        header: "Frequency",
        render: (item: AssignedBillData) =>
          formatFrequencyLabel(item.frequency),
      },
      {
        key: "amountDue",
        header: "Amount due (₦)",
        render: (item: AssignedBillData) =>
          formatAmountDisplay(
            Number(item.amountDue ?? item.amount ?? item.amountPaid ?? 0),
          ),
      },
      {
        key: "compulsory",
        header: "Compulsory",
        render: (item: AssignedBillData) => (
          <YesNoBadge value={item.compulsory} />
        ),
      },
      {
        key: "accrueInterest",
        header: "Accrue interest",
        render: (item: AssignedBillData) => (
          <YesNoBadge value={item.accrueInterest} />
        ),
      },
      {
        key: "interestRatePercent",
        header: "Interest rate",
        render: (item: AssignedBillData) => formatInterestRate(item),
      },
      {
        key: "interestStartsAt",
        header: "Interest starts",
        render: (item: AssignedBillData) => formatInterestStartsAt(item),
      },
      {
        key: "status",
        header: "Status",
        render: (item: AssignedBillData) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              (item.status || "").toLowerCase() === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.status || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={[
              "cursor-pointer whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeSubTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "bills" ? (
        <>
          {billsLoading && bills.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading bills...
            </p>
          ) : (
            <Table
              columns={billColumns}
              data={bills}
              emptyMessage="No bills found for this estate."
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={billsStartDate}
              endDate={billsEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setBillsStartDate(startDate);
                setBillsEndDate(endDate);
              }}
              showPagination={Boolean(
                billsPagination && billsPagination.total > 0,
              )}
              paginationInfo={
                billsPagination
                  ? {
                      total: billsPagination.total,
                      current: billsPage,
                      pageSize: billsPageSize,
                    }
                  : undefined
              }
              onPageChange={(page) => {
                fetchBills(page).catch(() => {});
              }}
              onPageSizeChange={(size) => {
                setBillsPageSize(size);
                fetchBills(1, size).catch(() => {});
              }}
            />
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="w-full lg:w-80">
            <Label htmlFor="estate-assigned-address-filter">
              Filter by address
            </Label>
            <select
              id="estate-assigned-address-filter"
              aria-label="Filter assigned bills by address"
              className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
              value={assignedAddressId}
              onChange={(e) => setAssignedAddressId(e.target.value)}
              disabled={loadingAddresses || addressOptions.length === 0}
            >
              <option value="">Select address...</option>
              {addressOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {loadingAddresses ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Loading addresses...
              </p>
            ) : null}
          </div>

          {!assignedAddressId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select an address to view assigned bills.
            </p>
          ) : assignedLoading && assignedBills.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading assigned bills...
            </p>
          ) : (
            <Table
              columns={assignedColumns}
              data={assignedBills}
              emptyMessage="No bills assigned to this address."
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={assignedStartDate}
              endDate={assignedEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setAssignedStartDate(startDate);
                setAssignedEndDate(endDate);
              }}
              showPagination={Boolean(
                assignedPagination && assignedPagination.total > 0,
              )}
              paginationInfo={
                assignedPagination
                  ? {
                      total: assignedPagination.total,
                      current:
                        assignedPage ||
                        Number(assignedPagination.page) ||
                        Number(assignedPagination.currentPage) ||
                        1,
                      pageSize: assignedPageSize,
                    }
                  : undefined
              }
              onPageChange={(page) => {
                fetchAssignedBills(assignedAddressId, page).catch(() => {});
              }}
              onPageSizeChange={(size) => {
                setAssignedPageSize(size);
                fetchAssignedBills(assignedAddressId, 1, size).catch(() => {});
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default EstateBillsTab;
