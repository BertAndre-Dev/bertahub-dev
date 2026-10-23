"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";

import { CompanyFinancialReportCard } from "@/components/charts/CompanyFinancialReportCard";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { MeterSummaryCard } from "@/components/charts/MeterSummaryCard";
import { RoleBreakdownChart } from "@/components/charts/RoleBreakdownChart";
import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import { UserSummaryCard } from "@/components/charts/UserSummaryCard";
import { parseCompanyFromUser } from "@/app/(platform)/dashboard/company/lib/company";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getCompanyEnergyConsumptionAddressOptions,
  getCompanyEnergyConsumptionChart,
} from "@/redux/slice/company/energy-consumption/company-energy-consumption";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  getCompanyMeterSummary,
  getCompanyUserRoleBreakdown,
  getCompanyUserSummary,
} from "@/redux/slice/company/overview-analytics/company-overview-analytics";
import {
  clearCompanyOverviewAnalytics,
  selectCompanyMeterSummaryData,
  selectCompanyMeterSummaryError,
  selectCompanyMeterSummaryLoading,
  selectCompanyRoleBreakdownData,
  selectCompanyRoleBreakdownError,
  selectCompanyRoleBreakdownLoading,
  selectCompanyUserSummaryData,
  selectCompanyUserSummaryError,
  selectCompanyUserSummaryLoading,
} from "@/redux/slice/company/overview-analytics/company-overview-analytics-slice";
import { getCompanyTransactionSummary } from "@/redux/slice/company/transaction-summary/company-transaction-summary";
import type { AppDispatch, RootState } from "@/redux/store";

type EstateOption = {
  label: string;
  value: string;
  /** Company-wide scope (`estateId=all`) — styled differently from estates. */
  isCompanyWide?: boolean;
};

const COMPANY_WIDE_ESTATE_ID = "all";

