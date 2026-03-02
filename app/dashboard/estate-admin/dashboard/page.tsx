"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TrendingUp, Users, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import TransactionsChart from "@/components/charts/transactions-chart";
import BillsOverview from "@/components/charts/bills-overview";
import OccupancyDistribution from "@/components/charts/occupancy-distribution";
import BillsBreakdownCard from "@/components/charts/bills-breakdown-card";
import MeterStatusPie from "@/components/charts/meter-status-pie";
import MeterTrendChart from "@/components/charts/meter-trend-chart";
import MeterCreditSummary from "@/components/charts/meter-credit-summary";
import { VendingTrendChart } from "@/app/dashboard/super-admin/dashboard/components/vending-trend-chart";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getTransactionAnalyticsDashboard } from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics";
import { getBillsAnalyticsDashboard } from "@/redux/slice/estate-admin/bills-analytics/bills-analytics";
import { getMeterAnalyticsDashboard } from "@/redux/slice/estate-admin/meter-analytics/meter-analytics";
import type { ChargeBreakdownItem } from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics";
import type { TopBillByCollection } from "@/redux/slice/estate-admin/bills-analytics/bills-analytics";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";

const formatNaira = (n: number) => `N${Number(n).toLocaleString()}`;

/** Returns start and end date (YYYY-MM-DD) for the given period (end = today). */
function getDateRangeForPeriod(period: "week" | "month" | "year"): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = new Date(end);
  if (period === "week") start.setDate(start.getDate() - 7);
  else if (period === "month") start.setDate(start.getDate() - 30);
  else start.setFullYear(start.getFullYear() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/** Fallback when bills analytics API returns no topBillsByCollection (not from API). */
const BILLS_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function EstateAdminOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">(
    "month",
  );
  const [meterChartView, setMeterChartView] = useState<
    "assignment" | "active" | "trend" | "credit"
  >("assignment");
  const [transactionChartView, setTransactionChartView] = useState<
    "revenue" | "type" | "charge"
  >("revenue");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Demo Estate");

  const txAnalytics = useSelector(
    (state: RootState) => (state as any).estateAdminTransactionAnalytics
  );
  const billsAnalytics = useSelector(
    (state: RootState) => (state as any).estateAdminBillsAnalytics
  );
  const meterAnalytics = useSelector(
    (state: RootState) => (state as any).estateAdminMeterAnalytics
  );

  const txDashboard = txAnalytics?.dashboard ?? null;
  const billsDashboard = billsAnalytics?.dashboard ?? null;
  const meterDashboard = meterAnalytics?.dashboard ?? null;
  const meterLoading = meterAnalytics?.status === "isLoading";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
        const name = userRes?.data?.estate?.name ?? userRes?.data?.estateName ?? "Estate";
        if (id) {
          setEstateId(id);
          setEstateName(name);
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    const { startDate, endDate } = getDateRangeForPeriod(selectedPeriod);
    dispatch(
      getTransactionAnalyticsDashboard({ estateId, startDate, endDate })
    ).catch((err: any) =>
      toast.error(err?.message ?? "Failed to load transaction analytics.")
    );
  }, [estateId, selectedPeriod, dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getBillsAnalyticsDashboard({ estateId })).catch((err: any) =>
      toast.error(err?.message ?? "Failed to load bills analytics.")
    );
  }, [estateId, dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getMeterAnalyticsDashboard({ estateId })).catch((err: any) =>
      toast.error(err?.message ?? "Failed to load meter analytics.")
    );
  }, [estateId, dispatch]);

  const stats = useMemo(() => {
    const summary = txDashboard?.summary;
    const chargeSummary = txDashboard?.chargeAnalytics?.summary;
    const payStats = billsDashboard?.paymentStatistics;
    const billsSummary = billsDashboard?.summary;
    return [
      {
        title: "Total Revenue",
        value: summary ? formatNaira(summary.totalCredits) : "N0",
        change: "this month",
        trend: "up" as const,
        icon: DollarSign,
        color: "bg-[#D0DFF280] text-[#0150AC]",
      },
      {
        title: "Transactions",
        value: summary?.totalTransactions ?? chargeSummary?.totalTransactions ?? 0,
        change: "this month",
        trend: "up" as const,
        icon: Users,
        color: "bg-[#E6F4EA] text-[#007A4D]",
      },
      {
        title: "Paid Bills",
        value: payStats ? formatNaira(payStats.totalAmountCollected) : "N0",
        change: `${billsSummary?.activeBills ?? 0} active`,
        trend: "up" as const,
        icon: FileText,
        color: "bg-[#E6F4EA] text-[#007A4D]",
      },
      {
        title: "Pending / Unpaid",
        value: payStats ? formatNaira(payStats.totalAmountExpected - payStats.totalAmountCollected) : "N0",
        change: `${payStats?.unpaidAssignments ?? 0} unpaid`,
        trend: "up" as const,
        icon: FileText,
        color: "bg-[#FFF4E5] text-[#FF8A00]",
      },
    ];
  }, [txDashboard, billsDashboard]);

  const estateFilterOptions = useMemo(
    () => [{ label: estateName, value: estateId ?? "all" }],
    [estateName, estateId]
  );

  const { startDate: periodStart, endDate: periodEnd } = useMemo(
    () => getDateRangeForPeriod(selectedPeriod),
    [selectedPeriod]
  );

  const filteredTrend = useMemo(() => {
    const trend = txDashboard?.trend;
    if (!Array.isArray(trend) || trend.length === 0) return [];
    return trend
      .filter((item: Record<string, unknown>) => {
        const raw = item.period ?? item.date;
        const p = typeof raw === "string" ? raw.slice(0, 10) : "";
        if (!p) return false;
        return p >= periodStart && p <= periodEnd;
      })
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) => {
          const sa = typeof a.period === "string" ? a.period : "";
          const sb = typeof b.period === "string" ? b.period : "";
          return sa.localeCompare(sb);
        }
      );
  }, [txDashboard?.trend, periodStart, periodEnd]);

  const revenueTrendData = useMemo(() => {
    if (filteredTrend.length === 0) return [];
    return filteredTrend.map((item: Record<string, unknown>, i: number) => {
      const label = (item.period ?? item.label ?? item.month ?? `Period ${i + 1}`) as string;
      const value = Number(
        item.totalAmount ?? item.amount ?? item.value ?? item.total ?? 0
      );
      return { label: String(label).slice(0, 10), value, highlighted: i === filteredTrend.length - 1 };
    });
  }, [filteredTrend]);

  const typeBreakdownData = useMemo(() => {
    const amounts = txDashboard?.typeBreakdown?.amounts;
    if (!amounts) return [];
    const credit = Number(amounts.credit ?? 0);
    const debit = Number(amounts.debit ?? 0);
    if (credit === 0 && debit === 0) return [];
    return [
      { label: "Credit", value: credit, highlighted: true },
      { label: "Debit", value: debit, highlighted: false },
    ];
  }, [txDashboard?.typeBreakdown?.amounts]);

  const chargeBreakdownData = useMemo(() => {
    const breakdown = txDashboard?.chargeAnalytics?.summary?.breakdown ?? [];
    if (breakdown.length === 0) return [];
    return breakdown.map((b: ChargeBreakdownItem, i: number) => ({
      label: b.chargeType,
      value: b.totalAmount,
      highlighted: i === 0,
    }));
  }, [txDashboard?.chargeAnalytics?.summary?.breakdown]);

  const billsOverviewData = useMemo(() => {
    const topBills = billsDashboard?.topBillsByCollection ?? [];
    if (topBills.length === 0) return [];
    return topBills.map((bill: TopBillByCollection, i: number) => ({
      name: bill.name,
      value: bill.totalAmountCollected ?? bill.totalAssignments ?? 0,
      fill: BILLS_CHART_COLORS[i % BILLS_CHART_COLORS.length],
    }));
  }, [billsDashboard]);

  /** Bills breakdown from bills analytics API (topBillsByCollection) – shows bill names in pie */
  const billsBreakdownData = useMemo(() => {
    const topBills = billsDashboard?.topBillsByCollection ?? [];
    if (topBills.length === 0) return [];
    return topBills.map((bill: TopBillByCollection) => {
      const amount = bill.totalAmountCollected ?? 0;
      const value = amount > 0 ? amount : (bill.totalAssignments ?? bill.paidCount ?? 0);
      return {
        name: bill.name,
        value,
        amount: formatNaira(amount),
      };
    });
  }, [billsDashboard]);

  /** Subheading for bills card: Total bills, Active, Suspended from API summary */
  const billsSummarySubtitle = useMemo(() => {
    const s = billsDashboard?.summary;
    if (!s) return undefined;
    const parts = [
      `Total Bills: ${s.totalBills}`,
      `Active Bills: ${s.activeBills}`,
      `Suspended Bills: ${s.suspendedBills}`,
    ];
    return parts.join(" · ");
  }, [billsDashboard]);

  /** Meter analytics: assignment status for pie */
  const meterAssignmentPieData = useMemo(() => {
    const a = meterDashboard?.assignmentStatus;
    if (!a) return [];
    return [
      { name: "Assigned", value: a.assigned ?? 0, fill: "#10b981" },
      { name: "Unassigned", value: a.unassigned ?? 0, fill: "#f59e0b" },
    ];
  }, [meterDashboard]);

  /** Meter analytics: active status for pie */
  const meterActivePieData = useMemo(() => {
    const a = meterDashboard?.activeStatus;
    if (!a) return [];
    return [
      { name: "Active", value: a.active ?? 0, fill: "#10b981" },
      { name: "Inactive", value: a.inactive ?? 0, fill: "#ef4444" },
    ];
  }, [meterDashboard]);

  /** Meter analytics: last-seen or reading trend for line chart */
  const meterTrendData = useMemo(() => {
    const trend = meterDashboard?.lastSeenTrend ?? meterDashboard?.readingTrend ?? [];
    if (!Array.isArray(trend) || trend.length === 0) return [];
    return trend.map((item: Record<string, unknown>, i: number) => {
      const label =
        (item.period ?? item.date ?? item.label ?? item.month ?? `Period ${i + 1}`) as string;
      const value = Number(item.count ?? item.value ?? item.total ?? 0);
      return { label: String(label).slice(0, 12), value };
    });
  }, [meterDashboard]);

  const powerUsageData = [
    { powerKwh: 50, value: 0.8 },
    { powerKwh: 100, value: 1.2 },
    { powerKwh: 150, value: 0.6 },
    { powerKwh: 200, value: 1 },
    { powerKwh: 250, value: 1.4 },
    { powerKwh: 300, value: 1.8 },
  ];

  const withdrawalsData = [
    { powerKwh: 1, value: 0.25 },
    { powerKwh: 2, value: 0.21 },
    { powerKwh: 3, value: 0.18 },
    { powerKwh: 4, value: 0.23 },
    { powerKwh: 5, value: 0.25 },
    { powerKwh: 6, value: 0.27 },
  ];

  const handleExport = () => {
    // Wire up to export functionality when backend is ready
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}.
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === "up";
          return (
            <Card
              key={stat.title}
              className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md sm:p-5 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.color}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? "text-[#007A4D]" : "text-red-600"
                  }`}
                >
                  <span className="border border-current p-1 rounded-sm inline-flex">
                    <TrendingUp
                      className={`h-4 w-4 ${isPositive ? "" : "rotate-180"}`}
                      aria-hidden
                    />
                  </span>
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="mt-1 truncate font-heading text-2xl font-bold tabular-nums md:text-3xl">
                  {stat.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transaction analytics: one chart with selector (like meter) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="tx-chart-select" className="text-sm font-medium text-muted-foreground">
            Chart to display
          </label>
          <Select
            id="tx-chart-select"
            options={[
              { label: "Revenue trend", value: "revenue" },
              { label: "Transaction type (Credit vs Debit)", value: "type" },
              { label: "Charge breakdown", value: "charge" },
            ]}
            value={transactionChartView}
            onChange={(e) =>
              setTransactionChartView(e.target.value as "revenue" | "type" | "charge")
            }
            className="w-full max-w-xs"
          />
        </div>
        <div className="min-h-[320px]">
          {transactionChartView === "revenue" && (
            <TransactionsChart
              title="Revenue trend"
              subtitle={
                filteredTrend.length > 0
                  ? `${filteredTrend.length} period(s) in selected range`
                  : "No data for the selected period"
              }
              data={revenueTrendData}
              estateOptions={estateFilterOptions}
              onExport={handleExport}
              className="w-full"
            />
          )}
          {transactionChartView === "type" && (
            <TransactionsChart
              title="Transaction type"
              subtitle={
                txDashboard?.summary
                  ? `Credits: ${txDashboard.summary.creditTransactions} · Debits: ${txDashboard.summary.debitTransactions}`
                  : "Credit vs Debit amounts"
              }
              data={typeBreakdownData}
              estateOptions={estateFilterOptions}
              onExport={handleExport}
              className="w-full"
            />
          )}
          {transactionChartView === "charge" && (
            <TransactionsChart
              title="Charge breakdown"
              subtitle={
                txDashboard?.chargeAnalytics?.summary
                  ? `Total charges: ${formatNaira(txDashboard.chargeAnalytics.summary.totalCharges)}`
                  : "By charge type"
              }
              data={chargeBreakdownData}
              estateOptions={estateFilterOptions}
              onExport={handleExport}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Bills + Occupancy / Power usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4 sm:p-5 md:p-6">
          <BillsOverview
            title="Bills"
            subtitle={
              billsDashboard?.paymentStatistics
                ? `Collected: ${formatNaira(billsDashboard.paymentStatistics.totalAmountCollected)} · Expected: ${formatNaira(billsDashboard.paymentStatistics.totalAmountExpected)}`
                : "This month's comparison"
            }
            data={billsOverviewData}
            onExport={handleExport}
          />
        </Card>

        <Card className="p-4 sm:p-5 md:p-6">
          <div className="mb-4 space-y-1">
            <h2 className="font-heading text-xl font-bold">Power Usage</h2>
            <p className="text-sm text-muted-foreground">
              Total Usage: <span className="font-semibold">1500 kWh</span>
            </p>
          </div>
          <VendingTrendChart data={powerUsageData} />
        </Card>
      </div>

      {/* Transactions + Withdrawals */}
      <div className="grid grid-cols-1 gap-6 ">
       

        <Card className="p-4 sm:p-5 md:p-6">
          <div className="mb-4 space-y-1">
            <h2 className="font-heading text-xl font-bold">Withdrawals</h2>
            <p className="text-sm text-muted-foreground">
              Total Withdrawals:{" "}
              <span className="font-semibold">N150,000,000</span>
            </p>
          </div>
          <VendingTrendChart data={withdrawalsData} />
        </Card>
      </div>

      {/* Bills donut (from bills API) & Occupancy distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BillsBreakdownCard
          title="Bills"
          data={billsBreakdownData}
          subtitle={billsSummarySubtitle}
          total={billsDashboard?.paymentStatistics?.totalAmountCollected ?? 0}
          // totalLabel="Total Collected"
        />
        <Card className="p-4 sm:p-5 md:p-6">
          <div className="mb-4 space-y-1">
            <h2 className="font-heading text-xl font-bold">Occupancy</h2>
            <p className="text-sm text-muted-foreground">
              Distribution of occupied vs vacant units
            </p>
          </div>
          <OccupancyDistribution
            totalResidents={54765}
            occupiedPercentage={64}
            vacantPercentage={24}
          />
        </Card>
      </div>

      {/* Meter analytics: summary cards + one chart with selector */}
      <div className="bg-white rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="meter-chart-select" className="text-sm font-medium text-muted-foreground">
              Chart to display
            </label>
            <Select
              id="meter-chart-select"
              options={[
                { label: "Assignment status (Assigned vs Unassigned)", value: "assignment" },
                { label: "Active status (Active vs Inactive)", value: "active" },
                { label: "Meter trend", value: "trend" },
                { label: "Credit metrics", value: "credit" },
              ]}
              value={meterChartView}
              onChange={(e) =>
                setMeterChartView(e.target.value as "assignment" | "active" | "trend" | "credit")
              }
              className="w-full max-w-xs"
            />
          </div>
          <div className="min-h-[280px]">
            {meterChartView === "assignment" && (
              <MeterStatusPie
                title="Assignment status"
                subtitle="Assigned vs unassigned meters"
                data={meterAssignmentPieData}
              />
            )}
            {meterChartView === "active" && (
              <MeterStatusPie
                title="Active status"
                subtitle="Active vs inactive meters"
                data={meterActivePieData}
              />
            )}
            {meterChartView === "trend" && (
              <MeterTrendChart
                title="Meter trend"
                subtitle={
                  meterDashboard?.lastSeenTrend?.length
                    ? "Last seen trend"
                    : "Reading trend"
                }
                data={meterTrendData}
                valueLabel="Count"
              />
            )}
            {meterChartView === "credit" && (
              <MeterCreditSummary
                title="Credit metrics"
                data={meterDashboard?.averageCreditMetrics ?? null}
                loading={meterLoading}
                formatValue={formatNaira}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
