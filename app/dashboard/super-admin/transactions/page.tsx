"use client";

import React, { useEffect, useState } from "react";
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
import { TransactionsSearchCard } from "./components/TransactionsSearchCard";
import { TransactionsTableCard } from "./components/TransactionsTableCard";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { formatDateTime } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/modal/page";
import { CheckCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

const PAGE_SIZE = 10;

function getResidentName(userId?: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  if (!userId) return "";
  const name = `${userId.firstName || ""} ${userId.lastName || ""}`.trim();
  return name || userId.email || "";
}

export default function SuperAdminTransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // ✅ Track grand total separately — never let it overwrite the list
  // const [grandTotalAmount, setGrandTotalAmount] = useState(0);
  // const grandTotalFetched = useRef(false);

  const { allTransactionHistory, loading } = useSelector((state: RootState) => {
    const s: any = state.superAdminTransaction;
    return {
      allTransactionHistory: s?.allTransactionHistory || {
        data: [],
        pagination: { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 },
      },
      loading: isPending(s?.getAllTransactionHistoryState),
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
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [txRefInput, setTxRefInput] = useState("");
  const [verifyingFromModal, setVerifyingFromModal] = useState(false);

  // ✅ Fetch grand total ONCE, separately, without touching the list state
  // useEffect(() => {
  //   if (grandTotalFetched.current) return;
  //   grandTotalFetched.current = true;

  //   dispatch(
  //     getAllTransactionHistory({
  //       page: 1,
  //       limit: 99999,
  //       type: "",
  //       search: "",
  //       forGrandTotal: true,
  //     }),
  //   )
  //     .unwrap()
  //     .then((res: any) => {
  //       // Sum up from the raw response so it never touches allTransactionHistory
  //       const rows: any[] = res?.data || [];
  //       const total = rows.reduce((acc: number, t: any) => acc + (t.amount ?? 0), 0);
  //       setGrandTotalAmount(total);
  //     })
  //     .catch(() => {
  //       // silently ignore — grand total is non-critical
  //     });
  // }, [dispatch]);

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
        const header = ["Date","Type","Amount","Status","User Details","Email","Estate","Description","Reference"];
        const csvRows = rows.map((item) => {
          const date = formatDateTime(item.createdAt, "");
          const name = getResidentName(item.userId);
          const values = [
            date, item.type || "", item.amount ?? "",
            item.paymentStatus || "", name,
            item.userId?.email || "",
            item.estateId?.name || "", item.description || "", item.tx_ref || "",
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
          const date = formatDateTime(item.createdAt, "");
          const name = getResidentName(item.userId);
          return `<tr>
            <td>${date}</td><td>${item.type || ""}</td><td>${item.amount ?? ""}</td>
            <td>${item.paymentStatus || ""}</td><td>${name}</td>
            <td>${item.userId?.email || ""}</td>
            <td>${item.estateId?.name || ""}</td><td>${item.description || ""}</td>
            <td>${item.tx_ref || ""}</td>
          </tr>`;
        }).join("");
        printWindow.document.write(`
          <html><head><title>Transactions Export</title>
          <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px;font-size:12px}th{background:#f5f5f5}</style>
          </head><body><h3>Transactions Export</h3>
          <table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th>
          <th>User Details</th><th>Email</th><th>Estate</th><th>Description</th><th>Reference</th></tr></thead>
          <tbody>${tableRows}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) => formatDateTime(item.createdAt, "-"),
    },
    {
      key: "user",
      header: "User Details",
      render: (item: any) => {
        const name = getResidentName(item.userId);
        return (
          <div>
            <div>{name || "-"}</div>
            <div className="text-muted-foreground text-sm">
              {item.userId?.email || "-"}
            </div>
          </div>
        );
      },
    },
    {
      key: "estate",
      header: "Estate",
      render: (item: any) => item.estateId?.name || "-",
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
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const handleVerifyFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const tx_ref = txRefInput.trim();
    if (!tx_ref) {
      toast.warning("Enter a Flutterwave transaction reference");
      return;
    }

    setVerifyingFromModal(true);
    try {
      await handleVerifyTransaction(tx_ref);
      setTxRefInput("");
      setVerifyModalOpen(false);
    } catch {
      // error already toasted
    } finally {
      setVerifyingFromModal(false);
    }
  };

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading transactions..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Overview of all transactions</p>
        </div>
        <Button
          type="button"
          onClick={() => setVerifyModalOpen(true)}
          className="flex items-center gap-2 shrink-0"
        >
          <CheckCircle className="w-4 h-4" />
          Verify Transaction
        </Button>
      </div>

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
        defaultDateRangeDays={0}
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

      <Modal
        visible={verifyModalOpen}
        onClose={() => {
          if (verifyingFromModal) return;
          setVerifyModalOpen(false);
          setTxRefInput("");
        }}
        contentClassName="md:w-[420px] max-w-[420px] p-4"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-2">
            <CardTitle className="text-lg font-semibold">
              Verify Transaction
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the Flutterwave transaction reference (tx_ref) to verify and
              optionally trigger payouts.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleVerifyFromModal} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="verify-tx-ref">Transaction reference</Label>
                <Input
                  id="verify-tx-ref"
                  value={txRefInput}
                  onChange={(e) => setTxRefInput(e.target.value)}
                  placeholder="e.g. FLW-..."
                  disabled={verifyingFromModal}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={verifyingFromModal}
                >
                  {verifyingFromModal ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Modal>
      </div>
    </div>
  );
}