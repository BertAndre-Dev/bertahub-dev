"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import { RootState, AppDispatch } from "@/redux/store";
import { getAllTransactionHistory } from "@/redux/slice/super-admin/super-admin-transactions-mgt/super-admin-transactions";
import { Search } from "lucide-react";

const PAGE_SIZE = 10;

export default function SuperAdminTransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [grandTotal, setGrandTotal] = useState(0);

// Fetch all data once just for the grand total
useEffect(() => {
  dispatch(getAllTransactionHistory({ page: 1, limit: 99999, type: "", search: "" }))
    .unwrap()
    .then((res: any) => {
      const allData = res?.data || [];
      const total = allData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      setGrandTotal(total);
    })
    .catch(() => {});
}, []); // ← empty array means this only runs once on mount

  const { allTransactionHistory, loading } = useSelector((state: RootState) => {
    const s: any = state.superAdminTransaction;
    return {
      allTransactionHistory: s?.allTransactionHistory || { data: [], pagination: { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 } },
      loading: s?.getAllTransactionHistoryState === "isLoading",
    };
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        await dispatch(
          getAllTransactionHistory({ page: currentPage, limit: PAGE_SIZE, type: typeFilter, search: searchQuery })
        ).unwrap();
      } catch (err) {
        // handled by slice / toasts elsewhere
      }
    };
    fetch();
  }, [dispatch, currentPage, typeFilter, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }; 

  const columns = [
    { key: "createdAt", header: "Date", render: (item: any) => new Date(item.createdAt).toLocaleDateString() },
    {
      key: "residentEstate",
      header: "Resident / Estate",
      render: (item: any) => (
        <div>
          <div>{item.user ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() : "-"}</div>
          <div className="text-muted-foreground text-sm">{item.estate?.name || "-"}</div>
        </div>
      ),
    },
 {
  key: "description",
  header: "Description",
  render: (item: any) => (
    <p className="max-w-[220px] break-words whitespace-normal">{item.description || "-"}</p>
  )
},
    { key: "type", header: "Type", render: (item: any) => item.type },
    {
      key: "amount",
      header: "Amount",
      render: (item: any) =>
        new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(item.amount || 0),
    },
    {
      key: "action",
      header: "Action",
      render: (item: any) => (
        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 cursor-pointer">
          View Details
        </button>
      ),
    } 
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="font-heading text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Overview of transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6 bg-white">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Transactions</p> 
            <p className="text-3xl font-bold">
  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(grandTotal)}
</p>
          </div>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by estate name, address, city etc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-3 items-center">
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          <span>📅</span> From
          <span>▼</span>
        </button>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          To
          <span>▼</span>
        </button>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          Filter by Type
          <span>▼</span>
        </button>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          Filter by Status
          <span>▼</span>
        </button>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          Filter by Estate
          <span>▼</span>
        </button>
        <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
          Export
        </button>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={allTransactionHistory?.data || []}
          showPagination
          enableSearch={false}
          paginationInfo={{
            total: allTransactionHistory?.pagination?.total || 0,
            current: Number(allTransactionHistory?.pagination?.page) || 1,
            pageSize: Number(allTransactionHistory?.pagination?.limit) || PAGE_SIZE,
          }}
          onPageChange={(page: number) => handlePageChange(page)}
        />
      </Card>
    </div>
  );
}
