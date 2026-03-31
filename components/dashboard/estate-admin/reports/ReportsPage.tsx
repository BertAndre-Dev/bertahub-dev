"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";

import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFinancialReportAnalyticsChart,
  fetchFinancialReportGenerate,
} from "@/redux/slice/estate-admin/financial-report/financial-report";
import {
  selectFinancialReportChartData,
  selectFinancialReportData,
  selectFinancialReportError,
  selectFinancialReportLoading,
} from "@/redux/slice/estate-admin/financial-report/financial-report-slice";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Table from "@/components/tables/list/page";
import { TrendingUp, Lock, MessageSquareText, MessageCircle } from "lucide-react";

function toInputDate(iso: string): string {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function formatNaira(n: number): string {
  return `₦${Number(n ?? 0).toLocaleString()}`;
}

function normalizeEstate(user: any): { estateId: string; estateName: string } {
  const rawEstateId = user?.estateId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const estateId =
    typeof rawEstateId === "string"
      ? rawEstateId
      : rawEstateId?._id || rawEstateId?.id || "";

  const estateFromId = (rawEstateId as { name?: string } | undefined)?.name ?? "";
  const estateFromObj = (user?.estate as { name?: string } | undefined)?.name ?? "";
  const fallbackEstateName = (user?.estateName as string) ?? "";
  const estateName = estateFromId || estateFromObj || fallbackEstateName || "Estate";
  return { estateId, estateName };
}

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return toInputDate(first.toISOString());
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date().toISOString()));

  const [granularity, setGranularity] = useState<"day" | "month" | "year">(
    "month",
  );
  const [selectedHeadId, setSelectedHeadId] = useState<string>("all");
  const [revenueCategory, setRevenueCategory] = useState<"all" | "bills" | "vending">(
    "all",
  );

  const report = useSelector((s: RootState) => selectFinancialReportData(s));
  const chartData = useSelector((s: RootState) => selectFinancialReportChartData(s));
  const loading = useSelector((s: RootState) => selectFinancialReportLoading(s));
  const error = useSelector((s: RootState) => selectFinancialReportError(s));

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data ?? userRes;
        const { estateId, estateName } = normalizeEstate(user);
        setEstateId(estateId);
        setEstateName(estateName);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;

    const params = {
      estateId,
      startDate: toIsoIfPresent(startDate),
      endDate: toIsoIfPresent(endDate),
    };
    dispatch(fetchFinancialReportGenerate(params))
      .unwrap()
      .catch((e: any) =>
        toast.error(e?.message ?? "Failed to generate financial report."),
      );
    dispatch(fetchFinancialReportAnalyticsChart(params))
      .unwrap()
      .catch((e: any) =>
        toast.error(e?.message ?? "Failed to fetch analytics chart."),
      );
  }, [estateId, startDate, endDate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const expenseHeads = useMemo(() => {
    const list = report?.expenses?.byHead ?? [];
    return [
      { label: "Expense Head", value: "all" },
      ...list.map((h) => ({ label: h.headName, value: h._id })),
    ];
  }, [report?.expenses?.byHead]);

  const filteredExpensesByHead = useMemo(() => {
    const list = report?.expenses?.byHead ?? [];
    if (selectedHeadId === "all") return list;
    return list.filter((x) => x._id === selectedHeadId);
  }, [report?.expenses?.byHead, selectedHeadId]);

  const chartSeries = useMemo(() => {
    // API returns daily points; we optionally bucket them for Month/Year views.
    const points = chartData ?? [];
    if (granularity === "day") return points;

    const map = new Map<string, { date: string; revenue: number; expenses: number }>();
    for (const p of points) {
      const key =
        granularity === "month" ? String(p.date).slice(0, 7) : String(p.date).slice(0, 4);
      const existing = map.get(key) ?? { date: key, revenue: 0, expenses: 0 };
      existing.revenue += Number(p.revenue ?? 0);
      existing.expenses += Number(p.expenses ?? 0);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)) as any;
  }, [chartData, granularity]);

  const totalRevenue = report?.summary?.totalRevenue ?? report?.revenue?.totalRevenue ?? 0;
  const totalExpenses = report?.summary?.totalExpenses ?? report?.expenses?.totalExpenses ?? 0;
  const net = report?.summary?.netProfitLoss ?? totalRevenue - totalExpenses;

  const revenueRows = useMemo(() => {
    const vending = report?.revenue?.vendingRevenue ?? 0;
    const bills = report?.revenue?.billPaymentRevenue ?? 0;
    const gross = report?.revenue?.totalRevenue ?? 0;
    const base = [
      { name: "Bills", amount: bills },
      { name: "Vending", amount: vending },
      { name: "GROSS PROFIT", amount: gross, _rowTone: "green" as const },
    ];
    if (revenueCategory === "all") return base;
    if (revenueCategory === "bills")
      return [base[0], { ...base[2], amount: bills }];
    return [base[1], { ...base[2], amount: vending }];
  }, [report?.revenue]);

  const expensesRows = useMemo(() => {
    const rows = (filteredExpensesByHead ?? []).map((h) => ({
      name: h.headName,
      amount: h.totalAmount,
    }));
    return [
      ...rows,
      { name: "TOTAL EXPENSES", amount: totalExpenses, _rowTone: "red" as const },
      { name: "PROFIT/LOSS", amount: net, _rowTone: "blue" as const },
    ];
  }, [filteredExpensesByHead, totalExpenses, net]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Report</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          {"."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatNaira(totalRevenue), icon: Lock, tone: "bg-[#FEE6D480]" },
          { label: "Total Expenses", value: formatNaira(totalExpenses), icon: TrendingUp, tone: "bg-[#D0DFF280]" },
          { label: "Profit", value: formatNaira(Math.max(0, net)), icon: MessageSquareText, tone: "bg-[#EDE9FE]" },
          { label: "Loss", value: formatNaira(Math.max(0, -net)), icon: MessageCircle, tone: "bg-[#EDE9FE]" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="font-heading text-3xl font-bold mt-2">{c.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${c.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="font-heading text-xl font-bold">Insights</p>
            <p className="text-sm text-muted-foreground">Revenue vs Expense</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="rep-start">
                From
              </label>
              <input
                id="rep-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="rep-end">
                To
              </label>
              <input
                id="rep-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Select
              value={selectedHeadId}
              onChange={(e) => setSelectedHeadId(e.target.value)}
              options={expenseHeads}
              className="w-[200px]"
            />
            <Select
              value={granularity}
              onChange={(e) =>
                setGranularity(e.target.value as "day" | "month" | "year")
              }
              options={[
                { label: "Day", value: "day" },
                { label: "Month", value: "month" },
                { label: "Year", value: "year" },
              ]}
              className="w-[140px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const ok = chartSeries.length > 0;
                if (!ok) return toast.info("Nothing to export yet.");
                const headers = ["date", "revenue", "expenses"];
                const body = chartSeries.map((r: any) =>
                  [r.date, r.revenue ?? 0, r.expenses ?? 0].join(","),
                );
                const csv = [headers.join(","), ...body].join("\r\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `report_insights_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={chartSeries.length === 0}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSeries}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  formatter={(value: any) => formatNaira(Number(value))}
                  labelFormatter={String}
                />
                <Bar dataKey="revenue" fill="#0B5CAB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#A7C5E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground py-3">Loading chart...</p>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={revenueCategory}
                onChange={(e) =>
                  setRevenueCategory(e.target.value as "all" | "bills" | "vending")
                }
                options={[
                  { label: "Category", value: "all" },
                  { label: "Bills", value: "bills" },
                  { label: "Vending", value: "vending" },
                ]}
                className="w-[170px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Table already has a CSV exporter, but we keep the control here to match the design.
                  // Trigger export by using the Table's built-in export via onExportRequest.
                  const id = document.getElementById("rep-revenue-export");
                  id?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                }}
                disabled={revenueRows.length === 0}
              >
                Export
              </Button>
            </div>
          </div>
          <Table
            columns={[
              { key: "name", header: "Revenue" },
              {
                key: "amount",
                header: "Amount (₦)",
                render: (row: any) => (
                  <span className="font-medium">{formatNaira(row.amount)}</span>
                ),
              },
            ]}
            data={revenueRows.map((r: any) => ({
              ...r,
              name:
                r._rowTone === "green" ? (
                  <span className="font-semibold text-emerald-700">{r.name}</span>
                ) : (
                  r.name
                ),
              amount: r.amount,
            }))}
            emptyMessage={loading ? "Loading..." : "No revenue data."}
            showPagination={false}
            enableExport
            exportFileName="revenue"
            onExportRequest={() =>
              revenueRows.map((r: any) => ({
                id: r.name,
                name: r.name,
                amount: r.amount,
              }))
            }
          />
        </Card>

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedHeadId}
                onChange={(e) => setSelectedHeadId(e.target.value)}
                options={expenseHeads}
                className="w-[200px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const ok = expensesRows.length > 0;
                  if (!ok) return;
                  const headers = ["name", "amount"];
                  const body = expensesRows.map((r: any) =>
                    [String(r.name).replaceAll(",", " "), r.amount ?? 0].join(","),
                  );
                  const csv = [headers.join(","), ...body].join("\r\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={expensesRows.length === 0}
              >
                Export
              </Button>
            </div>
          </div>
          <Table
            columns={[
              { key: "name", header: "Expenses" },
              {
                key: "amount",
                header: "Amount (₦)",
                render: (row: any) => (
                  <span className="font-medium">{formatNaira(row.amount)}</span>
                ),
              },
            ]}
            data={expensesRows.map((r: any) => {
              const tone = r._rowTone as "red" | "blue" | undefined;
              let nameNode: React.ReactNode = r.name;
              if (tone === "red") {
                nameNode = (
                  <span className="font-semibold text-red-700">{r.name}</span>
                );
              } else if (tone === "blue") {
                nameNode = (
                  <span className="font-semibold text-blue-700">{r.name}</span>
                );
              }
              return { ...r, name: nameNode };
            })}
            emptyMessage={loading ? "Loading..." : "No expenses data."}
            showPagination={false}
          />
        </Card>
      </div>
    </div>
  );
}

