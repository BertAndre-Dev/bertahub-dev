"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  verifyTransaction,
  getEstateTransactionHistory,
  getEstateVends,
  getEstatePaidBills,
} from "@/redux/slice/estate-admin/transaction/transaction";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import {
  TransactionsFilterBar,
  type EstateTransactionsFilters,
} from "@/components/estate-admin/transactions-filter-bar";
import Loader from "@/components/ui/Loader";

interface TransactionData {
  walletId: string;
  type: string;
  amount: number;
  description: string;
  userId: string;
  id?: string;
  paymentStatus?: string;
  tx_ref?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TransactionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [email, setEmail] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<
    "history" | "vends" | "paid-bills"
  >("vends");
  const [vendsData, setVendsData] = useState<any[]>([]);
  const [vendsPagination, setVendsPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null>(null);
  const [vendsPage, setVendsPage] = useState(1);
  const [loadingVends, setLoadingVends] = useState(false);
  const [vendsStartDate, setVendsStartDate] = useState<string>("");
  const [vendsEndDate, setVendsEndDate] = useState<string>("");
  const [paidBillsData, setPaidBillsData] = useState<any[]>([]);
  const [paidBillsPage, setPaidBillsPage] = useState(1);
  const [loadingPaidBills, setLoadingPaidBills] = useState(false);
  const [paidBillsStartDate, setPaidBillsStartDate] = useState<string>("");
  const [paidBillsEndDate, setPaidBillsEndDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterType] = useState<string>("");
  const [filterStatus] = useState<string>("");
  const [filterFrequency, setFilterFrequency] = useState<string>("");
  const [filterBill, setFilterBill] = useState<string>("");
  const [filterBillStatus, setFilterBillStatus] = useState<string>("");
  const transactions = useSelector(
    (state: RootState) =>
      (state as any).estateAdminTransaction?.allTransactions?.data || [],
  );
  const pagination = useSelector(
    (state: RootState) =>
      (state as any).estateAdminTransaction?.allTransactions?.pagination,
  );
  const loading =
    useSelector(
      (state: RootState) =>
        (state as any).estateAdminTransaction?.getEstateTransactionHistoryState,
    ) === "isLoading";

  // 🔹 Fetch signed-in user and wallet on mount
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const id = (data?.id as string) || (data?._id as string) || null;
        const userEmail = (data?.email as string) || "";
        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateIdFromUser =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");

        if (!estateIdFromUser) {
          toast.error("No estate ID found for this user.");
          return;
        }

        setEstateId(estateIdFromUser);

        // ✅ Fetch estate transactions (paginated) using estateId
        await dispatch(
          getEstateTransactionHistory({
            estateId: estateIdFromUser,
            page: 1,
            limit,
            search: search || undefined,
            type: filterType || undefined,
            paymentStatus: filterStatus || undefined,
          }),
        );

        // ✅ Fetch vends and paid bills totals for stats (limit 1 just to get pagination.total)
        await Promise.all([
          dispatch(
            getEstateVends({
              estateId: estateIdFromUser,
              page: 1,
              limit: 1,
            }),
          )
            .unwrap()
            .catch(() => ({ pagination: { total: 0 } })),
          dispatch(
            getEstatePaidBills({
              estateId: estateIdFromUser,
              page: 1,
              limit: 50000,
            }),
          )
            .unwrap()
            .catch(() => ({ pagination: { total: 0 } })),
        ]);
      } catch (err) {
        toast.error("Failed to load data.");
      }
    })();
  }, [dispatch, limit]);

  // 🔹 Refetch transaction history when search or filters change (debounced for search)
  useEffect(() => {
    if (!estateId) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      dispatch(
        getEstateTransactionHistory({
          estateId,
          page: 1,
          limit,
          search: search.trim() || undefined,
          type: filterType || undefined,
          paymentStatus: filterStatus || undefined,
        }),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus, estateId, dispatch, limit]);

  // 🔹 Fetch vends when tab is vends
  useEffect(() => {
    if (activeTab !== "vends" || !estateId) return;
    (async () => {
      setLoadingVends(true);
      try {
        const shouldApplyDateFilter = Boolean(vendsStartDate && vendsEndDate);
        const res = await dispatch(
          getEstateVends({
            estateId,
            page: vendsPage,
            limit,
            startDate: shouldApplyDateFilter ? vendsStartDate : undefined,
            endDate: shouldApplyDateFilter ? vendsEndDate : undefined,
          }),
        ).unwrap();
        setVendsData(res?.data ?? []);
        setVendsPagination(res?.pagination ?? null);
      } catch {
        setVendsData([]);
        setVendsPagination(null);
      } finally {
        setLoadingVends(false);
      }
    })();
  }, [
    activeTab,
    estateId,
    vendsPage,
    dispatch,
    limit,
    vendsStartDate,
    vendsEndDate,
  ]);

  // 🔹 Fetch paid bills when tab is paid-bills (larger limit for client-side filtering)
  const PAID_BILLS_FETCH_LIMIT = 2000;
  useEffect(() => {
    if (activeTab !== "paid-bills" || !estateId) return;
    (async () => {
      setLoadingPaidBills(true);
      try {
        const res = await dispatch(
          getEstatePaidBills({
            estateId,
            page: 1,
            limit: PAID_BILLS_FETCH_LIMIT,
            startDate: paidBillsStartDate || undefined,
            endDate: paidBillsEndDate || undefined,
          }),
        ).unwrap();
        setPaidBillsData(res?.data ?? []);
        // pagination is not currently used in the UI (client-side paging)
      } catch {
        setPaidBillsData([]);
      } finally {
        setLoadingPaidBills(false);
      }
    })();
  }, [activeTab, estateId, dispatch, paidBillsStartDate, paidBillsEndDate]);

  // 🔹 Pagination Handler
  const handlePageChange = async (newPage: number) => {
    if (!estateId) return;
    setCurrentPage(newPage);
    await dispatch(
      getEstateTransactionHistory({
        estateId,
        page: newPage,
        limit,
        search: search.trim() || undefined,
        type: filterType || undefined,
        paymentStatus: filterStatus || undefined,
      }),
    );
  };

  // 🔹 Filter paid bills by Frequency, Bill, Status (client-side)
  const filteredPaidBills = useMemo(() => {
    return (paidBillsData ?? []).filter((item: any) => {
      if (filterFrequency) {
        const freq = (item.frequency ?? "").toString().toLowerCase();
        if (freq !== filterFrequency.toLowerCase()) return false;
      }
      if (filterBill) {
        const billName = item.bill?.name ?? item.billName ?? "";
        if (billName !== filterBill) return false;
      }
      if (filterBillStatus) {
        const status = (item.status ?? "").toString().toLowerCase();
        if (status !== filterBillStatus.toLowerCase()) return false;
      }
      return true;
    });
  }, [paidBillsData, filterFrequency, filterBill, filterBillStatus]);

  const paidBillsPageSize = 10;
  const paidBillsTotalPages = Math.max(
    1,
    Math.ceil(filteredPaidBills.length / paidBillsPageSize),
  );
  const paginatedPaidBills = useMemo(() => {
    const start = (paidBillsPage - 1) * paidBillsPageSize;
    return filteredPaidBills.slice(start, start + paidBillsPageSize);
  }, [filteredPaidBills, paidBillsPage, paidBillsPageSize]);

  const paidBillsFrequencyOptions = useMemo(() => {
    const set = new Set<string>();
    (paidBillsData ?? []).forEach((item: any) => {
      const f = item.frequency;
      if (f) set.add(f);
    });
    return [
      { value: "", label: "All" },
      ...Array.from(set).map((f) => ({
        value: f,
        label: f.charAt(0).toUpperCase() + f.slice(1),
      })),
    ];
  }, [paidBillsData]);

  const paidBillsBillOptions = useMemo(() => {
    const set = new Set<string>();
    (paidBillsData ?? []).forEach((item: any) => {
      const name = item.bill?.name ?? item.billName;
      if (name) set.add(name);
    });
    return [
      { value: "", label: "All" },
      ...Array.from(set).map((name) => ({ value: name, label: name })),
    ];
  }, [paidBillsData]);

  const handlePaidBillsFiltersChange = (filters: EstateTransactionsFilters) => {
    setFilterFrequency(filters.frequency);
    setFilterBill(filters.bill);
    setFilterBillStatus(filters.status);
    setPaidBillsPage(1);
  };

  // Keep paidBillsPage in bounds when filtered list shrinks
  useEffect(() => {
    const total = Math.max(
      1,
      Math.ceil(filteredPaidBills.length / paidBillsPageSize),
    );
    if (paidBillsPage > total) setPaidBillsPage(total);
  }, [filteredPaidBills.length, paidBillsPageSize, paidBillsPage]);

  const paidBillsEmptyMessage =
    filteredPaidBills.length === 0
      ? "No paid bills match the selected filters."
      : "No paid bills found.";

  // const totalBills = paidBillsData.reduce((sum: number, item: any) => sum + (item.amountPaid ?? 0), 0);
  // 🔹 Counts instead of amounts for stats (precomputed so they are available immediately)
  // const totalTransactionsCount =
  //   pagination?.total || transactions.length || 0;
  // const totalBillsCount = totalBills;

  // 🔹 Automatically verify transaction when redirected back
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get("tx_ref") || urlParams.get("trx_ref");

    if (!tx_ref) return; // User didn't come from Flutterwave

    const verifyTransactionAsync = async () => {
      try {
        // Wait for user info if not ready
        let currentUserId = userId;
        let currentEmail = email;
        let currentEstateId = estateId;

        if (!currentUserId || !currentEstateId) {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          currentUserId = userRes?.data?.id;
          currentEmail = userRes?.data?.email || "";
          currentEstateId =
            userRes?.data?.estateId || userRes?.data?.estate?.id;
          setUserId(currentUserId);
          setEmail(currentEmail);
          setEstateId(currentEstateId);
        }

        if (!currentUserId) throw new Error("User not found for verification");
        if (!currentEstateId)
          throw new Error("Estate not found for verification");

        // ✅ Trigger verification via Redux thunk
        const verificationRes = await dispatch(
          verifyTransaction({ tx_ref, paymentType: "withdrawFund" }),
        ).unwrap();

        toast.success("Withdrawal successful!");

        // Refresh transaction history
        await dispatch(
          getEstateTransactionHistory({
            estateId: currentEstateId,
            page: currentPage,
            limit,
          }),
        );

        // Clean up URL params
        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: any) {
        const errorMessage =
          err?.message || err?.payload?.message || "Verification failed";
        toast.error(errorMessage);
      }
    };

    // Small delay helps ensure wallet/user state is loaded
    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
  }, [dispatch, userId, email, estateId, currentPage, limit]);

  // Table columns for transaction history
  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    },
    {
      key: "user",
      header: "Resident",
      render: (item: any) =>
        item.user
          ? [item.user.firstName, item.user.lastName]
              .filter(Boolean)
              .join(" ") || item.user.email
          : "-",
    },
    {
      key: "email",
      header: "Email",
      render: (item: any) => item.user?.email ?? "-",
    },
    {
      key: "tx_ref",
      header: "Transaction Reference",
      render: (item: any) => item.tx_ref ?? "-",
    },

    {
      key: "type",
      header: "Type",
      render: (item: any) =>
        item.type === "credit" ? (
          <span className="text-green-600 font-medium">Credit</span>
        ) : (
          <span className="text-red-600 font-medium">Debit</span>
        ),
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (item: any) =>
        item.paymentStatus === "successful" ? (
          <span className="text-green-600 font-medium">Successful</span>
        ) : (
          <span className="text-yellow-600 font-medium">
            {item.paymentStatus || "Pending"}
          </span>
        ),
    },
  ];

  const vendsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    },
    {
      key: "user",
      header: "Resident",
      render: (item: any) =>
        item.user
          ? [item.user.firstName, item.user.lastName]
              .filter(Boolean)
              .join(" ") || item.user.email
          : "-",
      exportValue: (item: any) => {
        const u = item?.user;
        if (!u) return "";
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
        return name || u.email || "";
      },
    },
    {
      key: "email",
      header: "Email",
      render: (item: any) => {
        const email = (item?.user?.email ?? "").toString();
        if (!email) return "-";
        return (
          <span className="inline-block max-w-[180px] truncate align-bottom" title={email}>
            {email}
          </span>
        );
      },
      exportValue: (item: any) => String(item?.user?.email ?? ""),
    },
    {
      key: "meterNumber",
      header: "Meter",
      render: (item: any) => item.meterNumber ?? "-",
      exportValue: (item: any) => String(item?.meterNumber ?? ""),
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
    },
    {
      key: "energyValue",
      header: "Value",
      render: (item: any) => {
        const value = item?.fullResponse?.energyList?.[0]?.value ?? null;
        if (value == null || value === "") return "—";
        const vNum = Number(value);
        return Number.isFinite(vNum) ? String(vNum) : String(value);
      },
      exportValue: (item: any) => {
        const value = item?.fullResponse?.energyList?.[0]?.value ?? "";
        return value == null ? "" : String(value);
      },
    },
    {
      key: "energyUnit",
      header: "Unit",
      render: (item: any) => {
        const unit = item?.fullResponse?.energyList?.[0]?.unit ?? null;
        const u = String(unit ?? "").trim();
        return u || "—";
      },
      exportValue: (item: any) => {
        const unit = item?.fullResponse?.energyList?.[0]?.unit ?? "";
        return String(unit ?? "").trim();
      },
    },
    {
      key: "taxRate",
      header: "Tax Rate (%)",
      render: (item: any) => {
        const rate =
          item?.fullResponse?.energyList?.[0]?.taxRate ??
          item?.fullResponse?.energyList?.[0]?.tax_rate ??
          null;
        if (rate == null || rate === "") return "—";
        const n = Number(rate);
        return Number.isFinite(n) ? n.toFixed(2) : String(rate);
      },
      exportValue: (item: any) => {
        const rate =
          item?.fullResponse?.energyList?.[0]?.taxRate ??
          item?.fullResponse?.energyList?.[0]?.tax_rate ??
          "";
        return rate == null ? "" : String(rate);
      },
    },
    {
      key: "netRate",
      header: "Net Amount (₦)",
      render: (item: any) => {
        const e = item?.fullResponse?.energyList?.[0] ?? null;
        const amountRaw = item?.amount ?? e?.amount ?? null;
        const taxAmountRaw = e?.taxAmount ?? null;
        const taxRateRaw = e?.taxRate ?? e?.tax_rate ?? null;

        const amount = Number(amountRaw);
        if (!Number.isFinite(amount)) return "—";

        let taxAmount = Number(taxAmountRaw);
        if (!Number.isFinite(taxAmount)) {
          const taxRate = Number(taxRateRaw);
          taxAmount = Number.isFinite(taxRate) ? (amount * taxRate) / 100 : 0;
        }

        const netAmount = amount - taxAmount;
        if (!Number.isFinite(netAmount)) return "—";
        return netAmount.toLocaleString();
      },
      exportValue: (item: any) => {
        const e = item?.fullResponse?.energyList?.[0] ?? null;
        const amountRaw = item?.amount ?? e?.amount ?? null;
        const taxAmountRaw = e?.taxAmount ?? null;
        const taxRateRaw = e?.taxRate ?? e?.tax_rate ?? null;

        const amount = Number(amountRaw);
        if (!Number.isFinite(amount)) return "";

        let taxAmount = Number(taxAmountRaw);
        if (!Number.isFinite(taxAmount)) {
          const taxRate = Number(taxRateRaw);
          taxAmount = Number.isFinite(taxRate) ? (amount * taxRate) / 100 : 0;
        }

        const netAmount = amount - taxAmount;
        return Number.isFinite(netAmount) ? String(netAmount) : "";
      },
    },
  ];

  const paidBillsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    },
    {
      key: "user",
      header: "Resident",
      render: (item: any) =>
        item.user
          ? [item.user.firstName, item.user.lastName]
              .filter(Boolean)
              .join(" ") || item.user.email
          : "-",
    },
    {
      key: "email",
      header: "Email",
      render: (item: any) => item.user?.email ?? "-",
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: any) => item.frequency ?? "-",
    },
    {
      key: "Start Date",
      header: "Start Date",
      render: (item: any) => item.startDate ?? "-",
    },
    {
      key: "Next Due Date",
      header: "Next Due Date",
      render: (item: any) => item.nextDueDate ?? "-",
    },
    {
      key: "bill",
      header: "Bill",
      render: (item: any) => item.bill?.name ?? "-",
    },
    {
      key: "amountPaid",
      header: "Amount (₦)",
      render: (item: any) => item.amountPaid?.toLocaleString() ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => (
        <span className="text-green-600 font-medium capitalize">
          {item.status ?? "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's is an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          .
        </p>
      </div>

      {/* Stats – show counts (quantities) instead of amounts */}
      {/* <TransactionStatsBar
        primary={{
          label: "Total Transactions",
          value: totalTransactionsCount.toLocaleString(),
          // trend: "5.2% this month",
        }}
        stats={[
          { label: "Total Vends", value: totalVends.toLocaleString() },
          { label: "Total Bills", value: totalBillsCount.toLocaleString() },
          {
            label: "Pending Bills",
            value: pendingBillsCount.toLocaleString(),
          },
        ]}
      /> */}

      {/* Filter bar – Date range, Filter by Type, Filter by Status, Export (Figma) */}
      <Card className="p-4">
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search transactions by resident name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* Tabs: Transaction History | Estate Vends | Paid Bills */}
      <Card className="p-4">
        <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
          {[
            // { id: "history" as const, label: "Transaction History" },
            { id: "vends" as const, label: "Estate Vends" },
            { id: "paid-bills" as const, label: "Paid Bills" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <>
            {loading && transactions.length === 0 && (
              <div className="py-12">
                <Loader label="Loading transactions..." />
              </div>
            )}
            <Table
              columns={columns}
              data={transactions}
              emptyMessage={loading ? "Loading transactions..." : "No transactions found."}
              showPagination
              paginationInfo={{
                total: pagination?.total || transactions.length || 0,
                current: pagination?.currentPage || currentPage,
                pageSize: pagination?.pageSize || limit,
              }}
              onPageChange={handlePageChange}
              enableExport
              exportFileName="transactions"
              onExportRequest={
                estateId
                  ? async () => {
                      const res = await dispatch(
                        getEstateTransactionHistory({
                          estateId,
                          page: 1,
                          limit: 50000,
                        }),
                      ).unwrap();
                      return res?.data ?? [];
                    }
                  : undefined
              }
            />
            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </Button>
              <Button
                disabled={currentPage >= (pagination?.totalPages || 1)}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {activeTab === "vends" && (
          <>
            {loadingVends && vendsData.length === 0 && (
              <div className="py-12">
                <Loader label="Loading vends..." />
              </div>
            )}
            <Table
              columns={vendsColumns}
              data={vendsData}
              emptyMessage={loadingVends ? "Loading vends..." : "No vends found."}
              enableDateRangeFilter
              startDate={vendsStartDate}
              endDate={vendsEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setVendsStartDate(startDate);
                setVendsEndDate(endDate);
                setVendsPage(1);
              }}
              showPagination
              paginationInfo={{
                total: vendsPagination?.total ?? 0,
                current: vendsPagination?.page ?? vendsPage,
                pageSize: vendsPagination?.limit ?? limit,
              }}
              onPageChange={(p) => setVendsPage(p)}
              enableExport
              exportFileName="vends"
              onExportRequest={
                estateId
                  ? async () => {
                      const res = await dispatch(
                        getEstateVends({
                          estateId,
                          page: 1,
                          limit: 50000,
                          startDate:
                            vendsStartDate && vendsEndDate
                              ? vendsStartDate
                              : undefined,
                          endDate:
                            vendsStartDate && vendsEndDate
                              ? vendsEndDate
                              : undefined,
                        }),
                      ).unwrap();
                      return res?.data ?? [];
                    }
                  : undefined
              }
            />
            {/* <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                disabled={vendsPage === 1}
                onClick={() => setVendsPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                disabled={
                  (vendsPagination?.pages ?? 1) <= 1 ||
                  vendsPage >= (vendsPagination?.pages ?? 1)
                }
                onClick={() => setVendsPage((p) => p + 1)}
              >
                Next
              </Button>
            </div> */}
          </>
        )}

        {activeTab === "paid-bills" && (
          <>
            <TransactionsFilterBar
              frequency={filterFrequency}
              bill={filterBill}
              status={filterBillStatus}
              onFiltersChange={handlePaidBillsFiltersChange}
              frequencyOptions={paidBillsFrequencyOptions}
              billOptions={paidBillsBillOptions}
              visible={true}
            />
            <div className="mt-4">
              {loadingPaidBills && paginatedPaidBills.length === 0 && (
                <div className="py-12">
                  <Loader label="Loading paid bills..." />
                </div>
              )}
              <Table
                columns={paidBillsColumns}
                data={paginatedPaidBills}
                emptyMessage={paidBillsEmptyMessage}
                enableDateRangeFilter
                startDate={paidBillsStartDate}
                endDate={paidBillsEndDate}
                onDateRangeChange={({ startDate, endDate }) => {
                  setPaidBillsStartDate(startDate);
                  setPaidBillsEndDate(endDate);
                  setPaidBillsPage(1);
                }}
                showPagination
                paginationInfo={{
                  total: filteredPaidBills.length,
                  current: paidBillsPage,
                  pageSize: paidBillsPageSize,
                }}
                onPageChange={(p) => setPaidBillsPage(p)}
                enableExport
                exportFileName="paid-bills"
                onExportRequest={
                  filteredPaidBills.length > 0
                    ? async () => filteredPaidBills
                    : undefined
                }
              />
            </div>
            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                disabled={paidBillsPage === 1}
                onClick={() => setPaidBillsPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                disabled={
                  paidBillsTotalPages <= 1 ||
                  paidBillsPage >= paidBillsTotalPages
                }
                onClick={() => setPaidBillsPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