export default function CompanyOverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Company");
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [selectedAddressId, setSelectedAddressId] = useState("all");

  const companyWideOption = useMemo<EstateOption>(
    () => ({
      label: companyName,
      value: COMPANY_WIDE_ESTATE_ID,
      isCompanyWide: true,
    }),
    [companyName],
  );

  const selectOptions = useMemo(
    () => [companyWideOption, ...estateOptions],
    [companyWideOption, estateOptions],
  );

  const selectedEstateId = selectedEstate?.value ?? "";
  const isCompanyWide = selectedEstate?.isCompanyWide === true;

  const { transactionSummary, transactionSummaryLoading } = useSelector(
    (state: RootState) => ({
      transactionSummary: state.companyTransactionSummary.summary,
      transactionSummaryLoading:
        state.companyTransactionSummary.status === "isLoading",
    }),
  );

  const {
    energyConsumptionChart,
    energyAddressOptions,
    energyChartLoading,
    energyAddressOptionsLoading,
  } = useSelector((state: RootState) => ({
    energyConsumptionChart: state.companyEnergyConsumption.chart,
    energyAddressOptions: state.companyEnergyConsumption.addressOptions,
    energyChartLoading:
      state.companyEnergyConsumption.chartStatus === "isLoading",
    energyAddressOptionsLoading:
      state.companyEnergyConsumption.addressOptionsStatus === "isLoading",
  }));

  const userSummary = useSelector(selectCompanyUserSummaryData);
  const userSummaryLoading = useSelector(selectCompanyUserSummaryLoading);
  const userSummaryError = useSelector(selectCompanyUserSummaryError);

  const roleBreakdown = useSelector(selectCompanyRoleBreakdownData);
  const roleBreakdownLoading = useSelector(selectCompanyRoleBreakdownLoading);
  const roleBreakdownError = useSelector(selectCompanyRoleBreakdownError);

  const meterSummary = useSelector(selectCompanyMeterSummaryData);
  const meterSummaryLoading = useSelector(selectCompanyMeterSummaryLoading);
  const meterSummaryError = useSelector(selectCompanyMeterSummaryError);

  const selectedEstateName = selectedEstate?.label ?? "Estate";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company?.id) {
          toast.error("No company ID found for this user.");
          return;
        }
        setCompanyId(company.id);
        setCompanyName(company.name);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  // Default (and keep in sync) the company-wide option once the company name is known.
  useEffect(() => {
    setSelectedEstate((current) => {
      if (!current || current.isCompanyWide) return companyWideOption;
      return current;
    });
  }, [companyWideOption]);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value || value === COMPANY_WIDE_ESTATE_ID) return null;
              return {
                label: e?.name ?? "Unnamed estate",
                value,
                isCompanyWide: false,
              };
            })
            .filter((x: EstateOption | null): x is EstateOption =>
              Boolean(x),
            ) ?? [];
        setEstateOptions(options);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setEstateOptions([]);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch, companyId]);

  useEffect(() => {
    if (!selectedEstateId) {
      dispatch(clearCompanyOverviewAnalytics());
      return;
    }
    dispatch(clearCompanyOverviewAnalytics());
    void dispatch(getCompanyUserSummary({ estateId: selectedEstateId }));
    void dispatch(getCompanyUserRoleBreakdown({ estateId: selectedEstateId }));
    void dispatch(getCompanyMeterSummary({ estateId: selectedEstateId }));
  }, [dispatch, selectedEstateId]);

  const handleUserSummaryRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyUserSummary({ estateId: selectedEstateId }));
  };

  const handleRoleBreakdownRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyUserRoleBreakdown({ estateId: selectedEstateId }));
  };

  const handleMeterSummaryRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyMeterSummary({ estateId: selectedEstateId }));
  };

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getCompanyTransactionSummary({ estateId: selectedEstateId }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, selectedEstateId]);

  useEffect(() => {
    if (!selectedEstateId) return;
    setSelectedAddressId("all");
    dispatch(
      getCompanyEnergyConsumptionAddressOptions({ estateId: selectedEstateId }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, selectedEstateId]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getCompanyEnergyConsumptionChart({
        estateId: selectedEstateId,
        period: energyPeriod,
        addressId: selectedAddressId,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, selectedEstateId, energyPeriod, selectedAddressId]);

  const transactionEmptyMessage = useMemo(() => {
    if (!selectedEstateId) return "Select a scope to view transactions.";
    if (estatesLoading && !isCompanyWide) return "Loading estates…";
    return "No transaction data to display.";
  }, [estatesLoading, isCompanyWide, selectedEstateId]);

  const energyEmptyMessage = useMemo(() => {
    if (!selectedEstateId) return "Select a scope to view energy data.";
    if (estatesLoading && !isCompanyWide) return "Loading estates…";
    return "No vending data for this period yet.";
  }, [estatesLoading, isCompanyWide, selectedEstateId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-heading text-3xl font-bold">Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s an overview for{" "}
            <span className="text-[18px] font-bold uppercase text-black underline">
              {companyName}
            </span>
            .
          </p>
        </div>

        <div className="w-56 min-w-56">
          <Select<EstateOption>
            options={selectOptions}
            placeholder="Filter by estate"
            value={selectedEstate}
            onChange={(option) => setSelectedEstate(option)}
            isSearchable
            isDisabled={!companyId || (estatesLoading && !selectedEstate)}
            formatOptionLabel={(option) =>
              option.isCompanyWide ? (
                <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wide text-[#007a4d]">
                  <span
                    className="rounded bg-[#007a4d]/12 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-[#007a4d]"
                    aria-hidden
                  >
                    Company
                  </span>
                  {option.label}
                </span>
              ) : (
                <span className="text-foreground">{option.label}</span>
              )
            }
            styles={{
              control: (base) => ({ ...base, cursor: "pointer" }),
              option: (base, state) => {
                if (!state.data.isCompanyWide) {
                  return { ...base, cursor: "pointer" };
                }
                let backgroundColor = base.backgroundColor;
                if (state.isFocused) backgroundColor = "rgba(0, 122, 77, 0.08)";
                else if (state.isSelected) {
                  backgroundColor = "rgba(0, 122, 77, 0.12)";
                }
                return {
                  ...base,
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#007a4d",
                  backgroundColor,
                };
              },
              singleValue: (base, state) =>
                state.data.isCompanyWide
                  ? {
                      ...base,
                      fontWeight: 700,
                      color: "#007a4d",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.02em",
                    }
                  : base,
              dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
              clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
            }}
          />
        </div>
      </div>

      <CompanyFinancialReportCard
        companyId={companyId}
        estateId={selectedEstateId || null}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <UserSummaryCard
          data={userSummary}
          loading={userSummaryLoading || estatesLoading}
          error={userSummaryError}
          onRetry={handleUserSummaryRetry}
        />

        <RoleBreakdownChart
          data={roleBreakdown}
          loading={roleBreakdownLoading || estatesLoading}
          error={roleBreakdownError}
          onRetry={handleRoleBreakdownRetry}
        />
      </div>

      <MeterSummaryCard
        data={meterSummary}
        loading={meterSummaryLoading || estatesLoading}
        error={meterSummaryError}
        onRetry={handleMeterSummaryRetry}
        estateName={selectedEstateName}
      />

      <TransactionSummaryCard
        data={transactionSummary}
        loading={transactionSummaryLoading || estatesLoading}
        emptyMessage={transactionEmptyMessage}
      />

      <EnergyConsumptionOverTimeCard
        data={energyConsumptionChart}
        loading={energyChartLoading}
        period={energyPeriod}
        onPeriodChange={setEnergyPeriod}
        showAddressFilter
        addressOptions={energyAddressOptions}
        addressValue={selectedAddressId}
        onAddressChange={setSelectedAddressId}
        addressFilterLabel="Address"
        addressFilterLoading={energyAddressOptionsLoading}
        emptyMessage={energyEmptyMessage}
      />
    </div>
  );
}
