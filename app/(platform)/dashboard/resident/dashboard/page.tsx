"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TrendingUp,
  FileText,
  DollarSign,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import BillsOverview from "@/components/charts/bills-overview";
import TransactionsChart from "@/components/charts/transactions-chart";
import SwitchAddress from "@/components/resident/switch-address/page";
import { normalizeAddresses, type AddressOption } from "@/lib/address";
import { parseResidentEstate } from "@/app/(platform)/dashboard/resident/asset/lib/estate";
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
import { getApiErrorMessage } from "@/lib/api-error";

const formatNaira = (n: number) => `N${Number(n).toLocaleString()}`;

export default function ResidentDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const residentDashboard = useSelector(
    (state: RootState) => state.residentDashboardAnalytics,
  );
  const residentMeterState = useSelector(
    (state: RootState) => state.residentMeter,
  );
  const meter = residentMeterState?.residentMeter ?? null;

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
        setUserId(uId);

        const estate = parseResidentEstate(
          user as Record<string, unknown>,
        );
        setEstateId(estate?.id ?? null);

        const addresses = normalizeAddresses(user);
        if (addresses.length === 0) {
          toast.warning("No address attached to your account.");
          return;
        }
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? addresses[0].id);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedAddressId) return;
    dispatch(getMeterByAddress({ addressId: selectedAddressId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [selectedAddressId, dispatch]);

  useEffect(() => {
    if (!userId) return;
    dispatch(getResidentDashboardBills({ residentId: userId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
    dispatch(getResidentDashboardTransactions({ userId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [userId, dispatch]);

  useEffect(() => {
    const meterNumber = meter?.meterNumber;
    if (!meterNumber) return;
    dispatch(getResidentDashboardVendHistory({ meterNumber }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [meter?.meterNumber, dispatch]);

  const handleAddressChange = useCallback((addressId: string) => {
    setSelectedAddressId(addressId);
  }, []);

  // const stats = useMemo(() => {
  //   const totalBills = bills.length;
  //   const paidBills = bills.filter(
  //     (b: ResidentBillItem) =>
  //       (b.status ?? "").toLowerCase() === "paid" ||
  //       Number(b.amountPaid ?? 0) > 0,
  //   ).length;
  //   const totalTx = transactions.length;
  //   const totalTxAmount = transactions.reduce(
  //     (sum: number, t: ResidentTransactionItem) => sum + Number(t.amount ?? 0),
  //     0,
  //   );
  //   const totalVend = vending.length;
  //   const totalVendAmount = vending.reduce(
  //     (sum: number, v: ResidentVendItem) => sum + Number(v.amount ?? 0),
  //     0,
  //   );
  //   return [
  //     {
  //       title: "My bills",
  //       value: String(totalBills),
  //       change: `${paidBills} paid`,
  //       icon: FileText,
  //       color: "bg-[#E6F4EA] text-[#007A4D]",
  //     },
  //     {
  //       title: "Transactions",
  //       value: String(totalTx),
  //       change: formatNaira(totalTxAmount),
  //       icon: DollarSign,
  //       color: "bg-[#D0DFF280] text-[#0150AC]",
  //     },
  //     {
  //       title: "Vending",
  //       value: String(totalVend),
  //       change: formatNaira(totalVendAmount),
  //       icon: Zap,
  //       color: "bg-[#FEE6D480] text-[#B45309]",
  //     },
  //     {
  //       title: "Trend",
  //       change: "This period",
  //       value: totalBills + totalTx + totalVend ? "Active" : "—",
  //       icon: TrendingUp,
  //       color: "bg-[#FFF4E5] text-[#FF8A00]",
  //     },
  //   ];
  // }, [bills, transactions, vending]);

  const billsChartData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    bills.forEach((b: ResidentBillItem) => {
      const status = (b.status ?? "Other").toLowerCase();
      const key =
        status === "paid" ? "Paid" : status === "pending" ? "Pending" : "Other";
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

  const estateOptions = useMemo(() => [{ label: "My data", value: "me" }], []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s your overview.
        </p>
      </div>

      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={handleAddressChange}
        className="p-4"
      />

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-muted-foreground font-medium text-base mb-1 mt-2">
                {stat.title}
              </p>
              <p className="font-heading text-3xl font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </div> */}

      {/* <div className="space-y-6">
        <Card className="p-4">
          {loading && billsChartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Loading bills...
            </p>
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

        <TransactionsChart
          title="Transaction history"
          subtitle={`${transactions.length} transaction(s)`}
          data={transactionTrendData}
          estateOptions={estateOptions}
          onExport={() => {}}
          className="w-full"
        />

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
      </div> */}
    </div>
  );
}
