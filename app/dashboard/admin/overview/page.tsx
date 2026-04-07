// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   TrendingUp,
//   Users,
//   FileText,
//   DollarSign,
//   ArrowUpRight,
// } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { Select } from "@/components/ui/select";
// import BillsOverview from "@/components/charts/bills-overview";
// import TransactionsChart from "@/components/charts/transactions-chart";
// import MeterStatusPie from "@/components/charts/meter-status-pie";
// import MeterTrendChart from "@/components/charts/meter-trend-chart";
// import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
// import {
//   getAdminBillsDashboard,
//   getAdminTransactionDashboard,
//   getAdminMeterDashboard,
//   type TopBillByCollection,
//   type AdminChargeBreakdownItem,
// } from "@/redux/slice/admin/dashboard-analytics/admin-dashboard-analytics";
// import type { RootState, AppDispatch } from "@/redux/store";
// import { toast } from "react-toastify";

// const formatNaira = (n: number) => `N${Number(n).toLocaleString()}`;
// const BILLS_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// export default function AdminOverview() {
//   const dispatch = useDispatch<AppDispatch>();
//   const [estateId, setEstateId] = useState<string | null>(null);
//   const [estateName, setEstateName] = useState("Estate");
//   const [chartView, setChartView] = useState<"bills" | "transactions" | "meter">("bills");

//   const adminDashboard = useSelector((state: RootState) => (state as any).adminDashboardAnalytics);
//   const bills = adminDashboard?.bills ?? null;
//   const transactions = adminDashboard?.transactions ?? null;
//   const meter = adminDashboard?.meter ?? null;
//   const loading =
//     adminDashboard?.billsStatus === "isLoading" ||
//     adminDashboard?.transactionsStatus === "isLoading" ||
//     adminDashboard?.meterStatus === "isLoading";

//   useEffect(() => {
//     (async () => {
//       try {
//         const userRes = await dispatch(getSignedInUser()).unwrap();
//         const id = userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
//         const name = userRes?.data?.estate?.name ?? userRes?.data?.estateName ?? "Estate";
//         if (id) {
//           setEstateId(id);
//           setEstateName(name);
//         }
//       } catch (err: unknown) {
//         const e = err as { message?: string };
//         toast.error(e?.message ?? "Failed to load user.");
//       }
//     })();
//   }, [dispatch]);

//   useEffect(() => {
//     if (!estateId) return;
//     dispatch(getAdminBillsDashboard({ estateId })).catch((err: unknown) => {
//       const e = err as { message?: string };
//       toast.error(e?.message ?? "Failed to load bills analytics.");
//     });
//     dispatch(getAdminTransactionDashboard({ estateId })).catch((err: unknown) => {
//       const e = err as { message?: string };
//       toast.error(e?.message ?? "Failed to load transaction analytics.");
//     });
//     dispatch(getAdminMeterDashboard({ estateId })).catch((err: unknown) => {
//       const e = err as { message?: string };
//       toast.error(e?.message ?? "Failed to load meter analytics.");
//     });
//   }, [estateId, dispatch]);

//   const stats = useMemo(() => {
//     const payStats = bills?.paymentStatistics;
//     const txSummary = transactions?.summary;
//     const meterSummary = meter?.summary;
//     return [
//       {
//         title: "Bills collected",
//         value: payStats ? formatNaira(payStats.totalAmountCollected) : "N0",
//         change: payStats ? `${payStats.paidAssignments} paid` : "—",
//         trend: "up" as const,
//         icon: FileText,
//         color: "bg-[#E6F4EA] text-[#007A4D]",
//       },
//       {
//         title: "Transactions",
//         value: txSummary ? String(txSummary.totalTransactions) : "0",
//         change: txSummary ? `Net ${formatNaira(txSummary.netFlow)}` : "—",
//         trend: "up" as const,
//         icon: DollarSign,
//         color: "bg-[#D0DFF280] text-[#0150AC]",
//       },
//       {
//         title: "Meters",
//         value: meterSummary ? String(meterSummary.totalMeters) : "0",
//         change: meterSummary ? `${meterSummary.assignedMeters} assigned` : "—",
//         trend: "up" as const,
//         icon: TrendingUp,
//         color: "bg-[#FEE6D480] text-[#B45309]",
//       },
//       {
//         title: "Active bills",
//         value: bills?.summary ? String(bills.summary.activeBills) : "0",
//         change: bills?.summary ? `${bills.summary.suspendedBills} suspended` : "—",
//         trend: "up" as const,
//         icon: Users,
//         color: "bg-[#FFF4E5] text-[#FF8A00]",
//       },
//     ];
//   }, [bills, transactions, meter]);

