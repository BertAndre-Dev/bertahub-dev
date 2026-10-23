"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/redux/store";
import { fetchRevenueHeads } from "@/redux/slice/admin/revenue-head/revenue-head";
import { selectRevenueHeads } from "@/redux/slice/admin/revenue-head/revenue-head-slice";
import { fetchCompanyRevenueHeads } from "@/redux/slice/company/revenue-head/company-revenue-head";
import { selectCompanyRevenueHeads } from "@/redux/slice/company/revenue-head/company-revenue-head-slice";
import {
  fetchRevenueChart,
  type RevenueChartPeriod,
} from "@/redux/slice/estate-admin/revenue-chart/revenue-chart";
import {
  selectRevenueChartData,
  selectRevenueChartError,
  selectRevenueChartLoading,
} from "@/redux/slice/estate-admin/revenue-chart/revenue-chart-slice";
import {
  fetchCompanyRevenueChart,
  type CompanyRevenueChartPeriod,
} from "@/redux/slice/company/revenue-chart/company-revenue-chart";
import {
  selectCompanyRevenueChartData,
  selectCompanyRevenueChartError,
  selectCompanyRevenueChartLoading,
} from "@/redux/slice/company/revenue-chart/company-revenue-chart-slice";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { RevenueChartBarChart } from "./RevenueChartBarChart";
import { buildRevenueChartSeries } from "./revenue-chart-series";

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

interface RevenueChartCardProps {
  estateId: string;
  variant?: "estate-admin" | "company";
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (range: { startDate: string; endDate: string }) => void;
  showDateRange?: boolean;
}

export function RevenueChartCard({
  estateId,
  variant = "estate-admin",
  startDate: controlledStartDate,
  endDate: controlledEndDate,
  onDateRangeChange,
  showDateRange = true,
}: Readonly<RevenueChartCardProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const isCompany = variant === "company";
  const idPrefix = isCompany ? "company-" : "";
  const isDateControlled = onDateRangeChange != null;

  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");
  const startDate = isDateControlled
    ? (controlledStartDate ?? "")
    : localStartDate;
  const endDate = isDateControlled ? (controlledEndDate ?? "") : localEndDate;

  function setStartDate(value: string) {
    if (isDateControlled) {
      onDateRangeChange?.({ startDate: value, endDate });
      return;
    }
    setLocalStartDate(value);
  }

  function setEndDate(value: string) {
    if (isDateControlled) {
      onDateRangeChange?.({ startDate, endDate: value });
      return;
    }
    setLocalEndDate(value);
  }
  const [period, setPeriod] = useState<
    RevenueChartPeriod | CompanyRevenueChartPeriod
  >("monthly");
  const [headId, setHeadId] = useState("all");

  const datePlaceholders = useMemo(() => getDateRangePlaceholders(), []);

  const chartData = useSelector((s: RootState) =>
    isCompany ? selectCompanyRevenueChartData(s) : selectRevenueChartData(s),
  );
  const loading = useSelector((s: RootState) =>
    isCompany
      ? selectCompanyRevenueChartLoading(s)
      : selectRevenueChartLoading(s),
  );
  const error = useSelector((s: RootState) =>
    isCompany ? selectCompanyRevenueChartError(s) : selectRevenueChartError(s),
  );
  const revenueHeads = useSelector((s: RootState) =>
    isCompany ? selectCompanyRevenueHeads(s) : selectRevenueHeads(s),
  );

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!estateId) return;
    const fetchHeads = isCompany
      ? dispatch(fetchCompanyRevenueHeads({ estateId, page: 1, limit: 500 }))
      : dispatch(fetchRevenueHeads({ estateId, page: 1, limit: 500 }));
    fetchHeads.catch(() => {});
  }, [estateId, dispatch, isCompany]);

  useEffect(() => {
    if (!estateId) return;
    const params = {
      estateId,
      period,
      startDate: toIsoIfPresent(startDate),
      endDate: toIsoIfPresent(endDate),
      headId: headId !== "all" ? headId : undefined,
    };
    const fetchChart = isCompany
      ? dispatch(fetchCompanyRevenueChart(params))
      : dispatch(fetchRevenueChart(params));
    fetchChart
      .unwrap()
      .catch((e: { message?: string }) =>
        toast.error(e?.message ?? "Failed to fetch revenue chart."),
      );
  }, [estateId, startDate, endDate, period, headId, dispatch, isCompany]);

  const series = useMemo(() => buildRevenueChartSeries(chartData), [chartData]);

  const headOptions = useMemo(
    () => [
      { label: "All Revenue Heads", value: "all" },
      ...revenueHeads.map((h) => ({
        label: h.name,
        value: h.id ?? h._id ?? "",
      })),
    ],
    [revenueHeads],
  );

  function exportCsv() {
    if (!series.length) return toast.info("Nothing to export yet.");

    const singleHead = headId !== "all";
    const segmentKeys = Object.keys(series[0]?.segments ?? {});
    const headers = singleHead
      ? ["label", "value"]
      : ["label", "total", ...segmentKeys];
    const body = series.map((r) =>
      singleHead
        ? [r.label, r.value].join(",")
        : [
            r.label,
            r.value,
            ...segmentKeys.map((k) => r.segments[k] ?? 0),
          ].join(","),
    );

    const csv = [headers.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_chart_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-heading text-xl font-bold">Revenue Chart</p>
          <p className="text-sm text-muted-foreground">
            Vending, bills, and other revenue over time
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center justify-between">
          {showDateRange ? (
            <DateRangeFilter
              startId={`${idPrefix}revenue-chart-start`}
              endId={`${idPrefix}revenue-chart-end`}
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              startPlaceholder={datePlaceholders.start}
              endPlaceholder={datePlaceholders.end}
            />
          ) : null}

          <div className="flex items-center gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as RevenueChartPeriod)}
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
                { label: "Yearly", value: "yearly" },
              ]}
              className="w-[140px] cursor-pointer"
            />

            <Select
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              options={headOptions}
              className="w-[190px] cursor-pointer"
            />

            <Button
              type="button"
              variant="outline"
              onClick={exportCsv}
              disabled={series.length === 0}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <RevenueChartBarChart
          loading={loading}
          series={series}
          singleHead={headId !== "all"}
        />
      </div>
    </Card>
  );
}
