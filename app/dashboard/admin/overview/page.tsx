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



export default function AdminOverview() {
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
            import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
            import { Button } from "@/components/ui/button"

            // Small presentational components to keep the page component-based
            function StatCard({ icon: Icon, title, value, change, trend, color }: any) {
              const isPositive = trend === "up"
              return (
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {change}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{title}</p>
                  <p className="font-heading text-2xl font-bold">{value}</p>
                </Card>
              )
            }

            function PeriodToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
              return (
                <div className="flex gap-2">
                  {["week", "month", "year"].map((period) => (
                    <Button
                      key={period}
                      variant={value === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => onChange(period)}
                      className="capitalize"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              )
            }

            function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
              return (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-medium">{value}</span>
                </div>
              )
            }

            export default function AdminOverview() {
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
                { name: "Paid", value: 450, fill: "#10B981" },
                { name: "Pending", value: 250, fill: "#FB923C" },
                { name: "Overdue", value: 120, fill: "#EF4444" },
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
                  title: "Total Residents",
                  value: "1400",
                  change: "+5.2%",
                  trend: "up",
                  icon: Users,
                  color: "bg-emerald-100 text-emerald-600",
                },
                {
                  title: "Units",
                  value: "125/550",
                  change: "+5.2%",
                  trend: "up",
                  icon: FileText,
                  color: "bg-amber-100 text-amber-600",
                },
                {
                  title: "Assigned Meters",
                  value: "65",
                  change: "+5.2%",
                  trend: "up",
                  icon: TrendingUp,
                  color: "bg-violet-100 text-violet-600",
                },
                {
                  title: "Pending Bills",
                  value: "25",
                  change: "+5.2%",
                  trend: "up",
                  icon: DollarSign,
                  color: "bg-sky-100 text-sky-600",
                },
              ]

              return (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="font-heading text-3xl font-bold">Overview</h1>
                      <p className="text-muted-foreground mt-1">Welcome back! Here's an overview on <span className="font-semibold">DOE ESTATE</span></p>
                    </div>
                    <PeriodToggle value={selectedPeriod} onChange={setSelectedPeriod} />
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                      <StatCard key={i} icon={s.icon} title={s.title} value={s.value} change={s.change} trend={s.trend} color={s.color} />
                    ))}
                  </div>

                  {/* Bills overview chart */}
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-6 gap-4 flex-col md:flex-row">
                      <div>
                        <h2 className="font-heading text-xl font-bold">Bills Overview</h2>
                        <p className="text-sm text-muted-foreground">This month's comparison</p>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="flex gap-2">
                          <Button variant={selectedPeriod === "week" ? "default" : "outline"} size="sm">Day</Button>
                          <Button variant={selectedPeriod === "month" ? "default" : "outline"} size="sm">Month</Button>
                          <Button variant={selectedPeriod === "year" ? "default" : "outline"} size="sm">Year</Button>
                        </div>
                        <Button variant="outline">Export</Button>
                      </div>
                    </div>

                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={billsData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis type="number" stroke="var(--muted-foreground)" />
                          <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Two-column section: Occupancy donut (left) + Recent Invites (right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <div className="mb-6">
                        <h2 className="font-heading text-xl font-bold">Occupancy Distribution</h2>
                        <p className="text-sm text-muted-foreground">Total residents</p>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 flex items-center justify-center">
                          <ResponsiveContainer width={260} height={260}>
                            <PieChart>
                              <Pie data={[{ name: 'Occupied', value: 64 }, { name: 'Vacant', value: 24 }]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value">
                                <Cell fill="#0B63C6" />
                                <Cell fill="#B8D1F6" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="flex-1">
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/20">
                              <p className="text-muted-foreground">Total residents</p>
                              <p className="text-2xl font-bold">54,765</p>
                            </div>

                            <div className="flex gap-3 mt-4">
                              <div className="rounded-md border px-3 py-2 inline-flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#0B63C6]" />
                                <div className="text-sm">Occupied <span className="ml-2 font-medium">64%</span></div>
                              </div>
                              <div className="rounded-md border px-3 py-2 inline-flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#B8D1F6]" />
                                <div className="text-sm">Vacant <span className="ml-2 font-medium">24%</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-heading text-xl font-bold">Recent Invites</h2>
                        <Button variant="ghost" size="sm">See all</Button>
                      </div>

                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="rounded-xl bg-muted/20 p-4 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Amanda Doe</p>
                              <p className="text-sm text-muted-foreground">Block 26, Apartment J67</p>
                              <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )
            }
