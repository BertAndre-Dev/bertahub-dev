"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";
import { Lock, TrendingUp } from "lucide-react";

import Loader from "@/components/ui/Loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select as UiSelect } from "@/components/ui/select";
import { FinancialReportBarChart } from "@/components/dashboard/estate-admin/reports/FinancialReportBarChart";
import {
  buildChartSeries,
  keysForCategory,
  type FinancialChartPoint,
} from "@/components/dashboard/estate-admin/reports/financial-report-chart-utils";
import { ReportTable } from "@/components/estate-admin/expense-report/expense-report-table";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  fetchCompanyFinancialReportAnalyticsChart,
  fetchCompanyFinancialReportGenerate,
} from "@/redux/slice/company/financial-report/company-financial-report";
import {
  selectCompanyFinancialReportChartData,
  selectCompanyFinancialReportError,
  selectCompanyFinancialReportLoading,
  setCompanyFinancialReportEstate,
} from "@/redux/slice/company/financial-report/company-financial-report-slice";
import { clearCompanyRevenueChart } from "@/redux/slice/company/revenue-chart/company-revenue-chart-slice";
import { clearCompanyExpenseChart } from "@/redux/slice/company/expense-chart/company-expense-chart-slice";
import type { AppDispatch } from "@/redux/store";
import {
  buildRevenueFilterOptions,
  buildRevenueTableRows,
  type FinancialReportData,
} from "@/lib/financial-report-utils";
import { RevenueChartCard } from "@/components/dashboard/estate-admin/reports/RevenueChartCard";
import { ExpenseChartCard } from "@/components/dashboard/estate-admin/reports/ExpenseChartCard";
import { parseCompanyFromUser } from "@/app/(platform)/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/(platform)/dashboard/company/asset/lib/estate";

type EstateSelectOption = { label: string; value: string };
type RevenueCategory = "all" | "bills" | "vending";
type Granularity = "day" | "month" | "year";

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function formatNaira(n: number): string {
  return `₦${Number(n ?? 0).toLocaleString()}`;
}

