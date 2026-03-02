"use client"

import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Building2,
  Users,
  Gauge,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react"
import {
  DashboardHeader,
  KpiCard,
  DashboardChartCard,
  VendingTrendChart,
  BillsOverviewChart,
} from "./components"
import TransactionsChart from "@/components/charts/transactions-chart"
import { Select } from "@/components/ui/select"
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt"
import { getSuperAdminBillsAnalyticsDashboard } from "@/redux/slice/super-admin/super-admin-bills-analytics/super-admin-bills-analytics"
import type { RootState, AppDispatch } from "@/redux/store"
import { toast } from "react-toastify"

const BILLS_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

// Transactions bar chart data (dummy until transaction analytics for super admin)
const transactionsData = [
  { label: "JAN 1", value: 1200 },
  { label: "JAN 2", value: 2100 },
  { label: "JAN 3", value: 1800 },
  { label: "JAN 4", value: 2900 },
  { label: "JAN 5", value: 2400 },
  { label: "JAN 6", value: 3100 },
  { label: "JAN 7", value: 4200, highlighted: true },
  { label: "JAN 8", value: 2800 },
  { label: "JAN 9", value: 3500 },
  { label: "JAN 10", value: 2600 },
  { label: "JAN 11", value: 3900 },
  { label: "JAN 12", value: 3200 },
]

export default function SuperAdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedEstateId, setSelectedEstateId] = useState<string>("")

  const estateState = useSelector((state: RootState) => (state as any).estate)
  const billsState = useSelector((state: RootState) => (state as any).superAdminBillsAnalytics)

  const estates = estateState?.allEstates?.data ?? []
  const billsDashboard = billsState?.dashboard ?? null
  const billsLoading = billsState?.status === "isLoading"

  const estateFilterOptions = useMemo(() => {
    if (!estates.length) return [{ label: "Select estate", value: "" }]
    return [
      { label: "Select estate", value: "" },
      ...estates.map((e: { id: string; name: string }) => ({ label: e.name, value: e.id })),
    ]
  }, [estates])

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: 200 })).catch((err: any) =>
      toast.error(err?.message ?? "Failed to fetch estates")
    )
  }, [dispatch])

  useEffect(() => {
    if (!selectedEstateId) return
    dispatch(getSuperAdminBillsAnalyticsDashboard({ estateId: selectedEstateId })).catch(
      (err: any) => toast.error(err?.message ?? "Failed to fetch bills analytics")
    )
  }, [selectedEstateId, dispatch])

  // When estates load, auto-select first estate
  useEffect(() => {
    if (estates.length > 0 && !selectedEstateId) {
      const first = estates[0] as { id: string }
      if (first?.id) setSelectedEstateId(first.id)
    }
  }, [estates, selectedEstateId])

  const billsChartData = useMemo(() => {
    const topBills = billsDashboard?.topBillsByCollection ?? []
    if (topBills.length === 0) return []
    return topBills.map((bill: { name: string; totalAmountCollected?: number; totalAssignments?: number }, i: number) => ({
      name: bill.name,
      value: bill.totalAmountCollected ?? bill.totalAssignments ?? 0,
      fill: BILLS_CHART_COLORS[i % BILLS_CHART_COLORS.length],
    }))
  }, [billsDashboard])

  const kpiCards = useMemo(() => {
    const totalEstates = estates?.length ?? 0
    return [
      {
        label: "Total Estates",
        value: String(totalEstates),
        trend: "this month",
        trendUp: true,
        icon: Building2,
        iconBgClassName: "bg-blue-500/10 text-blue-600",
      },
      {
        label: "Total Residents",
        value: "1,400",
        trend: "5.2% this month",
        trendUp: true,
        icon: Users,
        iconBgClassName: "bg-emerald-500/10 text-emerald-600",
      },
      {
        label: "Total Meters",
        value: "125",
        trend: "5.2% this month",
        trendUp: true,
        icon: Gauge,
        iconBgClassName: "bg-amber-500/10 text-amber-600",
      },
      {
        label: "Total Transactions",
        value: "N850,000",
        trend: "5.2% this month",
        trendUp: true,
        icon: ArrowLeftRight,
        iconBgClassName: "bg-violet-500/10 text-violet-600",
      },
    ]
  }, [estates?.length])

  const handleExport = () => {}

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 ">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <DashboardChartCard title="Transactions" totalLabel="" totalValue="">
        <TransactionsChart
          title="Transactions"
          subtitle="This month's comparison"
          data={transactionsData}
          estateOptions={estateFilterOptions}
          onExport={handleExport}
        />
      </DashboardChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <DashboardChartCard
          title="Bills by collection"
          totalLabel={
            billsDashboard?.paymentStatistics
              ? `Collected: N${Number(billsDashboard.paymentStatistics.totalAmountCollected).toLocaleString()}`
              : undefined
          }
          totalValue={
            billsDashboard?.paymentStatistics
              ? `Expected: N${Number(billsDashboard.paymentStatistics.totalAmountExpected).toLocaleString()}`
              : undefined
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                options={estateFilterOptions}
                value={selectedEstateId}
                onChange={(e) => setSelectedEstateId(e.target.value)}
                className="h-9 min-w-[180px] appearance-none pr-8"
              />
              <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
            </div>
            {selectedEstateId === "" && (
              <p className="text-sm text-muted-foreground py-8 text-center">Select an estate to view bills</p>
            )}
            {selectedEstateId !== "" && billsLoading && (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading bills...</p>
            )}
            {selectedEstateId !== "" && !billsLoading && billsChartData.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No bills data for this estate</p>
            )}
            {selectedEstateId !== "" && !billsLoading && billsChartData.length > 0 && (
              <BillsOverviewChart data={billsChartData} />
            )}
          </div>
        </DashboardChartCard>
        <DashboardChartCard
          title="Vending"
          totalLabel="Total Transactions"
          totalValue="N150,000,000"
        >
          <VendingTrendChart />
        </DashboardChartCard>
      </div>
    </div>
  )
}
