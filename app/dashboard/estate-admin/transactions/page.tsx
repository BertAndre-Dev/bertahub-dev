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
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";

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
  const [email, setEmail] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<"history" | "vends" | "paid-bills">("history");
  const [vendsData, setVendsData] = useState<any[]>([]);
  const [vendsPagination, setVendsPagination] = useState<{ total: number; page: number; limit: number; pages: number } | null>(null);
  const [vendsPage, setVendsPage] = useState(1);
  const [loadingVends, setLoadingVends] = useState(false);
  const [paidBillsData, setPaidBillsData] = useState<any[]>([]);
  const [paidBillsPagination, setPaidBillsPagination] = useState<{ total: number; page: number; limit: number; pages: number } | null>(null);
  const [paidBillsPage, setPaidBillsPage] = useState(1);
  const [loadingPaidBills, setLoadingPaidBills] = useState(false);
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
        const id = userRes?.data?.id;
        const userEmail = userRes?.data?.email;
        const estateIdFromUser =
          userRes?.data?.estateId || userRes?.data?.estate?.id;

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
          }),
        );
      } catch (err) {
        toast.error("Failed to load data.");
      }
    })();
  }, [dispatch, limit]);

  // 🔹 Fetch vends when tab is vends
  useEffect(() => {
    if (activeTab !== "vends" || !estateId) return;
    (async () => {
      setLoadingVends(true);
      try {
        const res = await dispatch(
          getEstateVends({ estateId, page: vendsPage, limit }),
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
  }, [activeTab, estateId, vendsPage, dispatch]);

  // 🔹 Fetch paid bills when tab is paid-bills
  useEffect(() => {
    if (activeTab !== "paid-bills" || !estateId) return;
    (async () => {
      setLoadingPaidBills(true);
      try {
        const res = await dispatch(
          getEstatePaidBills({ estateId, page: paidBillsPage, limit }),
        ).unwrap();
        setPaidBillsData(res?.data ?? []);
        setPaidBillsPagination(res?.pagination ?? null);
      } catch {
        setPaidBillsData([]);
        setPaidBillsPagination(null);
      } finally {
        setLoadingPaidBills(false);
      }
    })();
  }, [activeTab, estateId, paidBillsPage, dispatch]);

  // 🔹 Pagination Handler
  const handlePageChange = async (newPage: number) => {
    if (!estateId) return;
    setCurrentPage(newPage);
    await dispatch(
      getEstateTransactionHistory({ estateId, page: newPage, limit }),
    );
  };

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
      key: "meterNumber",
      header: "Meter",
      render: (item: any) => item.meterNumber ?? "-",
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
    },
    {
      key: "user",
      header: "User",
      render: (item: any) =>
        item.user
          ? [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email
          : "-",
    },
    {
      key: "transId",
      header: "Trans ID",
      render: (item: any) => item.transId ?? "-",
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
      key: "user",
      header: "Resident",
      render: (item: any) =>
        item.user
          ? [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email
          : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => (
        <span className="text-green-600 font-medium capitalize">{item.status ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs: Transaction History | Estate Vends | Paid Bills */}
      <Card className="p-4">
        <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
          {[
            { id: "history" as const, label: "Transaction History" },
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
            <Table
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
            <Table
              columns={vendsColumns}
              data={vendsData}
              emptyMessage={
                loadingVends ? "Loading vends..." : "No vends found."
              }
              showPagination
              paginationInfo={{
                total: vendsPagination?.total ?? 0,
                current: vendsPagination?.page ?? vendsPage,
                pageSize: vendsPagination?.limit ?? limit,
              }}
              onPageChange={(p) => setVendsPage(p)}
            />
            <div className="flex justify-end items-center gap-2 mt-4">
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
            </div>
          </>
        )}

        {activeTab === "paid-bills" && (
          <>
            <Table
              columns={paidBillsColumns}
              data={paidBillsData}
              emptyMessage={
                loadingPaidBills ? "Loading paid bills..." : "No paid bills found."
              }
              showPagination
              paginationInfo={{
                total: paidBillsPagination?.total ?? 0,
                current: paidBillsPagination?.page ?? paidBillsPage,
                pageSize: paidBillsPagination?.limit ?? limit,
              }}
              onPageChange={(p) => setPaidBillsPage(p)}
            />
            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                disabled={paidBillsPage === 1}
                onClick={() => setPaidBillsPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                disabled={
                  (paidBillsPagination?.pages ?? 1) <= 1 ||
                  paidBillsPage >= (paidBillsPagination?.pages ?? 1)
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
