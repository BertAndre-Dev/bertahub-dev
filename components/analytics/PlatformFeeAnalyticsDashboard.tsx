"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import { exportPlatformFeeAnalyticsToCsv } from "@/lib/platform-fee-export";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import {
  fetchAllPlatformFeeList,
  getPlatformFeeAnalytics,
} from "@/redux/slice/super-admin/platform-fees/platform-fees";
import {
  selectPlatformFeeAnalytics,
  selectPlatformFeeError,
  selectPlatformFeePagination,
  selectPlatformFeeStatus,
} from "@/redux/slice/super-admin/platform-fees/platform-fees-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  PlatformFeeFilters,
  type FilterOption,
  type PlatformFeeFilterState,
} from "@/components/analytics/PlatformFeeFilters";
import { PlatformFeeKpiRow } from "@/components/analytics/PlatformFeeKpiRow";
import { PlatformFeeSourceGrid } from "@/components/analytics/PlatformFeeSourceGrid";
import { PlatformFeeSourceChart } from "@/components/analytics/PlatformFeeSourceChart";
import { PlatformFeeTrendChart } from "@/components/analytics/PlatformFeeTrendChart";
import { PlatformFeeList } from "@/components/analytics/PlatformFeeList";

const PAGE_LIMIT = 10;
const FILTER_FETCH_LIMIT = 200;

type PlatformFeeAnalyticsDashboardProps = Readonly<{
  className?: string;
  estateOptions?: ReadonlyArray<FilterOption>;
  companyOptions?: ReadonlyArray<FilterOption>;
  estatesLoading?: boolean;
  companiesLoading?: boolean;
}>;

function toIsoDateUTC(d: Date): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate()),
  );
  return { startDate: toIsoDateUTC(start), endDate: toIsoDateUTC(end) };
}

