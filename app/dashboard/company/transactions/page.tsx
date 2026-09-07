"use client";

import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  verifyCompanyTransaction,
  getCompanyTransactionHistory,
  getCompanyPaidBills,
} from "@/redux/slice/company/transaction/company-transaction";
import {
  selectCompanyTransactions,
  selectCompanyTransactionsLoading,
  selectCompanyTransactionsPagination,
} from "@/redux/slice/company/transaction/company-transaction-slice";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Select from "react-select";
import { Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { type EstateTransactionsFilters } from "@/components/estate-admin/transactions-filter-bar";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  TransactionsTabsCard,
  type TransactionsActiveTab,
} from "@/app/dashboard/estate-admin/transactions/components/TransactionsTabsCard";
import { HistoryTransactionsTab } from "@/app/dashboard/estate-admin/transactions/components/HistoryTransactionsTab";
import { PaidBillsTab } from "@/app/dashboard/estate-admin/transactions/components/PaidBillsTab";
import { formatDateTime } from "@/lib/format-date";

interface EstateOption {
  label: string;
  value: string;
}

export default function CompanyTransactionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Company");
  const [email, setEmail] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<TransactionsActiveTab>("history");
  const [paidBillsData, setPaidBillsData] = useState<any[]>([]);
  const [paidBillsPage, setPaidBillsPage] = useState(1);
  const [loadingPaidBills, setLoadingPaidBills] = useState(false);
  const [paidBillsStartDate, setPaidBillsStartDate] = useState<string>("");
  const [paidBillsEndDate, setPaidBillsEndDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null);
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [filterFrequency, setFilterFrequency] = useState<string>("");
  const [filterBill, setFilterBill] = useState<string>("");
  const [filterBillStatus, setFilterBillStatus] = useState<string>("");

  const transactions = useSelector(selectCompanyTransactions);
  const pagination = useSelector(selectCompanyTransactionsPagination);
  const loading = useSelector(selectCompanyTransactionsLoading);

  const selectedEstateId = selectedEstate?.value;

  const buildHistoryParams = useCallback(
    (page: number) => ({
      estateId: selectedEstateId!,
      companyId: companyId ?? undefined,
      page,
      limit,
      search: search.trim() || undefined,
    }),
    [companyId, selectedEstateId, limit, search],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ??
          userRes) as Record<string, unknown> | null;
        if (!data) {
          toast.warning("No user found.");
          return;
        }

        const id = (data.id as string) || (data._id as string) || null;
        const userEmail = (data.email as string) || "";
        const company = parseCompanyFromUser(data);

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");

        if (!company?.id) {
          toast.error("No company ID found for this user.");
          return;
        }

        setCompanyId(company.id);
        setCompanyName(company.name);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption => Boolean(x)) ??
          [];
        setEstateOptions(options);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setEstateOptions([]);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!companyId || !selectedEstateId) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      dispatch(getCompanyTransactionHistory(buildHistoryParams(1)));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, companyId, selectedEstateId, dispatch, buildHistoryParams]);

  useEffect(() => {
    setPaidBillsPage(1);
  }, [selectedEstateId]);

  const PAID_BILLS_FETCH_LIMIT = 10;
  useEffect(() => {
    if (activeTab !== "paid-bills" || !selectedEstateId) return;
    (async () => {
      setLoadingPaidBills(true);
      try {
        const res = await dispatch(
          getCompanyPaidBills({
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
    if (!companyId || !selectedEstateId) return;
    setCurrentPage(newPage);
    await dispatch(getCompanyTransactionHistory(buildHistoryParams(newPage)));
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get("tx_ref") || urlParams.get("trx_ref");

    if (!tx_ref) return;

    const verifyTransactionAsync = async () => {
      try {
        let currentUserId = userId;
        let currentCompanyId = companyId;

        if (!currentUserId || !currentCompanyId) {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          const data = userRes?.data ?? userRes;
          currentUserId = data?.id;
          const company = parseCompanyFromUser(
            (data ?? {}) as Record<string, unknown>,
          );
          currentCompanyId = company?.id ?? null;
          setUserId(currentUserId);
          setEmail(data?.email || "");
          setCompanyId(currentCompanyId);
        }

        if (!currentUserId) throw new Error("User not found for verification");
        if (!currentCompanyId)
          throw new Error("Company not found for verification");

        await dispatch(verifyCompanyTransaction({ tx_ref })).unwrap();

        toast.success("Withdrawal successful!");

        await dispatch(
          getCompanyTransactionHistory(
            buildHistoryParams(currentPage),
          ),
        );

        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    };

    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
  }, [dispatch, userId, email, companyId, currentPage, buildHistoryParams]);

  const getTxnUser = (item: any) => item?.userId ?? item?.user;

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        formatDateTime(item.createdAt, "-"),
      exportValue: (item: any) =>
        formatDateTime(item.createdAt, ""),
    },
    {
      key: "user",
      header: "Resident",
      render: (item: any) => {
        const u = getTxnUser(item);
        if (!u || typeof u !== "object") return "-";
        return (
          [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "-"
        );
      },
      exportValue: (item: any) => {
        const u = getTxnUser(item);
        if (!u || typeof u !== "object") return "";
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
        return name || u.email || "";
      },
    },
    {
      key: "email",
      header: "Email",
      render: (item: any) => getTxnUser(item)?.email ?? "-",
      exportValue: (item: any) => String(getTxnUser(item)?.email ?? ""),
    },
    {
      key: "estate",
      header: "Estate",
      render: (item: any) =>
        item.estateId?.name ?? item.estate?.name ?? selectedEstate?.label ?? "-",
      exportValue: (item: any) =>
        String(
          item.estateId?.name ??
            item.estate?.name ??
            selectedEstate?.label ??
            "",
        ),
    },
    {
      key: "description",
      header: "Description",
      render: (item: any) => item.description ?? "-",
      exportValue: (item: any) => String(item?.description ?? ""),
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
      render: (item: any) => {
        const status = (item.paymentStatus ?? "").toString().toLowerCase();
        const isPaid =
          status === "paid" || status === "successful" || status === "success";
        const isFailed =
          status === "failed" ||
          status === "fail" ||
          status === "unsuccessful" ||
          status === "cancelled" ||
          status === "canceled";
        if (isPaid) {
          return (
            <span className="text-green-600 font-medium capitalize">
              {item.paymentStatus || "Paid"}
            </span>
          );
        }
        if (isFailed) {
          return (
            <span className="text-red-600 font-medium capitalize">
              {item.paymentStatus}
            </span>
          );
        }
        return (
          <span className="text-yellow-600 font-medium capitalize">
            {item.paymentStatus || "Pending"}
          </span>
        );
      },
      exportValue: (item: any) => String(item.paymentStatus ?? "Pending"),
    },
  ];

  const paidBillsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        formatDateTime(item.createdAt, "-"),
      exportValue: (item: any) =>
        formatDateTime(item.createdAt, ""),
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View transactions for{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {companyName}
            </span>
            .
          </p>
        </div>

        <div className="w-48 min-w-[12rem]">
          <Select
            options={estateOptions}
            placeholder="Filter by estate"
            value={selectedEstate}
            onChange={(option) => setSelectedEstate(option)}
            isSearchable
            isDisabled={!estateOptions.length || estatesLoading}
            styles={{
              control: (base) => ({ ...base, cursor: "pointer" }),
              option: (base) => ({ ...base, cursor: "pointer" }),
              dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
              clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
            }}
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name or email"
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <TransactionsTabsCard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "history" as const, label: "Estate Transactions" },
          { id: "paid-bills" as const, label: "Paid Bills" },
        ]}
        history={
          <HistoryTransactionsTab
            columns={columns}
            data={transactions}
            emptyMessage={
              !estateOptions.length
                ? "Create an estate first to view transactions"
                : loading
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
                      getCompanyTransactionHistory({
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
