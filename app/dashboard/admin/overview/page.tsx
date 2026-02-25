"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OccupancyDistribution from "@/components/charts/occupancy-distribution";
import BillsOverview from "@/components/charts/bills-overview";

export default function AdminOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 45000, expenses: 32000 },
    { month: "Feb", revenue: 52000, expenses: 35000 },
    { month: "Mar", revenue: 48000, expenses: 33000 },
    { month: "Apr", revenue: 61000, expenses: 38000 },
    { month: "May", revenue: 55000, expenses: 36000 },
    { month: "Jun", revenue: 67000, expenses: 40000 },
  ];

  const billsData = [
    { name: "Electricity", value: 35, fill: "#3b82f6" },
    { name: "Water", value: 25, fill: "#10b981" },
    { name: "Maintenance", value: 20, fill: "#f59e0b" },
    { name: "Security", value: 20, fill: "#ef4444" },
  ];

  const occupancyData = [
    { month: "Jan", occupied: 85, vacant: 15 },
    { month: "Feb", occupied: 88, vacant: 12 },
    { month: "Mar", occupied: 90, vacant: 10 },
    { month: "Apr", occupied: 92, vacant: 8 },
    { month: "May", occupied: 91, vacant: 9 },
    { month: "Jun", occupied: 93, vacant: 7 },
  ];

  const stats = [
    {
      title: "Total Revenue",
      value: "$328,000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Active Users",
      value: "1,248",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Pending Bills",
      value: "42",
      change: "-3.1%",
      trend: "down",
      icon: FileText,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Occupancy Rate",
      value: "93%",
      change: "+2.4%",
      trend: "up",
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's is an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              Doe Estate
            </span>.
          </p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "year"].map((period) => (
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

      {/* Stats Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === "up";
          return (
            <Card key={i} className="p-6 hover:shadow-md gap-3 transition-shadow">
          
                <div className={`w-[50px] p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
      
              <p className="text-muted- font-medium text-base mb-1">{stat.title}</p>
              <p className="font-heading text-3xl font-bold">{stat.value}</p>
              <div
                  className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change} This month
                </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold">
              Revenue vs Expenses
            </h2>
            <p className="text-sm text-muted-foreground">
              Last 6 months comparison
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Occupancy Distribution */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold">
              Occupancy Distribution
            </h2>
          </div>
          <OccupancyDistribution
            totalResidents={54765}
            occupiedPercentage={64}
            vacantPercentage={24}
          />
        </Card>
      </div>

      {/* Bills Overview */}
      <Card className="p-6">
        <BillsOverview
          title="Bills Overview"
          subtitle="This month's comparison"
          data={[
            { name: "Paid", value: 450, fill: "#10b981", label: "450" },
            { name: "Pending", value: 285, fill: "#f97316", label: "50" },
            { name: "Overdue", value: 180, fill: "#ef4444", label: "" },
          ]}
          period="month"
          onPeriodChange={(period) => console.log("Period changed to:", period)}
          onExport={() => console.log("Export clicked")}
        />
      </Card>
    </div>
  );
}
