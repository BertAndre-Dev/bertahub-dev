"use client"

import { useState } from "react"
import { TrendingUp, Users, FileText, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"



export default function SuperAdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 45000, expenses: 32000 },
    { month: "Feb", revenue: 52000, expenses: 35000 },
    { month: "Mar", revenue: 48000, expenses: 33000 },
    { month: "Apr", revenue: 61000, expenses: 38000 },
    { month: "May", revenue: 55000, expenses: 36000 },
    { month: "Jun", revenue: 67000, expenses: 40000 },
  ]

  const billsData = [
    { name: "Electricity", value: 35, fill: "#3b82f6" },
    { name: "Water", value: 25, fill: "#10b981" },
    { name: "Maintenance", value: 20, fill: "#f59e0b" },
    { name: "Security", value: 20, fill: "#ef4444" },
  ]

  const occupancyData = [
    { month: "Jan", occupied: 85, vacant: 15 },
    { month: "Feb", occupied: 88, vacant: 12 },
    { month: "Mar", occupied: 90, vacant: 10 },
    { month: "Apr", occupied: 92, vacant: 8 },
    { month: "May", occupied: 91, vacant: 9 },
    { month: "Jun", occupied: 93, vacant: 7 },
  ]

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
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your estate overview.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const isPositive = stat.trend === "up"
          return (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
              <p className="font-heading text-2xl font-bold">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold">Revenue vs Expenses</h2>
            <p className="text-sm text-muted-foreground">Last 6 months comparison</p>
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
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Bills Distribution */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold">Bills Distribution</h2>
            <p className="text-sm text-muted-foreground">Current month</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={billsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {billsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {billsData.map((bill, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bill.fill }} />
                  <span className="text-muted-foreground">{bill.name}</span>
                </div>
                <span className="font-medium">{bill.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Occupancy Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">Occupancy Trend</h2>
          <p className="text-sm text-muted-foreground">Unit occupancy over the last 6 months</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={occupancyData}>
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
            <Bar dataKey="occupied" stackId="a" fill="#10b981" />
            <Bar dataKey="vacant" stackId="a" fill="#e5e7eb" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold">Recent Bills</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {[
              { name: "Electricity Bill", amount: "$2,450", status: "Paid", date: "Jun 15" },
              { name: "Water Bill", amount: "$890", status: "Pending", date: "Jun 10" },
              { name: "Maintenance", amount: "$5,200", status: "Paid", date: "Jun 5" },
              { name: "Security Services", amount: "$3,100", status: "Overdue", date: "May 30" },
            ].map((bill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">{bill.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{bill.amount}</p>
                  <p
                    className={`text-xs font-medium ${
                      bill.status === "Paid"
                        ? "text-green-600"
                        : bill.status === "Pending"
                          ? "text-orange-600"
                          : "text-red-600"
                    }`}
                  >
                    {bill.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold">Alerts & Notifications</h2>
            <Button variant="ghost" size="sm">
              Clear All
            </Button>
          </div>
          <div className="space-y-4">
            {[
              { title: "Overdue Payment", message: "Security bill from May 30 is overdue", type: "error" },
              { title: "New Resident", message: "Unit 204 has a new resident - John Smith", type: "info" },
              { title: "Maintenance Alert", message: "Elevator maintenance scheduled for Jun 25", type: "warning" },
              { title: "Payment Received", message: "Payment of $2,450 received from Unit 101", type: "success" },
            ].map((alert, i) => (
              <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