//   const billsChartData = useMemo(() => {
//     const top = bills?.topBillsByCollection ?? [];
//     if (top.length === 0) return [];
//     return top.map((b: TopBillByCollection, i: number) => ({
//       name: b.name,
//       value: b.totalAmountCollected ?? b.totalAssignments ?? 0,
//       fill: BILLS_CHART_COLORS[i % BILLS_CHART_COLORS.length],
//     }));
//   }, [bills?.topBillsByCollection]);

//   const transactionTrendData = useMemo(() => {
//     const trend = transactions?.trend ?? [];
//     if (!Array.isArray(trend) || trend.length === 0) return [];
//     return trend.map((item: Record<string, unknown>, i: number) => {
//       const label = (item.period ?? item.label ?? `Period ${i + 1}`) as string;
//       const value = Number(item.totalAmount ?? item.amount ?? item.value ?? 0);
//       return { label: String(label).slice(0, 10), value, highlighted: i === trend.length - 1 };
//     });
//   }, [transactions?.trend]);

//   const transactionTypeData = useMemo(() => {
//     const amounts = transactions?.typeBreakdown?.amounts;
//     if (!amounts) return [];
//     const credit = Number(amounts.credit ?? 0);
//     const debit = Number(amounts.debit ?? 0);
//     if (credit === 0 && debit === 0) return [];
//     return [
//       { label: "Credit", value: credit, highlighted: true },
//       { label: "Debit", value: debit, highlighted: false },
//     ];
//   }, [transactions?.typeBreakdown?.amounts]);

//   const chargeBreakdownData = useMemo(() => {
//     const breakdown = transactions?.chargeAnalytics?.summary?.breakdown ?? [];
//     if (breakdown.length === 0) return [];
//     return breakdown.map((b: AdminChargeBreakdownItem, i: number) => ({
//       label: b.chargeType,
//       value: b.totalAmount,
//       highlighted: i === 0,
//     }));
//   }, [transactions?.chargeAnalytics?.summary?.breakdown]);

//   const meterAssignmentData = useMemo(() => {
//     const s = meter?.summary;
//     if (!s) return [];
//     return [
//       { name: "Assigned", value: s.assignedMeters ?? 0, fill: "#10b981" },
//       { name: "Unassigned", value: (s.totalMeters ?? 0) - (s.assignedMeters ?? 0), fill: "#f59e0b" },
//     ].filter((d) => d.value >= 0);
//   }, [meter?.summary]);

//   const meterTrendData = useMemo(() => {
//     const trend = meter?.lastSeenTrend ?? meter?.readingTrend ?? [];
//     if (!Array.isArray(trend) || trend.length === 0) return [];
//     return trend.map((item: Record<string, unknown>, i: number) => {
//       const label = (item.period ?? item.date ?? `Period ${i + 1}`) as string;
//       const value = Number(item.count ?? item.value ?? 0);
//       return { label: String(label).slice(0, 12), value };
//     });
//   }, [meter?.lastSeenTrend, meter?.readingTrend]);

//   const estateOptions = useMemo(
//     () => [{ label: estateName, value: estateId ?? "all" }],
//     [estateName, estateId]
//   );

