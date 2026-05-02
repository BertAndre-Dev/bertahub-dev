"use client";

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
import { type EstateTransactionsFilters } from "@/components/estate-admin/transactions-filter-bar";
import { TransactionsPageHeader } from "./components/TransactionsPageHeader";
import { TransactionsSearchCard } from "./components/TransactionsSearchCard";
import {
  TransactionsTabsCard,
  type TransactionsActiveTab,
} from "./components/TransactionsTabsCard";
import { HistoryTransactionsTab } from "./components/HistoryTransactionsTab";
import { VendsTab } from "./components/VendsTab";
import { PaidBillsTab } from "./components/PaidBillsTab";

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
  const [activeTab, setActiveTab] = useState<TransactionsActiveTab>("vends");
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

  // 🔹 Refetch transaction history when search or filters change (debounced for search).
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
      exportValue: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
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
      render: (item: any) => item.user?.email ?? "-",
      exportValue: (item: any) => String(item?.user?.email ?? ""),
    },
    {
      key: "tx_ref",
      header: "Transaction Reference",
      render: (item: any) => item.tx_ref ?? "-",
      exportValue: (item: any) => String(item?.tx_ref ?? ""),
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
      exportValue: (item: any) => (item.type === "credit" ? "Credit" : "Debit"),
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
      exportValue: (item: any) =>
        item.amount != null ? String(item.amount) : "",
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
      exportValue: (item: any) =>
        item.paymentStatus === "successful"
          ? "Successful"
          : String(item.paymentStatus || "Pending"),
    },
  ];


  const vendsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      exportValue: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
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
          <span
            className="inline-block max-w-[180px] truncate align-bottom"
            title={email}
          >
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
      exportValue: (item: any) =>
        item.amount != null ? String(item.amount) : "",
    },

    {
      key: "netEnergyPrice",
      header: "Price(₦/kWh)",
      render: (item: any) => {
        const e = item?.fullResponse?.energyList?.[0];

        const price = Number(e?.price);
        const taxRate = Number(e?.taxRate ?? e?.tax_rate);

        if (!Number.isFinite(price)) return "—";
        if (!Number.isFinite(taxRate)) return "—";

        const totalAmount = price * (1 + taxRate / 100);

        if (!Number.isFinite(totalAmount)) return "—";

        const roundToWhole = (value: number) =>
          Number.isFinite(value) ? Math.round(value) : "—";

        return roundToWhole(totalAmount);
      },
      exportValue: (item: any) => {
        const e = item?.fullResponse?.energyList?.[0];
        const price = Number(e?.price);
        const taxRate = Number(e?.taxRate ?? e?.tax_rate);

        // Keep exports machine-friendly (no commas) while still being resilient
        // to inconsistent API responses.
        if (!Number.isFinite(price)) return "";
        if (!Number.isFinite(taxRate)) return "";

        const totalAmount = price * (1 + taxRate / 100);

        if (!Number.isFinite(totalAmount)) return "";
        return String(Math.round(totalAmount));
      },
    },
    {
      key: "energyPrice",
      header: "Net Price(₦/kWh)",
      render: (item: any) => {
        const price = item?.fullResponse?.energyList?.[0]?.price;
        if (price == null || price === "") return "—";
        const n = Number(price);
        if (!Number.isFinite(n)) return "—";
        return n.toLocaleString();
      },
      exportValue: (item: any) => {
        const price = item?.fullResponse?.energyList?.[0]?.price;
        if (price == null || price === "") return "";
        const n = Number(price);
        if (!Number.isFinite(n)) return "";
        // clean export value (rounded, no commas)
        return String(Math.round(n));
      },
    },
    {
      key: "energyValue",
      header: "Value",
      render: (item: any) => {
        const value = item?.fullResponse?.energyList?.[0]?.value ?? null;
        if (value == null || value === "") return "—";
        const vNum = Number(value);
        return Number(vNum) ? String(vNum) : String(value);
      },
      exportValue: (item: any) => {
        const value = item?.fullResponse?.energyList?.[0]?.value ?? "";
        return value == null ? "" : String(value);
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
        return Number(n) ? String(n) : String(rate);
      },
      exportValue: (item: any) => {
        const rate =
          item?.fullResponse?.energyList?.[0]?.taxRate ??
          item?.fullResponse?.energyList?.[0]?.tax_rate ??
          "";
        return rate == null ? "" : String(rate);
      },
    },
  ];

  const paidBillsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      exportValue: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
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
      render: (item: any) => item.user?.email ?? "-",
      exportValue: (item: any) => String(item?.user?.email ?? ""),
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: any) => item.frequency ?? "-",
      exportValue: (item: any) => String(item.frequency ?? ""),
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: any) => item.startDate ?? "-",
      exportValue: (item: any) => String(item.startDate ?? ""),
    },
    {
      key: "nextDueDate",
      header: "Next Due Date",
      render: (item: any) => item.nextDueDate ?? "-",
      exportValue: (item: any) => String(item.nextDueDate ?? ""),
    },
    {
      key: "bill",
      header: "Bill",
      render: (item: any) => item.bill?.name ?? "-",
      exportValue: (item: any) =>
        String(item.bill?.name ?? item.billName ?? ""),
    },
    {
      key: "amountPaid",
      header: "Amount (₦)",
      render: (item: any) => item.amountPaid?.toLocaleString() ?? 0,
      exportValue: (item: any) =>
        item.amountPaid != null ? String(item.amountPaid) : "",
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => (
        <span className="text-green-600 font-medium capitalize">
          {item.status ?? "-"}
        </span>
      ),
      exportValue: (item: any) => String(item.status ?? ""),
    },
  ];

  return (
    <div className="space-y-6">
      <TransactionsPageHeader estateName={estateName} />
      <TransactionsSearchCard search={search} onSearchChange={setSearch} />
      <TransactionsTabsCard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        history={
          <HistoryTransactionsTab
            columns={columns}
            data={transactions}
            emptyMessage={
              loading ? "Loading transactions..." : "No transactions found."
            }
            showPagination
            paginationInfo={{
              total: pagination?.total || transactions.length || 0,
              current: pagination?.currentPage || currentPage,
              pageSize: pagination?.pageSize || limit,
            }}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
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
        }
        vends={
          <VendsTab
            columns={vendsColumns}
            data={vendsData}
            emptyMessage={loadingVends ? "Loading vends..." : "No vends found."}
            startDate={vendsStartDate}
            endDate={vendsEndDate}
            onDateRangeChange={({
              startDate,
              endDate,
            }: {
              startDate: string;
              endDate: string;
            }) => {
              setVendsStartDate(startDate);
              setVendsEndDate(endDate);
              setVendsPage(1);
            }}
            paginationInfo={{
              total: vendsPagination?.total ?? 0,
              current: vendsPagination?.page ?? vendsPage,
              pageSize: vendsPagination?.limit ?? limit,
            }}
            onPageChange={(p: number) => setVendsPage(p)}
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
        }
        paidBills={
          <PaidBillsTab
            frequency={filterFrequency}
            bill={filterBill}
            status={filterBillStatus}
            onFiltersChange={handlePaidBillsFiltersChange}
            frequencyOptions={paidBillsFrequencyOptions}
            billOptions={paidBillsBillOptions}
            data={paginatedPaidBills}
            columns={paidBillsColumns}
            emptyMessage={paidBillsEmptyMessage}
            startDate={paidBillsStartDate}
            endDate={paidBillsEndDate}
            onDateRangeChange={({
              startDate,
              endDate,
            }: {
              startDate: string;
              endDate: string;
            }) => {
              setPaidBillsStartDate(startDate);
              setPaidBillsEndDate(endDate);
              setPaidBillsPage(1);
            }}
            paginationInfo={{
              total: filteredPaidBills.length,
              current: paidBillsPage,
              pageSize: paidBillsPageSize,
            }}
            onPageChange={(p: number) => setPaidBillsPage(p)}
            currentPage={paidBillsPage}
            totalPages={paidBillsTotalPages}
            onPrev={() => setPaidBillsPage((p) => p - 1)}
            onNext={() => setPaidBillsPage((p) => p + 1)}
            onExportRequest={
              filteredPaidBills.length > 0
                ? async () => filteredPaidBills
                : undefined
            }
          />
        }
      />
    </div>
  );
}
