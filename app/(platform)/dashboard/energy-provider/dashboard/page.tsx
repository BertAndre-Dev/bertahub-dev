"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { extractEstateIdFromUser, extractEstateNameFromUser } from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEstateAdminEnergyConsumptionChart } from "@/redux/slice/estate-admin/energy-consumption/estate-admin-energy-consumption";
import { getEstateAdminEstateEnergyUsage } from "@/redux/slice/estate-admin/estate-energy-usage/estate-admin-estate-energy-usage";
import { getEstateAdminTransactionSummary } from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary";
import type { AppDispatch, RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";

export default function EnergyProviderDashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);

  const { transactionSummary, transactionSummaryStatus } = useSelector(
    (state: RootState) => ({
      transactionSummary: state.estateAdminTransactionSummary.summary,
      transactionSummaryStatus: state.estateAdminTransactionSummary.status,
    }),
  );
  const transactionSummaryLoading = isPending(transactionSummaryStatus);

  const { energyConsumptionChart, energyChartStatus } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.estateAdminEnergyConsumption.chart,
      energyChartStatus: state.estateAdminEnergyConsumption.chartStatus,
    }),
  );
  const energyChartLoading = isPending(energyChartStatus);

  const {
    estateEnergyUsage,
    estateEnergyUsageStatus,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.estateAdminEstateEnergyUsage.usage,
    estateEnergyUsageStatus: state.estateAdminEstateEnergyUsage.status,
    estateEnergyUsageProgress: state.estateAdminEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.estateAdminEstateEnergyUsage.message,
    estateEnergyUsageError: state.estateAdminEstateEnergyUsage.error,
  }));
  const estateEnergyUsageLoading = isPending(estateEnergyUsageStatus);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = (userRes?.data ?? userRes) as Record<string, unknown>;
        const id = extractEstateIdFromUser(user);
        if (!id) {
          toast.error("No estate assigned to your account.");
          return;
        }
        setEstateId(id);
        setEstateName(extractEstateNameFromUser(user) ?? "Estate");
      } catch {
        toast.error("Failed to load account information.");
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateAdminTransactionSummary({ estateId })).catch(() =>
      toast.error("Failed to load transaction summary."),
    );
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getEstateAdminEstateEnergyUsage({ estateId, range: usageRange }),
    ).catch(() => toast.error("Failed to load estate energy usage."));
  }, [dispatch, estateId, usageRange]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getEstateAdminEnergyConsumptionChart({
        estateId,
        period: energyPeriod,
      }),
    ).catch(() => toast.error("Failed to load energy consumption chart."));
  }, [dispatch, estateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!estateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getEstateAdminEstateEnergyUsage({
          estateId,
          range: usageRange,
          refresh: true,
        }),
      ).unwrap();
    } catch {
      toast.error("Failed to refresh estate energy usage.");
    } finally {
      setUsageRefreshing(false);
    }
  };

  const pageLoading =
    bootstrapping ||
    (!!estateId && (estateEnergyUsageLoading || energyChartLoading));

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading dashboard..." />}

      <div
        className={[
          "space-y-8",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of{" "}
          <span className="font-bold uppercase">{estateName}</span>
        </p>
      </div>

      <TransactionSummaryCard
        data={transactionSummary}
        loading={transactionSummaryLoading}
        emptyMessage={
          !estateId
            ? "No estate linked to your account."
            : "No transaction data to display."
        }
      />

      <div className="space-y-6">
        <EstatePowerUsageSection
          data={estateEnergyUsage}
          loading={estateEnergyUsageLoading}
          progress={estateEnergyUsageProgress}
          range={usageRange}
          onRangeChange={setUsageRange}
          onRefresh={handleRefreshUsage}
          refreshing={usageRefreshing}
          emptyMessage={
            estateEnergyUsageError ?? estateEnergyUsageMessage ?? undefined
          }
        />
        <EnergyConsumptionOverTimeCard
          data={energyConsumptionChart}
          loading={energyChartLoading}
          period={energyPeriod}
          onPeriodChange={setEnergyPeriod}
          emptyMessage={
            !estateId
              ? "No estate linked to your account."
              : "No vending data for this period yet."
          }
        />
      </div>
      </div>
    </div>
  );
}