//   return (
//     <div className="space-y-8">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
//           <p className="text-muted-foreground mt-1">
//             Welcome back! Here&apos;s an overview on{" "}
//             <span className="text-[18px] font-bold underline uppercase text-black">
//               {estateName}
//             </span>
//             {"."}
//           </p>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => {
//           const Icon = stat.icon;
//           const isPositive = stat.trend === "up";
//           return (
//             <Card key={stat.title} className="p-6 hover:shadow-md transition-shadow">
//               <div className="flex items-start justify-between gap-3">
//                 <div className={`w-[50px] p-3 rounded-lg ${stat.color}`}>
//                   <Icon className="w-6 h-6" />
//                 </div>
//                 <div
//                   className={`flex items-center gap-1 text-sm font-medium ${
//                     isPositive ? "text-green-600" : "text-red-600"
//                   }`}
//                 >
//                   <ArrowUpRight className="w-4 h-4" />
//                   {stat.change}
//                 </div>
//               </div>
//               <p className="text-muted-foreground font-medium text-base mb-1 mt-2">{stat.title}</p>
//               <p className="font-heading text-3xl font-bold">{stat.value}</p>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Chart selector + single chart area (Bills / Transactions / Meter) */}
//       <div className="space-y-4">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <label htmlFor="admin-chart-select" className="text-sm font-medium text-muted-foreground">
//             Chart to display
//           </label>
//           <Select
//             id="admin-chart-select"
//             options={[
//               { label: "Bills overview", value: "bills" },
//               { label: "Transaction trend", value: "transactions" },
//               { label: "Meter / Vending", value: "meter" },
//             ]}
//             value={chartView}
//             onChange={(e) =>
//               setChartView(e.target.value as "bills" | "transactions" | "meter")
//             }
//             className="w-full max-w-xs"
//           />
//         </div>
//         <div className="min-h-[320px]">
//           {chartView === "bills" && (
//             <Card className="p-4">
//               {(() => {
//                 const isLoading = loading && billsChartData.length === 0;
//                 const isEmpty = !loading && billsChartData.length === 0;
//                 if (isLoading)
//                   return (
//                     <p className="text-muted-foreground text-sm py-8 text-center">
//                       Loading bills...
//                     </p>
//                   );
//                 if (isEmpty)
//                   return (
//                     <p className="text-muted-foreground text-sm py-8 text-center">
//                       No bills data to display
//                     </p>
//                   );
//                 return (
//                 <BillsOverview
//                   title="Bills"
//                   subtitle={
//                     bills?.paymentStatistics
//                       ? `Collected: ${formatNaira(bills.paymentStatistics.totalAmountCollected)} · Expected: ${formatNaira(bills.paymentStatistics.totalAmountExpected)}`
//                       : "Bills by collection"
//                   }
//                   data={billsChartData}
//                   onExport={() => {}}
//                 />
//                 );
//               })()}
//             </Card>
//           )}
//           {chartView === "transactions" && (
//             <>
//               <TransactionsChart
//                 title="Transaction trend"
//                 subtitle={
//                   transactions?.summary
//                     ? `Total: ${transactions.summary.totalTransactions} · Net: ${formatNaira(transactions.summary.netFlow)}`
//                     : "Transaction trend"
//                 }
//                 data={transactionTrendData}
//                 estateOptions={estateOptions}
//                 onExport={() => {}}
//                 className="w-full"
//               />
//               <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <TransactionsChart
//                   title="Credit vs Debit"
//                   subtitle="Amounts by type"
//                   data={transactionTypeData}
//                   estateOptions={estateOptions}
//                   onExport={() => {}}
//                   className="w-full"
//                 />
//                 <TransactionsChart
//                   title="Charge breakdown"
//                   subtitle={
//                     transactions?.chargeAnalytics?.summary
//                       ? `Total charges: ${formatNaira(transactions.chargeAnalytics.summary.totalCharges)}`
//                       : "By charge type"
//                   }
//                   data={chargeBreakdownData}
//                   estateOptions={estateOptions}
//                   onExport={() => {}}
//                   className="w-full"
//                 />
//               </div>
//             </>
//           )}
//           {chartView === "meter" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <MeterStatusPie
//                 title="Meter assignment"
//                 subtitle="Assigned vs unassigned"
//                 data={meterAssignmentData}
//               />
//               <MeterTrendChart
//                 title="Meter trend"
//                 subtitle="Last seen / reading trend"
//                 data={meterTrendData}
//                 valueLabel="Count"
//               />
//               {!loading && meterAssignmentData.length === 0 && meterTrendData.length === 0 && (
//                 <p className="text-muted-foreground text-sm col-span-2 py-8 text-center">
//                   No meter data to display
//                 </p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import BillsOverview from "@/components/charts/bills-overview";
import TransactionsChart from "@/components/charts/transactions-chart";
import MeterStatusPie from "@/components/charts/meter-status-pie";
import MeterTrendChart from "@/components/charts/meter-trend-chart";

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

