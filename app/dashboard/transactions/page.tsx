"use client"

import { useState } from "react"
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, MoreVertical, Calendar, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  // Mock transaction data
  const allTransactions = [
    {
      id: "1",
      type: "income",
      description: "Rent Payment - Unit 101",
      amount: 2500,
      date: "2024-06-15",
      reference: "TXN-001",
      status: "Completed",
    },
    {
      id: "2",
      type: "expense",
      description: "Electricity Bill Payment",
      amount: 1200,
      date: "2024-06-14",
      reference: "TXN-002",
      status: "Completed",
    },
    {
      id: "3",
      type: "income",
      description: "Rent Payment - Unit 102",
      amount: 2800,
      date: "2024-06-13",
      reference: "TXN-003",
      status: "Completed",
    },
    {
      id: "4",
      type: "expense",
      description: "Maintenance Services",
      amount: 3500,
      date: "2024-06-12",
      reference: "TXN-004",
      status: "Completed",
    },
    {
      id: "5",
      type: "income",
      description: "Rent Payment - Unit 103",
      amount: 3000,
      date: "2024-06-11",
      reference: "TXN-005",
      status: "Completed",
    },
    {
      id: "6",
      type: "expense",
      description: "Security Services",
      amount: 2100,
      date: "2024-06-10",
      reference: "TXN-006",
      status: "Pending",
    },
  ]

  // Chart data
  const chartData = [
    { month: "Jan", income: 45000, expense: 32000 },
    { month: "Feb", income: 52000, expense: 35000 },
    { month: "Mar", income: 48000, expense: 33000 },
    { month: "Apr", income: 61000, expense: 38000 },
    { month: "May", income: 55000, expense: 36000 },
    { month: "Jun", income: 67000, expense: 40000 },
  ]

  // Filter transactions
  const filteredTransactions = allTransactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "all" || txn.type === selectedType

    return matchesSearch && matchesType
  })

  // Calculate stats
  const stats = {
    totalIncome: allTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    totalExpense: allTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
  }

  stats.balance = stats.totalIncome - stats.totalExpense

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">Track all financial transactions and cash flow</p>
        </div>
        <Button variant="outline" className="w-full md:w-auto bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="font-heading text-2xl font-bold mt-2">${stats.totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expense</p>
              <p className="font-heading text-2xl font-bold mt-2">${stats.totalExpense.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p
                className={`font-heading text-2xl font-bold mt-2 ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${stats.balance.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.balance >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <TrendingUp className={`w-6 h-6 ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">Income vs Expense Trend</h2>
          <p className="text-sm text-muted-foreground">Last 6 months</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by description or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Reference</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{txn.description}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{txn.reference}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {txn.type === "income" ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm capitalize">{txn.type}</span>
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 font-medium text-sm ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}
                  >
                    {txn.type === "income" ? "+" : "-"}${txn.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {txn.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        txn.status === "Completed"
                          ? "bg-green-500/10 text-green-700"
                          : "bg-orange-500/10 text-orange-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {allTransactions.length} transactions
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
