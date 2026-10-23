"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFinancialReportAnalyticsChart,
  fetchFinancialReportGenerate,
} from "@/redux/slice/estate-admin/financial-report/financial-report";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import {
  selectFinancialReportChartData,
  selectFinancialReportError,
} from "@/redux/slice/estate-admin/financial-report/financial-report-slice";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Lock, TrendingUp } from "lucide-react";
import { FinancialReportBarChart } from "@/components/dashboard/estate-admin/reports/FinancialReportBarChart";
import {
  buildChartSeries,
  keysForCategory,
  type FinancialChartPoint,
} from "@/components/dashboard/estate-admin/reports/financial-report-chart-utils";
import { ReportTable } from "@/components/estate-admin/expense-report/expense-report-table";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import {
  buildRevenueFilterOptions,
  buildRevenueTableRows,
  type FinancialReportData,
} from "@/lib/financial-report-utils";
import { RevenueChartCard } from "@/components/dashboard/estate-admin/reports/RevenueChartCard";
import { ExpenseChartCard } from "@/components/dashboard/estate-admin/reports/ExpenseChartCard";
import { fetchRevenueHeads } from "@/redux/slice/admin/revenue-head/revenue-head";
import { selectRevenueHeads } from "@/redux/slice/admin/revenue-head/revenue-head-slice";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function formatNaira(n: number): string {
  return `₦${Number(n ?? 0).toLocaleString()}`;
}

function reportHeadHref(
  kind: "expenses" | "revenue",
  headId: string,
  name: string,
  startDate: string,
  endDate: string,
) {
  const params = new URLSearchParams();
  params.set("name", name);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return `/dashboard/estate-admin/reports/${kind}/${encodeURIComponent(headId)}?${params.toString()}`;
}

function revenueHeadIdByName(
  heads: ReadonlyArray<{ id?: string; _id?: string; name?: string }>,
  name: string,
) {
  const target = name.trim().toLowerCase();
  const match = heads.find(
    (head) => (head.name ?? "").trim().toLowerCase() === target,
  );
  return match?.id || match?._id || "";
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

  const estateName =
    (rawEstateId as { name?: string } | undefined)?.name ||
    (user?.estate as { name?: string } | undefined)?.name ||
    (user?.estateName as string) ||
    "Estate";

  return { estateId, estateName };
}

// ─── Types ───────────────────────────────────────────────────────────────────

type RevenueCategory = "all" | "bills" | "vending";
type Granularity = "day" | "month" | "year";

// ─── Custom Hook: isolated report fetcher ────────────────────────────────────