export default function AdminOverview() {
  const [chartView, setChartView] = useState("bills");

  const estateName = "Sunshine Estate";

  /** 🔥 Dummy Stats */
  const stats = [
    {
      title: "Bills collected",
      value: formatNaira(15000000),
      change: "450 paid",
      trend: "up",
      icon: FileText,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Transactions",
      value: "2,340",
      change: `Net ${formatNaira(12000000)}`,
      trend: "up",
      icon: DollarSign,
      color: "bg-[#D0DFF280] text-[#0150AC]",
    },
    {
      title: "Meters",
      value: "1,200",
      change: "900 assigned",
      trend: "up",
      icon: TrendingUp,
      color: "bg-[#FEE6D480] text-[#B45309]",
    },
    {
      title: "Active bills",
      value: "320",
      change: "40 suspended",
      trend: "up",
      icon: Users,
      color: "bg-[#FFF4E5] text-[#FF8A00]",
    },
  ];

  /** 📊 Dummy Data */
  const billsChartData = [
    { name: "Electricity", value: 7000000, fill: "#0150AC" },
    { name: "Water", value: 3000000, fill: "#FA8128" },
    { name: "Security", value: 2000000, fill: "#10b981" },
  ];

  const transactionTrendData = [
    { label: "Jan", value: 2000000 },
    { label: "Feb", value: 4000000 },
    { label: "Mar", value: 3000000 },
    { label: "Apr", value: 5000000 },
  ];

  const transactionTypeData = [
    { label: "Credit", value: 12000000 },
    { label: "Debit", value: 3000000 },
  ];

  const chargeBreakdownData = [
    { label: "Electricity", value: 6000000 },
    { label: "Water", value: 2000000 },
    { label: "Service", value: 1500000 },
  ];

  const meterAssignmentData = [
    { name: "Assigned", value: 900 },
    { name: "Unassigned", value: 300 },
  ];

  const meterTrendData = [
    { label: "Jan", value: 200 },
    { label: "Feb", value: 300 },
    { label: "Mar", value: 250 },
  ];

  const estateOptions = [{ label: estateName, value: "1" }];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of{" "}
          <span className="font-bold uppercase">{estateName}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex justify-between">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUpRight size={16} />
                  {stat.change}
                </div>
              </div>
              <p className="mt-3 text-sm">{stat.title}</p>
              <h2 className="text-2xl font-bold">{stat.value}</h2>
            </Card>
          );
        })}
      </div>

      {/* Chart Selector */}
      <div className="space-y-4">
        <Select
          options={[
            { label: "Bills overview", value: "bills" },
            { label: "Transaction trend", value: "transactions" },
            { label: "Meter", value: "meter" },
          ]}
          value={chartView}
          onChange={(e) => setChartView(e.target.value)}
          className="max-w-xs"
        />

        {/* Charts */}
        {chartView === "bills" && (
          <Card className="p-4">
            <BillsOverview title="Bills" data={billsChartData} />
          </Card>
        )}

        {chartView === "transactions" && (
          <>
            <TransactionsChart
              title="Transaction trend"
              data={transactionTrendData}
              estateOptions={estateOptions}
            />

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <TransactionsChart
                title="Credit vs Debit"
                data={transactionTypeData}
                estateOptions={estateOptions}
              />
              <TransactionsChart
                title="Charge breakdown"
                data={chargeBreakdownData}
                estateOptions={estateOptions}
              />
            </div>
          </>
        )}

        {chartView === "meter" && (
          <div className="grid md:grid-cols-2 gap-6">
            <MeterStatusPie
              title="Meter Assignment"
              data={meterAssignmentData}
            />
            <MeterTrendChart
              title="Meter Trend"
              data={meterTrendData}
            />
          </div>
        )}
      </div>
    </div>
  );
}