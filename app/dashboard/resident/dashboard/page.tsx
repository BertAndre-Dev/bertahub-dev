"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TrendingUp,
  FileText,
  DollarSign,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import BillsOverview from "@/components/charts/bills-overview";
import TransactionsChart from "@/components/charts/transactions-chart";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import {
  getResidentDashboardBills,
  getResidentDashboardTransactions,
  getResidentDashboardVendHistory,
  type ResidentBillItem,
  type ResidentTransactionItem,
  type ResidentVendItem,
} from "@/redux/slice/resident/dashboard-analytics/resident-dashboard-analytics";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";

const formatNaira = (n: number) => `N${Number(n).toLocaleString()}`;
const BILLS_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ResidentDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);

  const residentDashboard = useSelector(
    (state: RootState) => (state as any).residentDashboardAnalytics
  );
  const residentMeter = useSelector((state: RootState) => (state as any).residentMeter);
  const meter = residentMeter?.meter ?? null;

  const bills = residentDashboard?.bills ?? [];
  const transactions = residentDashboard?.transactions ?? [];
  const vending = residentDashboard?.vending ?? [];
  const loading =
    residentDashboard?.billsStatus === "isLoading" ||
    residentDashboard?.transactionsStatus === "isLoading" ||
    residentDashboard?.vendingStatus === "isLoading";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data;
        if (!user) return;
        const uId = user.id ?? "";
        const rawAddressId = user.addressId;
        const aId =
          typeof rawAddressId === "string"
            ? rawAddressId
            : (rawAddressId as { id?: string })?.id ?? null;
        setUserId(uId);
        setAddressId(aId);
        if (aId) dispatch(getMeterByAddress({ addressId: aId }));
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;
    dispatch(getResidentDashboardBills({ residentId: userId })).catch((err: unknown) => {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to load bills.");
    });
    dispatch(getResidentDashboardTransactions({ userId })).catch((err: unknown) => {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to load transactions.");
    });
  }, [userId, dispatch]);

  useEffect(() => {
    const meterNumber = meter?.meterNumber;
    if (!meterNumber) return;
    dispatch(getResidentDashboardVendHistory({ meterNumber })).catch((err: unknown) => {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to load vending history.");
    });
  }, [meter?.meterNumber, dispatch]);

  const stats = useMemo(() => {
    const totalBills = bills.length;
    const paidBills = bills.filter(
      (b: ResidentBillItem) =>
        (b.status ?? "").toLowerCase() === "paid" || Number(b.amountPaid ?? 0) > 0
    ).length;
    const totalTx = transactions.length;
    const totalTxAmount = transactions.reduce(
      (sum: number, t: ResidentTransactionItem) => sum + Number(t.amount ?? 0),
      0
    );
    const totalVend = vending.length;
    const totalVendAmount = vending.reduce(
      (sum: number, v: ResidentVendItem) => sum + Number(v.amount ?? 0),
      0
    );
    return [
      {
        title: "My bills",
        value: String(totalBills),
        change: `${paidBills} paid`,
        icon: FileText,
        color: "bg-[#E6F4EA] text-[#007A4D]",
      },
      {
        title: "Transactions",
        value: String(totalTx),
        change: formatNaira(totalTxAmount),
        icon: DollarSign,
        color: "bg-[#D0DFF280] text-[#0150AC]",
      },
      {
        title: "Vending",
        value: String(totalVend),
        change: formatNaira(totalVendAmount),
        icon: Zap,
        color: "bg-[#FEE6D480] text-[#B45309]",
      },
      {
        title: "Trend",
        change: "This period",
        value: totalBills + totalTx + totalVend ? "Active" : "—",
        icon: TrendingUp,
        color: "bg-[#FFF4E5] text-[#FF8A00]",
      },
    ];
  }, [bills, transactions, vending]);

  const billsChartData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    bills.forEach((b: ResidentBillItem) => {
      const status = (b.status ?? "Other").toLowerCase();
      const key = status === "paid" ? "Paid" : status === "pending" ? "Pending" : "Other";
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    });
    if (Object.keys(byStatus).length === 0) return [];
    return [
      { name: "Paid", value: byStatus.Paid ?? 0, fill: "#10b981" },
      { name: "Pending", value: byStatus.Pending ?? 0, fill: "#f59e0b" },
      { name: "Other", value: byStatus.Other ?? 0, fill: "#6b7280" },
    ].filter((d) => d.value > 0);
  }, [bills]);

  const transactionTrendData = useMemo(() => {
    const byDate: Record<string, number> = {};
    transactions.forEach((t: ResidentTransactionItem) => {
      const date = (t.createdAt ?? "").slice(0, 10);
      if (!date) return;
      byDate[date] = (byDate[date] ?? 0) + Number(t.amount ?? 0);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value], i, arr) => ({
        label,
        value,
        highlighted: i === arr.length - 1,
      }));
  }, [transactions]);

  const vendingChartData = useMemo(() => {
    const byDate: Record<string, number> = {};
    vending.forEach((v: ResidentVendItem) => {
      const date = (v.createdAt ?? "").slice(0, 10);
      if (!date) return;
      byDate[date] = (byDate[date] ?? 0) + Number(v.amount ?? 0);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value], i, arr) => ({
        label,
        value,
        highlighted: i === arr.length - 1,
      }));
  }, [vending]);

  const [chartView, setChartView] = useState<"bills" | "transactions" | "vending">("bills");
  const estateOptions = useMemo(() => [{ label: "My data", value: "me" }], []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-[50px] p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <ArrowUpRight className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <p className="text-muted-foreground font-medium text-base mb-1 mt-2">{stat.title}</p>
              <p className="font-heading text-3xl font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="resident-chart-select" className="text-sm font-medium text-muted-foreground">
            Chart to display
          </label>
          <Select
            id="resident-chart-select"
            options={[
              { label: "Bills", value: "bills" },
              { label: "Transactions", value: "transactions" },
              { label: "Vending", value: "vending" },
            ]}
            value={chartView}
            onChange={(e) =>
              setChartView(e.target.value as "bills" | "transactions" | "vending")
            }
            className="w-full max-w-xs"
          />
        </div>
        <div className="min-h-[320px]">
          {chartView === "bills" && (
            <Card className="p-4">
              {loading && billsChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading bills...</p>
              ) : billsChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No bills data to display
                </p>
              ) : (
                <BillsOverview
                  title="My bills"
                  subtitle={`${bills.length} bill(s)`}
                  data={billsChartData}
                  onExport={() => {}}
                />
              )}
            </Card>
          )}
          {chartView === "transactions" && (
            <TransactionsChart
              title="Transaction history"
              subtitle={`${transactions.length} transaction(s)`}
              data={transactionTrendData}
              estateOptions={estateOptions}
              onExport={() => {}}
              className="w-full"
            />
          )}
          {chartView === "vending" && (
            <Card className="p-4">
              {!meter?.meterNumber ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Link your meter on the Meter page to see vending history here.
                </p>
              ) : loading && vendingChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Loading vending history...
                </p>
              ) : vendingChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No vending data to display
                </p>
              ) : (
                <TransactionsChart
                  title="Vending history"
                  subtitle={`${vending.length} vend(s)`}
                  data={vendingChartData}
                  estateOptions={estateOptions}
                  onExport={() => {}}
                  className="w-full"
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