function useIsolatedReport(
  estateId: string,
  startDate: string,
  endDate: string,
  dispatch: AppDispatch,
) {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!estateId) return;

    abortRef.current = false;
    setLoading(true);

    dispatch(
      fetchCompanyFinancialReportGenerate({
        estateId,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .then((res: { data?: FinancialReportData }) => {
        const payload = res?.data ?? res;
        if (!abortRef.current) setData(payload as FinancialReportData);
      })
      .catch((err: unknown) => {
        if (!abortRef.current) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
      })
      .finally(() => {
        if (!abortRef.current) setLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  }, [estateId, startDate, endDate, dispatch]);

  return { data, loading };
}

export default function CompanyReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [chartRevenueCategory, setChartRevenueCategory] =
    useState<RevenueCategory>("all");

  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("all");

  const [expensesStartDate, setExpensesStartDate] = useState("");
  const [expensesEndDate, setExpensesEndDate] = useState("");
  const [expensesHeadId, setExpensesHeadId] = useState<string>("all");

  const datePlaceholders = useMemo(() => getDateRangePlaceholders(), []);

  const chartData = useSelector(selectCompanyFinancialReportChartData);
  const chartLoading = useSelector(selectCompanyFinancialReportLoading);
  const error = useSelector(selectCompanyFinancialReportError);

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch (err: unknown) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          const first = { label: options[0].name, value: options[0].id };
          setSelectedEstate(first);
          dispatch(setCompanyFinancialReportEstate(first.value));
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      fetchCompanyFinancialReportAnalyticsChart({
        estateId,
        startDate: toIsoIfPresent(chartStartDate),
        endDate: toIsoIfPresent(chartEndDate),
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [estateId, chartStartDate, chartEndDate, dispatch]);

  const { data: revenueReport } = useIsolatedReport(
    estateId,
    revenueStartDate,
    revenueEndDate,
    dispatch,
  );

  const { data: expensesReport } = useIsolatedReport(
    estateId,
    expensesStartDate,
    expensesEndDate,
    dispatch,
  );

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

  const rawChartPoints = useMemo<FinancialChartPoint[]>(
    () =>
      (chartData ?? []).map((p) => ({
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

  function exportChartCsv() {
    if (!chartSeries.length) return toast.info("Nothing to export yet.");

    const headers = ["date", ...chartKeys.map(String)];
    const body = chartSeries.map((r) =>
      [r.date, ...chartKeys.map((k) => Number((r as any)[k] ?? 0))].join(","),
    );

    const csv = [headers.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company_report_insights_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

  const expensesByHead = expensesReport?.expenses?.byHead ?? [];

  const expensesTableRows = expensesByHead
    .filter((h) => expensesHeadId === "all" || h._id === expensesHeadId)
    .map((h) => ({
      key: h._id,
      label: h.headName,
      amount: h.totalAmount,
    }));

  const revenueTableRows = useMemo(
    () =>
      buildRevenueTableRows(revenueReport?.revenue, revenueFilter),
    [revenueReport?.revenue, revenueFilter],
  );

  const revenueFilterOptions = useMemo(
    () => buildRevenueFilterOptions(revenueReport?.revenue),
    [revenueReport?.revenue],
  );

  const handleEstateChange = (option: EstateSelectOption | null) => {
    setSelectedEstate(option);
    dispatch(setCompanyFinancialReportEstate(option?.value ?? null));
    dispatch(clearCompanyRevenueChart());
    dispatch(clearCompanyExpenseChart());
  };

  return (
    <div className="relative">
      {estatesLoading && <Loader fullScreen label="Loading estates..." />}

      <div
        className={[
          "space-y-6",
          estatesLoading
            ? "pointer-events-none select-none"
            : "",
        ].join(" ")}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Report</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s an overview for estates under{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span>
              {estateId ? (
                <>
                  {" "}
                  —{" "}
                  <span className="text-[18px] font-bold underline uppercase text-black">
                    {estateName}
                  </span>
                </>
              ) : null}
              .
            </p>
          </div>

          <div className="w-48 min-w-[12rem]">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) =>
                handleEstateChange(option as EstateSelectOption | null)
              }
              isSearchable
              isDisabled={!estateOptions.length}
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
              }}
            />
          </div>
        </div>

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : !estateId ? (
          <p className="text-sm text-muted-foreground">
            Select an estate to view financial reports.
          </p>
        ) : (
          <>
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

            <Card className="p-4">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div>
                  <p className="font-heading text-xl font-bold">Insights</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue vs Expense
                  </p>
                </div>

                <div className="flex w-full min-w-0 flex-col gap-2 xl:w-auto xl:flex-row xl:flex-wrap xl:items-center">
                  <DateRangeFilter
                    startId="company-chart-start"
                    endId="company-chart-end"
                    startDate={chartStartDate}
                    endDate={chartEndDate}
                    onStartChange={setChartStartDate}
                    onEndChange={setChartEndDate}
                    startPlaceholder={datePlaceholders.start}
                    endPlaceholder={datePlaceholders.end}
                  />

                  <UiSelect
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

                  <UiSelect
                    value={granularity}
                    onChange={(e) =>
                      setGranularity(e.target.value as Granularity)
                    }
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

              <div className="mt-4">
                <FinancialReportBarChart
                  loading={chartLoading}
                  series={chartSeries}
                  category={chartRevenueCategory}
                />
              </div>
            </Card>

            <RevenueChartCard
              key={`revenue-${estateId}`}
              estateId={estateId}
              variant="company"
            />

            <ExpenseChartCard
              key={`expense-${estateId}`}
              estateId={estateId}
              variant="company"
            />

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
              startDate={revenueStartDate}
              endDate={revenueEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setRevenueStartDate(startDate);
                setRevenueEndDate(endDate);
              }}
              exportFileName="company_revenue_report"
            />

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
              startDate={expensesStartDate}
              endDate={expensesEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setExpensesStartDate(startDate);
                setExpensesEndDate(endDate);
              }}
              exportFileName="company_expenses_report"
            />
          </>
        )}
      </div>
    </div>
  );
}
