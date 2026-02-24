"use client"

import {
  Building2,
  Users,
  Gauge,
  ArrowLeftRight,
} from "lucide-react"
import {
  DashboardHeader,
  KpiCard,
  DashboardChartCard,
  VendingTrendChart, 
} from "./components"
import BillsBreakdownCardData from '@/components/charts/bills-breakdown-card';
import TransactionsChart from '@/components/charts/transactions-chart';

// Transactions bar chart data (dummy)
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

const kpiCards = [
  {
    label: "Total Estates",
    value: "25",
    trend: "5.2% this month",
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

const estateFilterOptions = [
  { label: "All estates", value: "all" },
  { label: "Estate A", value: "estate-a" },
  { label: "Estate B", value: "estate-b" },
]

export default function SuperAdminDashboard() {
  const handleExport = () => {
    // Export transactions (wire to API when ready)
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview"
      />

      {/* KPI cards – responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 ">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Transactions bar chart */}
      <DashboardChartCard title="Transactions" totalLabel="" totalValue="">
        <TransactionsChart
          title="Transactions"
          subtitle="This month's comparison"
          data={transactionsData}
          estateOptions={estateFilterOptions}
          onExport={handleExport}
        />
      </DashboardChartCard> 

      {/* Bills and Vending – two cards side by side, stack on small screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
      
          <BillsBreakdownCardData/>  
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
