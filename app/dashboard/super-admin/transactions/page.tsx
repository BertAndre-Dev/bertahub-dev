"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  getAllTransactionHistory,
  getTransactionById,
  verifyTransaction,
} from "@/redux/slice/super-admin/super-admin-transactions-mgt/super-admin-transactions";
import { toast } from "react-toastify";
import { TransactionDetailsDialog } from "@/components/super-admin/transaction-modal/page";
import { TransactionsFilterBar } from "@/components/super-admin/transactions-filter-bar";
import { TotalTransactionsCard } from "./components/TotalTransactionsCard";
import { TransactionsSearchCard } from "./components/TransactionsSearchCard";
import { TransactionsTableCard } from "./components/TransactionsTableCard";
import Loader from "@/components/ui/Loader";

const PAGE_SIZE = 10;

export default function SuperAdminTransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // ✅ Track grand total separately — never let it overwrite the list
  const [grandTotalAmount, setGrandTotalAmount] = useState(0);
  const grandTotalFetched = useRef(false);

  const { allTransactionHistory, loading } = useSelector((state: RootState) => {
    const s: any = state.superAdminTransaction;
    return {
      allTransactionHistory: s?.allTransactionHistory || {
        data: [],
        pagination: { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 },
      },
      loading: s?.getAllTransactionHistoryState === "isLoading",
    };
  });

  const { selectedTransaction, getTransactionState, verifyTransactionState } =
    useSelector((state: RootState) => {
      const s: any = state.superAdminTransaction;
      return {
        selectedTransaction: s?.selectedTransaction || null,
        getTransactionState: s?.getTransactionState === "isLoading",
        verifyTransactionState: s?.verifyTransactionState === "isLoading",
      };
    });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ✅ Fetch grand total ONCE, separately, without touching the list state
  useEffect(() => {
    if (grandTotalFetched.current) return;
    grandTotalFetched.current = true;

    dispatch(
      getAllTransactionHistory({
        page: 1,
        limit: 99999,
        type: "",
        search: "",
        forGrandTotal: true,
      }),
    )
      .unwrap()
      .then((res: any) => {
        // Sum up from the raw response so it never touches allTransactionHistory
        const rows: any[] = res?.data || [];
        const total = rows.reduce((acc: number, t: any) => acc + (t.amount ?? 0), 0);
        setGrandTotalAmount(total);
      })
      .catch(() => {
        // silently ignore — grand total is non-critical
      });
  }, [dispatch]);

  // ✅ Fixed: ALL filter deps included so every filter change triggers a re-fetch
  useEffect(() => {
    const fetch = async () => {
      try {
        await dispatch(
          getAllTransactionHistory({
            page: currentPage,
            limit: PAGE_SIZE,
            type: typeFilter,
            search: searchQuery,
            startDate: fromDate || "",
            endDate: toDate || "",
          }),
        ).unwrap();
      } catch (err) {
        // handled by slice / toasts elsewhere
      }
    };
    fetch();
  }, [dispatch, currentPage, typeFilter, searchQuery, fromDate, toDate]); // ✅ all deps

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleFiltersChange = (filters: {
    fromDate: string | null;
    toDate: string | null;
    estate: string;
    type: string;
  }) => {
    setFromDate(filters.fromDate);
    setToDate(filters.toDate);
    setTypeFilter(filters.type);
    setCurrentPage(1); // ✅ reset to page 1 on filter change
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const response: any = await dispatch(
        getAllTransactionHistory({
          page: 1,
          limit: 99999,
          type: typeFilter,
          search: searchQuery,
          startDate: fromDate || "",
          endDate: toDate || "",
          forExport: true,
        }),
      ).unwrap();

      const rows = (response?.data || []) as any[];
      if (!rows.length) {
        toast.info("No transactions found for the selected filters.");
        return;
      }

      if (format === "csv") {
        const header = ["Date","Type","Amount","Status","Resident Name","Estate","Description","Reference"];
        const csvRows = rows.map((item) => {
          const date = new Date(item.createdAt).toISOString();
          const name = item.user
            ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
            : "";
          const values = [
            date, item.type || "", item.amount ?? "",
            item.paymentStatus || "", name,
            item.estate?.name || "", item.description || "", item.tx_ref || "",
          ];
          return values
            .map((v) => {
              const str = String(v ?? "");
              return str.includes(",") || str.includes('"') || str.includes("\n")
                ? `"${str.replace(/"/g, '""')}"` : str;
            })
            .join(",");
        });
        const csvContent = [header.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `transactions_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        const tableRows = rows.map((item) => {
          const date = new Date(item.createdAt).toLocaleString();
          const name = item.user
            ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() : "";
          return `<tr>
            <td>${date}</td><td>${item.type || ""}</td><td>${item.amount ?? ""}</td>
            <td>${item.paymentStatus || ""}</td><td>${name}</td>
            <td>${item.estate?.name || ""}</td><td>${item.description || ""}</td>
            <td>${item.tx_ref || ""}</td>
          </tr>`;
        }).join("");
        printWindow.document.write(`
          <html><head><title>Transactions Export</title>
          <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px;font-size:12px}th{background:#f5f5f5}</style>
          </head><body><h3>Transactions Export</h3>
          <table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th>
          <th>Resident Name</th><th>Estate</th><th>Description</th><th>Reference</th></tr></thead>
          <tbody>${tableRows}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch {
      toast.error("Failed to export transactions.");
    }
  };

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) => new Date(item.createdAt).toLocaleString(),
    },
    {
      key: "residentEstate",
      header: "Resident / Estate",
      render: (item: any) => (
        <div>
          <div>
            {item.user?.firstName || item.user?.lastName
              ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
              : "-"}
          </div>
          <div className="text-muted-foreground text-sm">
            {item.user?.email || "-"}
          </div>
          <div className="text-muted-foreground text-sm">
            {item.estate?.name || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (item: any) => (
        <p className="max-w-[220px] break-words whitespace-normal">
          {item.description || "-"}
        </p>
      ),
    },
    { key: "type", header: "Type", render: (item: any) => item.type },
    {
      key: "amount",
      header: "Amount",
      render: (item: any) =>
        new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
          item.amount || 0,
        ),
    },
    {
      key: "action",
      header: "Action",
      render: (item: any) => (
        <button
          onClick={() => handleViewDetails(item._id || item.id)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 cursor-pointer"
        >
          View Details
        </button>
      ),
    },
  ];

  const handleViewDetails = async (transactionId?: string) => {
    if (!transactionId) return;
    try {
      await dispatch(getTransactionById(transactionId)).unwrap();
      setIsDialogOpen(true);
    } catch (err) {
      // handled by slice
    }
  };

  const handleVerifyTransaction = async (tx_ref: string) => {
    if (!tx_ref) return;
    try {
      await dispatch(verifyTransaction(tx_ref)).unwrap();
      toast.success("Transaction verified successfully.");
      const id = selectedTransaction?._id || selectedTransaction?.id;
      if (id) await dispatch(getTransactionById(id)).unwrap();
      await dispatch(
        getAllTransactionHistory({
          page: currentPage,
          limit: PAGE_SIZE,
          type: typeFilter,
          search: searchQuery,
          startDate: fromDate || "",
          endDate: toDate || "",
        }),
      ).unwrap();
    } catch (err: any) {
      toast.error(
        (err?.payload as { message?: string })?.message ??
          err?.message ??
          "Failed to verify transaction",
      );
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading transactions..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          loading ? "blur-sm opacity-60 pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <div className="flex flex-col">
        <h1 className="font-heading text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Overview of transactions</p>
      </div>

      {/* ✅ Uses local grandTotalAmount state, not Redux — no overwrite risk */}
      <TotalTransactionsCard grandTotal={grandTotalAmount} />

      <TransactionsSearchCard
        placeholder="Search by name, email, estate, description, reference or amount..."
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onCommitSearch={() => {
          setSearchQuery(searchInput);
          setCurrentPage(1);
        }}
        onClearSearch={() => {
          setSearchInput("");
          setSearchQuery("");
          setCurrentPage(1);
        }}
      />

      <TransactionsFilterBar
        fromDate={fromDate}
        toDate={toDate}
        estate=""
        type={typeFilter}
        onFiltersChange={handleFiltersChange}
        onExport={(format) => handleExport(format)}
        showTypeFilter={false}
        showSearchInput={false}
      />

      <TransactionsTableCard
        columns={columns}
        data={allTransactionHistory?.data || []}
        total={allTransactionHistory?.pagination?.total || 0}
        current={Number(allTransactionHistory?.pagination?.page) || 1}
        pageSize={Number(allTransactionHistory?.pagination?.limit) || PAGE_SIZE}
        onPageChange={(page) => handlePageChange(page)}
      />

      <TransactionDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
        loading={getTransactionState}
        onVerify={handleVerifyTransaction}
        verifyLoading={verifyTransactionState}
      />
      </div>
    </div>
  );
}