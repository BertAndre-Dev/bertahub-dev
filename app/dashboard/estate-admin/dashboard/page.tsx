"use client";

import { useState } from "react";
import { TrendingUp, Users, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransactionsChart from "@/components/charts/transactions-chart";
import BillsOverview from "@/components/charts/bills-overview";
import OccupancyDistribution from "@/components/charts/occupancy-distribution";
import BillsBreakdownCard from "@/components/charts/bills-breakdown-card";
import { VendingTrendChart } from "@/app/dashboard/super-admin/dashboard/components/vending-trend-chart";

export default function EstateAdminOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">(
    "month",
  );

  const stats = [
    {
      title: "Total Revenue",
      value: "N9,850,000",
      change: "+5.2% this month",
      trend: "up" as const,
      icon: DollarSign,
      color: "bg-[#D0DFF280] text-[#0150AC]",
    },
    {
      title: "Units",
      value: "125/550 Occupied",
      change: "+5.2% this month",
      trend: "up" as const,
      icon: Users,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Paid Bills",
      value: "N650,000",
      change: "+5.2% this month",
      trend: "up" as const,
      icon: FileText,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Pending Bills",
      value: "N25,000",
      change: "+5.2% this month",
      trend: "up" as const,
      icon: FileText,
      color: "bg-[#FFF4E5] text-[#FF8A00]",
    },
  ];

  const estateFilterOptions = [
    { label: "Demo Estate", value: "demo" },
    { label: "All estates", value: "all" },
  ];

  const revenueTrendData = [
    { label: "JUL", value: 150000 },
    { label: "AUG", value: 320000 },
    { label: "SEP", value: 450000 },
    { label: "OCT", value: 760000, highlighted: true },
    { label: "NOV", value: 380000 },
    { label: "DEC", value: 590000 },
    { label: "JAN", value: 650000 },
  ];

  const transactionsData = [
    { label: "JAN 1", value: 2800 },
    { label: "JAN 2", value: 2300 },
    { label: "JAN 3", value: 3100 },
    { label: "JAN 4", value: 2600 },
    { label: "JAN 5", value: 4200, highlighted: true },
    { label: "JAN 6", value: 3600 },
    { label: "JAN 7", value: 3900 },
  ];

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

  const billsBreakdownData = [
    { name: "Service Charge", value: 50000, amount: "N50,000" },
    { name: "Wallet Topup", value: 42000, amount: "N42,000" },
    { name: "Vending", value: 30000, amount: "N30,000" },
    { name: "Others", value: 15000, amount: "N15,000" },
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
              Demo Estate.
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

      {/* Revenue trend */}
      <TransactionsChart
        title="Revenue Trend"
        subtitle="This month's comparison"
        data={revenueTrendData}
        estateOptions={estateFilterOptions}
        onExport={handleExport}
        className="w-full"
      />

      {/* Bills + Occupancy / Power usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4 sm:p-5 md:p-6">
          <BillsOverview
            title="Bills"
            subtitle="This month's comparison"
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionsChart
          title="Transactions"
          subtitle="Total Transactions N150,000,000"
          data={transactionsData}
          estateOptions={estateFilterOptions}
          onExport={handleExport}
        />

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

      {/* Bills donut & Occupancy distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BillsBreakdownCard data={billsBreakdownData} />
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
    </div>
  );
}
