"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  TrendingUp,
  Lock,
  MessageSquareText,
} from "lucide-react";
import { FinancialReportBarChart } from "@/components/dashboard/estate-admin/reports/FinancialReportBarChart";
import {
  buildChartSeries,
  keysForCategory,
  type FinancialChartPoint,
} from "@/components/dashboard/estate-admin/reports/financial-report-chart-utils";
import { ReportTable } from "@/components/estate-admin/expense-report/expense-report-table";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";

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

  const estateFromId =
    (rawEstateId as { name?: string } | undefined)?.name ?? "";
  const estateFromObj =
    (user?.estate as { name?: string } | undefined)?.name ?? "";
  const fallbackEstateName = (user?.estateName as string) ?? "";
  const estateName =
    estateFromId || estateFromObj || fallbackEstateName || "Estate";
  return { estateId, estateName };
}

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const first = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    return toInputDate(first.toISOString());
  });
  const [endDate, setEndDate] = useState(() =>
    toInputDate(new Date().toISOString()),
  );

  const [granularity, setGranularity] = useState<"day" | "month" | "year">(
    "month",
  );
  const [selectedHeadId, setSelectedHeadId] = useState<string>("all");
  const [revenueCategory, setRevenueCategory] = useState<
    "all" | "bills" | "vending"
  >("all");

  const report = useSelector((s: RootState) => selectFinancialReportData(s));
  const chartData = useSelector((s: RootState) =>
    selectFinancialReportChartData(s),
  );
  const loading = useSelector((s: RootState) =>
    selectFinancialReportLoading(s),
  );
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

  const rawChartPoints = useMemo(() => {
    return (chartData ?? []).map((p: any) => ({
      date: String(p.date ?? "").slice(0, 10),
      vending: Number(p.vending ?? 0),
      bills: Number(p.bills ?? 0),
      revenue: Number(p.revenue ?? 0),
      expenses: Number(p.expenses ?? 0),
    })) as FinancialChartPoint[];
  }, [chartData]);

  const chartSeries = useMemo(() => {
    return buildChartSeries(rawChartPoints, granularity);
  }, [rawChartPoints, granularity]);

  const chartKeys = useMemo(
    () => keysForCategory(revenueCategory),
    [revenueCategory],
  );

  const totalRevenue =
    report?.summary?.totalRevenue ?? report?.revenue?.totalRevenue ?? 0;
  const totalExpenses =
    report?.summary?.totalExpenses ?? report?.expenses?.totalExpenses ?? 0;
  const net = report?.summary?.netProfitLoss ?? totalRevenue - totalExpenses;
  const isLoss = net < 0;
  const netLabel = isLoss ? "Loss" : "Profit";
  const netAmount = Math.abs(net);
  const netDisplay = `${isLoss ? "-" : ""}${formatNaira(netAmount)}`;

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
          {
            label: "Total Revenue",
            value: formatNaira(totalRevenue),
            icon: Lock,
            tone: "bg-[#FEE6D480]",
          },
          {
            label: "Total Expenses",
            value: formatNaira(totalExpenses),
            icon: TrendingUp,
            tone: "bg-[#D0DFF280]",
          },
          {
            label: netLabel,
            value: netDisplay,
            icon: MessageSquareText,
            tone: "bg-[#EDE9FE]",
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="font-heading text-3xl font-bold mt-2">
                    {c.value}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl grid place-items-center ${c.tone}`}
                >
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
            {/* From */}
            <div className="flex items-center gap-2">
              <label
                className="text-sm text-muted-foreground"
                htmlFor="rep-start"
              >
                From
              </label>
              <IsoLinkedRangeStart
                id="rep-start"
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                className="cursor-pointer"
              />
            </div>

            {/* To */}
            <div className="flex items-center gap-2">
              <label
                className="text-sm text-muted-foreground"
                htmlFor="rep-end"
              >
                To
              </label>
              <IsoLinkedRangeEnd
                id="rep-end"
                startDate={startDate}
                endDate={endDate}
                onEndChange={setEndDate}
                className="cursor-pointer"
              />
            </div>

            {/* Selects */}
            <Select
              value={selectedHeadId}
              onChange={(e) => setSelectedHeadId(e.target.value)}
              options={expenseHeads}
              className="w-[200px] cursor-pointer"
            />

            <Select
              value={revenueCategory}
              onChange={(e) =>
                setRevenueCategory(
                  e.target.value as "all" | "bills" | "vending",
                )
              }
              options={[
                { label: "Revenue Category", value: "all" },
                { label: "Bills", value: "bills" },
                { label: "Vending", value: "vending" },
              ]}
              className="w-[190px] cursor-pointer"
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
              className="w-[140px] cursor-pointer"
            />

            {/* Export */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const ok = chartSeries.length > 0;
                if (!ok) return toast.info("Nothing to export yet.");

                const headers = ["date", ...chartKeys.map(String)];
                const body = chartSeries.map((r: any) =>
                  [
                    r.date,
                    ...chartKeys.map((k) => Number((r as any)[k] ?? 0)),
                  ].join(","),
                );

                const csv = [headers.join(","), ...body].join("\r\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `report_insights_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();

                URL.revokeObjectURL(url);
              }}
              disabled={chartSeries.length === 0}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <FinancialReportBarChart
            loading={loading}
            series={chartSeries as any}
            category={revenueCategory}
          />
        </div>
      </Card>

      <ReportTable
        columnLabel="Revenue"
        rows={[
          {
            key: "bills",
            label: "Bills",
            amount: report?.revenue?.billPaymentRevenue ?? 0,
          },
          {
            key: "vending",
            label: "Vending",
            amount: report?.revenue?.vendingRevenue ?? 0,
          },
        ].filter((r) => revenueCategory === "all" || r.key === revenueCategory)}
        summaryRows={[
          {
            label: "Gross Profit",
            amount: totalRevenue,
            colorClass: "bg-emerald-100 text-emerald-700",
          },
        ]}
        filterLabel="Category"
        filterOptions={[
          { label: "Category", value: "all" },
          { label: "Bills", value: "bills" },
          { label: "Vending", value: "vending" },
        ]}
        filterValue={revenueCategory}
        onFilterChange={(v) => setRevenueCategory(v as any)}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
        exportFileName="revenue_report"
      />

      <ReportTable
        columnLabel="Expenses"
        rows={(report?.expenses?.byHead ?? []).map((h) => ({
          key: h._id,
          label: h.headName,
          amount: h.totalAmount,
        }))}
        summaryRows={[
          {
            label: "Total Expenses",
            amount: totalExpenses,
            colorClass: "bg-red-100 text-red-700",
          },
          {
            label: `Profit/Loss (${net >= 0 ? "Profit" : "Loss"})`,
            amount: Math.abs(net),
            colorClass: "bg-blue-100 text-blue-700",
          },
        ]}
        filterLabel="Expense Head"
        filterOptions={[
          { label: "All Heads", value: "all" },
          ...(report?.expenses?.byHead ?? []).map((h) => ({
            label: h.headName,
            value: h._id,
          })),
        ]}
        filterValue={selectedHeadId}
        onFilterChange={setSelectedHeadId}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
        exportFileName="expenses_report"
      />
    </div>
  );
}
