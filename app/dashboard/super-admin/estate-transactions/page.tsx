"use client";

import {
  getSuperAdminEstateTransactionHistory,
  getSuperAdminEstateVends,
  getSuperAdminEstatePaidBills,
} from "@/redux/slice/super-admin/super-admin-estate-transactions/super-admin-estate-transactions";
import {
  selectSuperAdminEstateTransactions,
  selectSuperAdminEstateTransactionsPagination,
} from "@/redux/slice/super-admin/super-admin-estate-transactions/super-admin-estate-transactions-slice";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Select from "react-select";
import { type EstateTransactionsFilters } from "@/components/estate-admin/transactions-filter-bar";
import { TransactionsSearchCard } from "@/app/dashboard/estate-admin/transactions/components/TransactionsSearchCard";
import {
  TransactionsTabsCard,
  type TransactionsActiveTab,
} from "@/app/dashboard/estate-admin/transactions/components/TransactionsTabsCard";
import { HistoryTransactionsTab } from "@/app/dashboard/estate-admin/transactions/components/HistoryTransactionsTab";
import { VendsTab } from "@/app/dashboard/estate-admin/transactions/components/VendsTab";
import { PaidBillsTab } from "@/app/dashboard/estate-admin/transactions/components/PaidBillsTab";
import { formatDateTime } from "@/lib/format-date";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";

const ESTATE_FILTER_FETCH_LIMIT = 500;

interface EstateOption {
  label: string;
  value: string;
}

export default function SuperAdminEstateTransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
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
  const [loadingVends, setLoadingVends] = useState(true);
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
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null);

  const transactions = useSelector(selectSuperAdminEstateTransactions);
  const pagination = useSelector(selectSuperAdminEstateTransactionsPagination);
  const historyStatus = useSelector(
    (state: RootState) =>
      state.superAdminEstateTransactions.getTransactionHistoryState,
  );

  const { allEstates, estatesStatus } = useSelector((state: RootState) => {
    const estateState = state.estate;
    const data = estateState.allEstates?.data || [];
    return {
      allEstates: Array.isArray(data) ? data : [],
      estatesStatus: estateState.getAllEstatesState as string,
    };
  });

  const estateOptions: EstateOption[] = useMemo(
    () =>
      allEstates
        .map((e: { id?: string; _id?: string; name?: string }) => {
          const value = String(e?._id || e?.id || "").trim();
          if (!value) return null;
          return { label: e?.name ?? "Unnamed estate", value };
        })
        .filter((x): x is EstateOption => Boolean(x)),
    [allEstates],
  );

  const selectedEstateId = selectedEstate?.value;
  const estateName = selectedEstate?.label ?? "Estate";

  const buildHistoryParams = useCallback(
    (page: number) => ({
      estateId: selectedEstateId!,
      page,
      limit,
      search: search.trim() || undefined,
      type: filterType || undefined,
      paymentStatus: filterStatus || undefined,
    }),
    [selectedEstateId, limit, search, filterType, filterStatus],
  );

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: ESTATE_FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!selectedEstateId) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      dispatch(getSuperAdminEstateTransactionHistory(buildHistoryParams(1)));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus, selectedEstateId, dispatch, buildHistoryParams]);

  useEffect(() => {
    setVendsPage(1);
    setPaidBillsPage(1);
  }, [selectedEstateId]);

  useEffect(() => {
    if (activeTab !== "vends" || !selectedEstateId) return;
    (async () => {
      setLoadingVends(true);
      try {
        const shouldApplyDateFilter = Boolean(vendsStartDate && vendsEndDate);
        const res = await dispatch(
          getSuperAdminEstateVends({
            estateId: selectedEstateId,
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
    selectedEstateId,
    vendsPage,
    dispatch,
    limit,
    vendsStartDate,
    vendsEndDate,
  ]);

  const PAID_BILLS_FETCH_LIMIT = 10;
  useEffect(() => {
    if (activeTab !== "paid-bills" || !selectedEstateId) return;
    (async () => {
      setLoadingPaidBills(true);
      try {
        const res = await dispatch(
          getSuperAdminEstatePaidBills({
            estateId: selectedEstateId,
            page: 1,
            limit: PAID_BILLS_FETCH_LIMIT,
            startDate: paidBillsStartDate || undefined,
            endDate: paidBillsEndDate || undefined,
          }),
        ).unwrap();
        setPaidBillsData(res?.data ?? []);
      } catch {
        setPaidBillsData([]);
      } finally {
        setLoadingPaidBills(false);
      }
    })();
  }, [activeTab, selectedEstateId, dispatch, paidBillsStartDate, paidBillsEndDate]);

  const handlePageChange = async (newPage: number) => {
    if (!selectedEstateId) return;
    setCurrentPage(newPage);
    await dispatch(getSuperAdminEstateTransactionHistory(buildHistoryParams(newPage)));
  };

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

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) => formatDateTime(item.createdAt, "-"),
      exportValue: (item: any) => formatDateTime(item.createdAt, ""),
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
      render: (item: any) => formatDateTime(item.createdAt, "-"),
      exportValue: (item: any) => formatDateTime(item.createdAt, ""),
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
        return Number.isFinite(totalAmount) ? Math.round(totalAmount) : "—";
      },
      exportValue: (item: any) => {
        const e = item?.fullResponse?.energyList?.[0];
        const price = Number(e?.price);
        const taxRate = Number(e?.taxRate ?? e?.tax_rate);
        if (!Number.isFinite(price) || !Number.isFinite(taxRate)) return "";
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
      render: (item: any) => formatDateTime(item.createdAt, "-"),
      exportValue: (item: any) => formatDateTime(item.createdAt, ""),
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

  const pageLoading =
    (isPending(estatesStatus) && estateOptions.length === 0) ||
    (Boolean(selectedEstateId) &&
      ((activeTab === "history" && isPending(historyStatus)) ||
        (activeTab === "vends" && loadingVends) ||
        (activeTab === "paid-bills" &&
          loadingPaidBills &&
          paidBillsData.length === 0)));

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading transactions..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Estate Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View transactions for{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>

        <div className="w-full md:w-64 min-w-[12rem]">
          <Select
            options={estateOptions}
            placeholder="Filter by estate"
            value={selectedEstate}
            onChange={(option) => setSelectedEstate(option)}
            isSearchable
            isDisabled={!estateOptions.length || isPending(estatesStatus)}
            styles={{
              control: (base) => ({ ...base, cursor: "pointer" }),
              option: (base) => ({ ...base, cursor: "pointer" }),
              dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
              clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
            }}
          />
        </div>
      </div>

      <TransactionsSearchCard search={search} onSearchChange={setSearch} />
      <TransactionsTabsCard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        history={
          <HistoryTransactionsTab
            columns={columns}
            data={transactions}
            emptyMessage={
              !estateOptions.length
                ? "No estates available."
                : isPending(historyStatus)
                  ? "Loading transactions..."
                  : "No transactions found."
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
              selectedEstateId
                ? async () => {
                    const res = await dispatch(
                      getSuperAdminEstateTransactionHistory({
                        ...buildHistoryParams(1),
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
            emptyMessage={
              !estateOptions.length
                ? "No estates available."
                : loadingVends
                  ? "Loading vends..."
                  : "No vends found."
            }
            defaultDateRangeDays={0}
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
              selectedEstateId
                ? async () => {
                    const res = await dispatch(
                      getSuperAdminEstateVends({
                        estateId: selectedEstateId,
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
            defaultDateRangeDays={0}
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
    </div>
  );
}