export function PlatformFeeAnalyticsDashboard({
  className,
  estateOptions: estateOptionsProp,
  companyOptions: companyOptionsProp,
  estatesLoading: estatesLoadingProp,
  companiesLoading: companiesLoadingProp,
}: PlatformFeeAnalyticsDashboardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [filters, setFilters] = useState<PlatformFeeFilterState>({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    estateId: null,
    companyId: null,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_LIMIT);
  const [exporting, setExporting] = useState(false);

  const data = useSelector(selectPlatformFeeAnalytics);
  const pagination = useSelector(selectPlatformFeePagination);
  const status = useSelector(selectPlatformFeeStatus);
  const error = useSelector(selectPlatformFeeError);

  const { estates, estatesStatus } = useSelector((state: RootState) => {
    const estateState = state.estate;
    const list = estateState.allEstates?.data || [];
    return {
      estates: Array.isArray(list) ? list : [],
      estatesStatus: estateState.getAllEstatesState,
    };
  });

  const companies = useSelector(
    (state: RootState) => state.superAdminCompany.list ?? [],
  );
  const companiesStatus = useSelector(
    (state: RootState) => state.superAdminCompany.getListStatus,
  );

  const listsProvided = estateOptionsProp != null && companyOptionsProp != null;

  const fetchedEstateOptions = useMemo<FilterOption[]>(() => {
    const options: FilterOption[] = [];
    for (const estate of estates as Array<{
      id?: string;
      _id?: string;
      name?: string;
    }>) {
      const value = String(estate?.id ?? estate?._id ?? "").trim();
      if (!value) continue;
      options.push({
        label: estate.name?.trim() || "Unnamed estate",
        value,
      });
    }
    return options;
  }, [estates]);
  

  const fetchedCompanyOptions = useMemo<FilterOption[]>(
    () =>
      companies
        .map((company) => {
          const value = String(company?.id ?? company?._id ?? "").trim();
          if (!value) return null;
          return {
            label: company?.name?.trim() || "Unnamed company",
            value,
          };
        })
        .filter((option): option is FilterOption => option !== null),
    [companies],
  );

  const estateOptions = listsProvided
    ? [...estateOptionsProp]
    : fetchedEstateOptions;
  const companyOptions = listsProvided
    ? [...companyOptionsProp]
    : fetchedCompanyOptions;
  const estatesLoading =
    estatesLoadingProp ??
    (isPending(estatesStatus) && fetchedEstateOptions.length === 0);
  const companiesLoading =
    companiesLoadingProp ??
    (isPending(companiesStatus) && fetchedCompanyOptions.length === 0);

  const queryParams = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      estateId: filters.estateId ?? undefined,
      companyId: filters.companyId ?? undefined,
      page,
      limit: pageSize,
    }),
    [filters, page, pageSize],
  );

  useEffect(() => {
    if (listsProvided) return;
    dispatch(getAllEstates({ page: 1, limit: FILTER_FETCH_LIMIT })).catch(
      (err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      },
    );
  }, [dispatch, listsProvided]);

  useEffect(() => {
    if (listsProvided) return;
    dispatch(getCompanies({ page: 1, limit: FILTER_FETCH_LIMIT })).catch(
      (err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      },
    );
  }, [dispatch, listsProvided]);

  useEffect(() => {
    if (!queryParams.startDate || !queryParams.endDate) return;
    void dispatch(getPlatformFeeAnalytics(queryParams));
  }, [dispatch, queryParams]);

  const handleFiltersChange = useCallback((next: PlatformFeeFilterState) => {
    setPage(1);
    setFilters(next);
  }, []);

  const handleRetry = () => {
    if (!queryParams.startDate || !queryParams.endDate) return;
    void dispatch(getPlatformFeeAnalytics(queryParams));
  };

  const exportQuery = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      estateId: filters.estateId ?? undefined,
      companyId: filters.companyId ?? undefined,
    }),
    [filters],
  );

  const loadAllSettledFees = useCallback(async () => {
    const pages = pagination?.pages ?? 1;
    if (pages <= 1) return data?.list ?? [];
    return fetchAllPlatformFeeList(exportQuery);
  }, [data?.list, exportQuery, pagination?.pages]);

  const handleExport = useCallback(async () => {
    if (!data) return;
    setExporting(true);
    try {
      const list = await loadAllSettledFees();
      exportPlatformFeeAnalyticsToCsv(data, list, {
        fileName: "platform_fees",
      });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setExporting(false);
    }
  }, [data, loadAllSettledFees]);

  const loading = isPending(status);
  const showError = Boolean(error) && !loading && !data;
  const showSkeleton = loading || (!data && !showError);
  const showContent = Boolean(data) && !loading;
  const account = data?.account;
  const accountLabel = account?.accountNumber ?? null;

  return (
    <section className={cn("space-y-4 bg-amber-50 p-4 rounded-xl border border-amber-200", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Platform fees
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Platform fee analytics
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-2 self-start"
          onClick={() => void handleExport()}
          disabled={!data || exporting || loading}
          aria-label="Export platform fees CSV"
        >
          <Download className="h-4 w-4" aria-hidden />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <PlatformFeeFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        estateOptions={estateOptions}
        companyOptions={companyOptions}
        estatesLoading={estatesLoading}
        companiesLoading={companiesLoading}
      />

      {accountLabel ? (
        <p className="text-sm text-muted-foreground">
          Settlement account:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {accountLabel}
          </span>
        </p>
      ) : null}

      {showError ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
          <p className="font-medium text-foreground">
            Couldn’t load platform fee analytics
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
        </div>
      ) : null}

      {showSkeleton ? <SectionSkeleton /> : null}

      {showContent && data ? (
        <>
          <PlatformFeeKpiRow cards={data.cards} />
          <PlatformFeeSourceGrid cards={data.cards} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PlatformFeeSourceChart slices={data.pieChart ?? []} />
            <PlatformFeeTrendChart barChart={data.barChart} />
          </div>
          <PlatformFeeList
            items={data.list ?? []}
            pagination={pagination}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onExportRequest={async () => {
              try {
                return await loadAllSettledFees();
              } catch (err: unknown) {
                const message = getApiErrorMessage(err);
                if (message) toast.error(message);
                return [];
              }
            }}
          />
        </>
      ) : null}
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-32 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border bg-muted/50"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[360px] animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-[360px] animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/50" />
    </div>
  );
}

export default PlatformFeeAnalyticsDashboard;
