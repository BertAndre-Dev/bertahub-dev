"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Activity = {
  residentName: string
  visitorName: string
  block: string
  apartment: string
  date: string
  type: string
  clockIn: string
  clockOut: string
  status: "Access Granted" | "Access Denied"
}

const sampleData: Activity[] = Array.from({ length: 10 }).map((_, i) => ({
  residentName: "John Doe",
  visitorName: "John Doe",
  block: "C",
  apartment: "J4",
  date: "12/02/2025",
  type: i === 1 ? "Makeup" : "Delivery",
  clockIn: "11 : 59 AM",
  clockOut: "02 : 59 PM",
  status: i === 1 ? "Access Denied" : "Access Granted",
}))

export default function ActivityLogPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    return sampleData.filter((row) => {
      const matchesSearch =
        search.trim() === "" ||
        [row.residentName, row.visitorName, row.apartment, row.block, row.type]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesType = typeFilter === "all" || row.type === typeFilter
      const matchesStatus = statusFilter === "all" || row.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [search, typeFilter, statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Welcome back! Manage access control in <span className="font-semibold">DEMO ESTATE</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="flex gap-3 flex-wrap">
          <div className="min-w-[180px]">
            <Label>Filter by Date</Label>
            <Input type="date" />
          </div>

          <div className="min-w-[180px]">
            <Label>Filter by Type</Label>
            <Select
              options={[{ label: "All", value: "all" }, { label: "Delivery", value: "Delivery" }, { label: "Makeup", value: "Makeup" }]}
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
            />
          </div>

          <div className="min-w-[180px]">
            <Label>Filter by Status</Label>
            <Select
              options={[{ label: "All", value: "all" }, { label: "Access Granted", value: "Access Granted" }, { label: "Access Denied", value: "Access Denied" }]}
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="min-w-[220px]">
            <Label>Search</Label>
            <Input placeholder="Search resident, visitor, apartment..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
          <CardDescription className="text-sm">Showing {filtered.length} of {sampleData.length} entries</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/20 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Resident Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Visitor Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Block</th>
                  <th className="px-6 py-4 text-left font-semibold">Apartment</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Type</th>
                  <th className="px-6 py-4 text-left font-semibold">Clock In</th>
                  <th className="px-6 py-4 text-left font-semibold">Clock Out</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/10">
                    <td className="px-6 py-4">{row.residentName}</td>
                    <td className="px-6 py-4">{row.visitorName}</td>
                    <td className="px-6 py-4">{row.block}</td>
                    <td className="px-6 py-4">{row.apartment}</td>
                    <td className="px-6 py-4">{row.date}</td>
                    <td className="px-6 py-4">{row.type}</td>
                    <td className="px-6 py-4">{row.clockIn}</td>
                    <td className="px-6 py-4">{row.clockOut}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${row.status === "Access Granted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {sampleData.length} entries</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">&lt;</Button>
              <Button size="sm">1</Button>
              <Button variant="outline" size="sm">&gt;</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
