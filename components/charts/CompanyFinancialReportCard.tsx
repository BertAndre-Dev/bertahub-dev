"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  Banknote,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { KpiCard } from "@/app/(platform)/dashboard/super-admin/dashboard/components/kpi-card";
import { cn } from "@/lib/utils";
import type { AppDispatch } from "@/redux/store";
import { getCompanyOverviewFinancialReport } from "@/redux/slice/company/overview-financial-report/overview-financial-report";
import {
  selectFinancialReport,
  selectFinancialReportError,
  selectFinancialReportLoading,
} from "@/redux/slice/company/overview-financial-report/overview-financial-report-slice";
import {
  FINANCIAL_REPORT_CURRENCY_CODE,
  checkByEstateTotalsMismatch,
  formatFinancialReportCurrency,
  formatProfitMarginDisplay,
  formatWalletBalance,
  yearToDateRange,
} from "@/lib/company-overview-financial-report";
import { CompanyFinancialReportByEstateChart } from "@/components/charts/CompanyFinancialReportByEstateChart";
import { CompanyFinancialReportExpensesByHeadChart } from "@/components/charts/CompanyFinancialReportExpensesByHeadChart";

type CompanyFinancialReportCardProps = Readonly<{
  companyId: string | null;
  /** Page-level estate scope (`all` = company-wide). */
  estateId?: string | null;
  className?: string;
}>;

/**
 * Company overview financial report.
 * Estate scope comes from the page filter; date range stays local (YTD default).
 *
 * TODO: revenue.byHead and byEstate[].byHead are empty in current API samples —
 * do not render a revenue-by-head chart until that payload is confirmed.
 */
export function CompanyFinancialReportCard({
  companyId,
  estateId = null,
  className,
}: CompanyFinancialReportCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const report = useSelector(selectFinancialReport);
  const loading = useSelector(selectFinancialReportLoading);
  const error = useSelector(selectFinancialReportError);

  const ytd = useMemo(() => yearToDateRange(), []);
  const [startDate, setStartDate] = useState(ytd.startDate);
  const [endDate, setEndDate] = useState(ytd.endDate);

  const fetchReport = useCallback(() => {
    if (!companyId) return;
    // Page uses `all` for company-wide; this endpoint rejects that string —
    // omit estateId so the API returns the full company report.
    const scopedEstateId =
      estateId && estateId !== "all" ? estateId : undefined;
    void dispatch(
      getCompanyOverviewFinancialReport({
        companyId,
        estateId: scopedEstateId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    );
  }, [dispatch, companyId, estateId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalsMismatch = useMemo(
    () => (report ? checkByEstateTotalsMismatch(report) : false),
    [report],
  );

  const summary = report?.summary;
  const net = Number(summary?.netProfitLoss) || 0;
  const netPositive = net >= 0;

  const showFullError = Boolean(error) && !report && !loading;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Company financial report
            </h2>
            {totalsMismatch ? (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
                title="Sum of byEstate totals does not match summary totals"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Totals mismatch
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {report?.reportPeriod
              ? `${report.reportPeriod.startDate} → ${report.reportPeriod.endDate}`
              : "Year to date"}
            {" · "}
            {FINANCIAL_REPORT_CURRENCY_CODE}
            {loading && !report ? " · Loading…" : null}
          </p>
        </div>
      </div>

      <div className="space-y-5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <DateRangeFilter
            startId="financial-report-start"
            endId="financial-report-end"
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />

          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 w-full gap-1.5"
              onClick={fetchReport}
              disabled={!companyId || loading}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </Button>
          </div>
        </div>

        {showFullError ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
            <p className="font-medium text-foreground">
              Couldn&apos;t load financial report
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error ?? "Something went wrong. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchReport}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading && !summary ? (
                <>
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <KpiSkeleton />
                </>
              ) : (
                <>
                  <KpiCard
                    label="Total revenue"
                    value={formatFinancialReportCurrency(
                      Number(summary?.totalRevenue) || 0,
                    )}
                    icon={Banknote}
                    iconBgClassName="bg-emerald-500/10 text-emerald-700"
                  />
                  <KpiCard
                    label="Total expenses"
                    value={formatFinancialReportCurrency(
                      Number(summary?.totalExpenses) || 0,
                    )}
                    icon={TrendingDown}
                    iconBgClassName="bg-red-500/10 text-red-600"
                  />
                  <KpiCard
                    label="Net profit / loss"
                    value={formatFinancialReportCurrency(net)}
                    icon={netPositive ? TrendingUp : TrendingDown}
                    iconBgClassName={
                      netPositive
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-red-500/10 text-red-600"
                    }
                    valueClassName={
                      netPositive ? "text-emerald-700" : "text-red-600"
                    }
                  />
                  <KpiCard
                    label="Profit margin"
                    value={formatProfitMarginDisplay(summary?.profitMargin)}
                    icon={Percent}
                    iconBgClassName="bg-slate-500/10 text-slate-700"
                  />
                </>
              )}
            </div>

            {report?.wallet ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-black/4 px-3 py-2.5 text-xs text-muted-foreground dark:bg-white/6">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Wallet className="h-3.5 w-3.5" aria-hidden />
                  Wallet
                </span>
                <span>
                  Available{" "}
                  <span className="tabular-nums text-foreground">
                    {formatWalletBalance(report.wallet.availableBalance)}
                  </span>
                </span>
                <span>
                  Withdrawable{" "}
                  <span className="tabular-nums text-foreground">
                    {formatWalletBalance(report.wallet.withdrawableBalance)}
                  </span>
                </span>
                <span>
                  Balance{" "}
                  <span className="tabular-nums text-foreground">
                    {formatWalletBalance(report.wallet.balance)}
                  </span>
                </span>
              </div>
            ) : null}

            {!report && !loading ? (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  No financial data
                </p>
                <p className="text-xs text-muted-foreground">
                  Adjust filters or pick a different period.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CompanyFinancialReportByEstateChart
                  byEstate={report?.byEstate ?? []}
                  loading={loading}
                  error={error}
                  onRetry={fetchReport}
                />
                <CompanyFinancialReportExpensesByHeadChart
                  byHead={report?.expenses.byHead ?? []}
                  estatesIncluded={report?.estatesIncluded ?? []}
                  loading={loading}
                  error={error}
                  onRetry={fetchReport}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border p-4 sm:p-5">
      <div className="mb-3 h-10 w-10 rounded-full bg-muted" />
      <div className="mb-2 h-3 w-24 rounded bg-muted" />
      <div className="h-7 w-32 rounded bg-muted" />
    </div>
  );
}

export default CompanyFinancialReportCard;