function useIsolatedReport(
  estateId: string,
  startDate: string,
  endDate: string,
  dispatch: AppDispatch,
  errorLabel: string,
) {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "settled">("idle");

  // Ref to cancel stale requests
  const abortRef = useRef(false);

  useEffect(() => {
    if (!estateId) {
      setStatus("idle");
      return;
    }

    abortRef.current = false;
    setStatus("loading");

    dispatch(
      fetchFinancialReportGenerate({
        estateId,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .then((res: any) => {
        // Thunk resolves to `{ success, message, data }`; the UI expects the `data` payload.
        const payload = res?.data ?? res;
        if (!abortRef.current) setData(payload);
      })
      .catch((e: any) => {
        if (!abortRef.current)
          toast.error(e?.message ?? `Failed to load ${errorLabel}.`);
      })
      .finally(() => {
        if (!abortRef.current) setStatus("settled");
      });

    return () => {
      abortRef.current = true;
    };
  }, [estateId, startDate, endDate, dispatch, errorLabel]);

  const loading = Boolean(estateId) && status !== "settled";
  return { data, loading };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);

  // Chart filters — isolated to the Insights card only
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [chartRevenueCategory, setChartRevenueCategory] =
    useState<RevenueCategory>("all");

  const [revenueFilter, setRevenueFilter] = useState("all");
  const [expensesHeadId, setExpensesHeadId] = useState<string>("all");
  const [sharedStartDate, setSharedStartDate] = useState("");
  const [sharedEndDate, setSharedEndDate] = useState("");

  const datePlaceholders = useMemo(() => getDateRangePlaceholders(), []);

  // Redux selectors — only used for the chart data
  const chartData = useSelector((s: RootState) =>
    selectFinancialReportChartData(s),
  );
  const chartStatus = useSelector((s: RootState) => {
    const report = s.estateAdminFinancialReport as
      | { generateState?: string; analyticsState?: string }
      | undefined;
    return report?.analyticsState ?? report?.generateState ?? "idle";
  });
  const chartLoading = isPending(chartStatus);
  const error = useSelector((s: RootState) => selectFinancialReportError(s));
  const revenueHeads = useSelector((s: RootState) => selectRevenueHeads(s));

  // Resolve current user → estateId
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
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  // Global error toast for chart errors
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(fetchRevenueHeads({ estateId, page: 1, limit: 500 })).catch(
      () => undefined,
    );
  }, [estateId, dispatch]);

  // Chart data fetch — isolated
  useEffect(() => {
    if (!estateId) return;
    dispatch(
      fetchFinancialReportAnalyticsChart({
        estateId,
        startDate: toIsoIfPresent(chartStartDate),
        endDate: toIsoIfPresent(chartEndDate),
      }),
    )
      .unwrap()
      .catch((e: any) =>
        toast.error(e?.message ?? "Failed to fetch analytics chart."),
      );
  }, [estateId, chartStartDate, chartEndDate, dispatch]);

  const { data: revenueReport, loading: revenueLoading } = useIsolatedReport(
    estateId,
    sharedStartDate,
    sharedEndDate,
    dispatch,
    "revenue report",
  );

  const { data: expensesReport, loading: expensesLoading } = useIsolatedReport(
    estateId,
    sharedStartDate,
    sharedEndDate,
    dispatch,
    "expenses report",
  );

  // ── Summary card values come from revenue/expenses reports independently ──
  const totalRevenue =
    revenueReport?.summary?.totalRevenue ??
    revenueReport?.revenue?.totalRevenue ??
    0;

  const totalExpenses =
    expensesReport?.summary?.totalExpenses ??
    expensesReport?.expenses?.totalExpenses ??
    0;

  const net = totalRevenue - totalExpenses;
  const isLoss = net < 0;
  const netLabel = isLoss ? "Loss" : "Profit";
  const netDisplay = `${isLoss ? "-" : ""}${formatNaira(Math.abs(net))}`;

  // ── Chart ─────────────────────────────────────────────────────────────────
  const rawChartPoints = useMemo<FinancialChartPoint[]>(
    () =>
      (chartData ?? []).map((p: any) => ({
        date: String(p.date ?? "").slice(0, 10),
        vending: Number(p.vending ?? 0),
        bills: Number(p.bills ?? 0),
        revenue: Number(p.revenue ?? 0),
        expenses: Number(p.expenses ?? 0),
      })),
    [chartData],
  );

  const chartSeries = useMemo(
    () => buildChartSeries(rawChartPoints, granularity),
    [rawChartPoints, granularity],
  );

  const chartKeys = useMemo(
    () => keysForCategory(chartRevenueCategory),
    [chartRevenueCategory],
  );

  // ── CSV export helper ─────────────────────────────────────────────────────
  function exportChartCsv() {
    if (!chartSeries.length) return toast.info("Nothing to export yet.");

    const headers = ["date", ...chartKeys.map(String)];
    const body = chartSeries.map((r: any) =>
      [r.date, ...chartKeys.map((k) => Number((r as any)[k] ?? 0))].join(","),
    );

    const csv = [headers.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_insights_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Summary cards config ──────────────────────────────────────────────────
  const summaryCards = [
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
    },
  ] as const;

  // ── Expenses table rows (filtered by head) ────────────────────────────────
  const expensesByHead = expensesReport?.expenses?.byHead ?? [];

  const expensesTableRows = expensesByHead
    .filter((h) => expensesHeadId === "all" || h._id === expensesHeadId)
    .map((h) => ({
      key: h._id,
      label: h.headName,
      amount: h.totalAmount,
      href: h._id
        ? reportHeadHref(
            "expenses",
            h._id,
            h.headName,
            sharedStartDate,
            sharedEndDate,
          )
        : undefined,
    }));

  const revenueTableRows = useMemo(
    () =>
      buildRevenueTableRows(revenueReport?.revenue, revenueFilter).map(
        (row) => {
          const headId =
            row.headId || revenueHeadIdByName(revenueHeads, row.label);
          if (!headId) return row;
          return {
            ...row,
            href: reportHeadHref(
              "revenue",
              headId,
              row.label,
              sharedStartDate,
              sharedEndDate,
            ),
          };
        },
      ),
    [
      revenueReport?.revenue,
      revenueFilter,
      revenueHeads,
      sharedStartDate,
      sharedEndDate,
    ],
  );

  const revenueFilterOptions = useMemo(
    () => buildRevenueFilterOptions(revenueReport?.revenue),
    [revenueReport?.revenue],
  );

  const pageLoading =
    bootstrapping ||
    (!!estateId && (revenueLoading || expensesLoading || chartLoading));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading reports..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      {/* Page header */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((c) => {
          const Icon = "icon" in c ? c.icon : undefined;
          const hasDecoration = "icon" in c || "tone" in c;

          return (
            <Card key={c.label} className="p-6">
              <div
                className={`flex items-start gap-3 ${hasDecoration ? "justify-between" : ""}`}
              >
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="font-heading text-3xl font-bold mt-2">
                    {c.value}
                  </p>
                </div>

                {hasDecoration && (
                  <div
                    className={`h-12 w-12 rounded-xl grid place-items-center ${"tone" in c ? c.tone : ""}`}
                  >
                    {Icon && <Icon className="h-6 w-6" />}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Insights chart — chart filters are fully isolated here */}
      <Card className="p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div>
            <p className="font-heading text-xl font-bold">Insights</p>
            <p className="text-sm text-muted-foreground">Revenue vs Expense</p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 xl:w-auto xl:flex-row xl:flex-wrap xl:items-center">
            <DateRangeFilter
              startId="chart-start"
              endId="chart-end"
              startDate={chartStartDate}
              endDate={chartEndDate}
              onStartChange={setChartStartDate}
              onEndChange={setChartEndDate}
              startPlaceholder={datePlaceholders.start}
              endPlaceholder={datePlaceholders.end}
            />

            <div className="flex items-center gap-2 ">
            <Select
              value={chartRevenueCategory}
              onChange={(e) =>
                setChartRevenueCategory(e.target.value as RevenueCategory)
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
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              options={[
                { label: "Day", value: "day" },
                { label: "Month", value: "month" },
                { label: "Year", value: "year" },
              ]}
              className="w-[140px] cursor-pointer"
            />

            <Button
              type="button"
              variant="outline"
              onClick={exportChartCsv}
              disabled={chartSeries.length === 0}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Export
            </Button>
            </div>

          </div>
        </div>

        <div className="mt-4">
          <FinancialReportBarChart
            loading={chartLoading}
            series={chartSeries as any}
            category={chartRevenueCategory}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <DateRangeFilter
          startId="reports-shared-start"
          endId="reports-shared-end"
          startDate={sharedStartDate}
          endDate={sharedEndDate}
          onStartChange={setSharedStartDate}
          onEndChange={setSharedEndDate}
          startPlaceholder={datePlaceholders.start}
          endPlaceholder={datePlaceholders.end}
        />
      </div>

      {estateId ? (
        <RevenueChartCard
          estateId={estateId}
          startDate={sharedStartDate}
          endDate={sharedEndDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setSharedStartDate(startDate);
            setSharedEndDate(endDate);
          }}
          showDateRange={false}
        />
      ) : null}

      {estateId ? (
        <ExpenseChartCard
          estateId={estateId}
          startDate={sharedStartDate}
          endDate={sharedEndDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setSharedStartDate(startDate);
            setSharedEndDate(endDate);
          }}
          showDateRange={false}
        />
      ) : null}

      <ReportTable
        columnLabel="Revenue"
        rows={revenueTableRows}
        summaryRows={[
          {
            label: "Total Revenue",
            amount:
              revenueReport?.summary?.totalRevenue ??
              revenueReport?.revenue?.totalRevenue ??
              0,
            colorClass: "bg-orange-100 text-orange-700",
          },
        ]}
        filterLabel="Category"
        filterOptions={revenueFilterOptions}
        filterValue={revenueFilter}
        onFilterChange={setRevenueFilter}
        startDate={sharedStartDate}
        endDate={sharedEndDate}
        onDateRangeChange={({ startDate, endDate }) => {
          setSharedStartDate(startDate);
          setSharedEndDate(endDate);
        }}
        showDateRange={false}
        exportFileName="revenue_report"
      />

      {/* Expenses table — expenses filters are fully isolated here */}
      <ReportTable
        columnLabel="Expenses"
        rows={expensesTableRows}
        summaryRows={[
          {
            label: "Total Expenses",
            amount:
              expensesReport?.summary?.totalExpenses ??
              expensesReport?.expenses?.totalExpenses ??
              0,
            colorClass: "bg-blue-100 text-blue-700",
          },
          {
            label: `${net >= 0 ? "Profit" : "Loss"}`,
            amount: Math.abs(net),
            colorClass:
              net >= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700",
          },
        ]}
        filterLabel="Expense Head"
        filterOptions={[
          { label: "All Heads", value: "all" },
          ...expensesByHead.map((h) => ({
            label: h.headName,
            value: h._id,
          })),
        ]}
        filterValue={expensesHeadId}
        onFilterChange={setExpensesHeadId}
        startDate={sharedStartDate}
        endDate={sharedEndDate}
        onDateRangeChange={({ startDate, endDate }) => {
          setSharedStartDate(startDate);
          setSharedEndDate(endDate);
        }}
        showDateRange={false}
        exportFileName="expenses_report"
      />
      </div>
    </div>
  );
}
