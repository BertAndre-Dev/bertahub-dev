"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";

import { BillsSummaryChart } from "@/components/charts/BillsSummaryChart";
import { ComplaintsDashboardCard } from "@/components/charts/ComplaintsDashboardCard";
import { ComplaintsSummaryStatCard } from "@/components/charts/ComplaintsSummaryStatCard";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { MeterSummaryCard } from "@/components/charts/MeterSummaryCard";
import { RoleBreakdownChart } from "@/components/charts/RoleBreakdownChart";
import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import { UserSummaryCard } from "@/components/charts/UserSummaryCard";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getCompanyEnergyConsumptionAddressOptions,
  getCompanyEnergyConsumptionChart,
} from "@/redux/slice/company/energy-consumption/company-energy-consumption";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  getCompanyBillsSummary,
  getCompanyComplaintsDashboard,
  getCompanyComplaintsSummary,
  getCompanyMeterSummary,
  getCompanyUserRoleBreakdown,
  getCompanyUserSummary,
} from "@/redux/slice/company/overview-analytics/company-overview-analytics";
import {
  clearCompanyOverviewAnalytics,
  selectCompanyBillsSummaryData,
  selectCompanyBillsSummaryError,
  selectCompanyBillsSummaryLoading,
  selectCompanyComplaintsDashboardData,
  selectCompanyComplaintsDashboardError,
  selectCompanyComplaintsDashboardLoading,
  selectCompanyComplaintsSummaryData,
  selectCompanyComplaintsSummaryError,
  selectCompanyComplaintsSummaryLoading,
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

type EstateOption = { label: string; value: string };

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

  const selectedEstateId = selectedEstate?.value ?? "";

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

  const billsSummary = useSelector(selectCompanyBillsSummaryData);
  const billsSummaryLoading = useSelector(selectCompanyBillsSummaryLoading);
  const billsSummaryError = useSelector(selectCompanyBillsSummaryError);

  const complaintsSummary = useSelector(selectCompanyComplaintsSummaryData);
  const complaintsSummaryLoading = useSelector(
    selectCompanyComplaintsSummaryLoading,
  );
  const complaintsSummaryError = useSelector(selectCompanyComplaintsSummaryError);

  const complaintsDashboard = useSelector(selectCompanyComplaintsDashboardData);
  const complaintsDashboardLoading = useSelector(
    selectCompanyComplaintsDashboardLoading,
  );
  const complaintsDashboardError = useSelector(
    selectCompanyComplaintsDashboardError,
  );

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
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption =>
              Boolean(x),
            ) ?? [];
        setEstateOptions(options);
        if (options.length > 0) {
          setSelectedEstate((current) => current ?? options[0]);
        }
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
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!selectedEstateId) {
      dispatch(clearCompanyOverviewAnalytics());
      return;
    }
    dispatch(clearCompanyOverviewAnalytics());
    void dispatch(getCompanyUserSummary({ estateId: selectedEstateId }));
    void dispatch(getCompanyUserRoleBreakdown({ estateId: selectedEstateId }));
    void dispatch(getCompanyMeterSummary({ estateId: selectedEstateId }));
    void dispatch(getCompanyBillsSummary({ estateId: selectedEstateId }));
    void dispatch(getCompanyComplaintsSummary({ estateId: selectedEstateId }));
    void dispatch(getCompanyComplaintsDashboard({ estateId: selectedEstateId }));
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

  const handleBillsSummaryRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyBillsSummary({ estateId: selectedEstateId }));
  };

  const handleComplaintsSummaryRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyComplaintsSummary({ estateId: selectedEstateId }));
  };

  const handleComplaintsDashboardRetry = () => {
    if (!selectedEstateId) return;
    void dispatch(getCompanyComplaintsDashboard({ estateId: selectedEstateId }));
  };

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(getCompanyTransactionSummary({ estateId: selectedEstateId })).catch(
      (err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      },
    );
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
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found for this company.";
    if (!selectedEstateId) return "Select an estate to view transactions.";
    return "No transaction data to display.";
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

  const energyEmptyMessage = useMemo(() => {
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found for this company.";
    if (!selectedEstateId) return "Select an estate to view energy data.";
    return "No vending data for this period yet.";
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

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

        <div className="w-48 min-w-[12rem]">
          <Select
            options={estateOptions}
            placeholder="Filter by estate"
            value={selectedEstate}
            onChange={(option) => setSelectedEstate(option)}
            isSearchable
            isDisabled={!estateOptions.length || estatesLoading}
            styles={{
              control: (base) => ({ ...base, cursor: "pointer" }),
              option: (base) => ({ ...base, cursor: "pointer" }),
              dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
              clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ComplaintsSummaryStatCard
          data={complaintsSummary}
          loading={complaintsSummaryLoading || estatesLoading}
          error={complaintsSummaryError}
          onRetry={handleComplaintsSummaryRetry}
        />
      </div>

      <UserSummaryCard
        data={userSummary}
        loading={userSummaryLoading || estatesLoading}
        error={userSummaryError}
        onRetry={handleUserSummaryRetry}
      />

      <MeterSummaryCard
        data={meterSummary}
        loading={meterSummaryLoading || estatesLoading}
        error={meterSummaryError}
        onRetry={handleMeterSummaryRetry}
        estateName={selectedEstateName}
      />

      <ComplaintsDashboardCard
        data={complaintsDashboard}
        loading={complaintsDashboardLoading || estatesLoading}
        error={complaintsDashboardError}
        onRetry={handleComplaintsDashboardRetry}
        estateName={selectedEstateName}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <RoleBreakdownChart
          data={roleBreakdown}
          loading={roleBreakdownLoading || estatesLoading}
          error={roleBreakdownError}
          onRetry={handleRoleBreakdownRetry}
        />
        <BillsSummaryChart
          data={billsSummary}
          loading={billsSummaryLoading || estatesLoading}
          error={billsSummaryError}
          onRetry={handleBillsSummaryRetry}
        />
      </div>

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
