"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import { TransactionSummarySection } from "@/components/analytics/TransactionSummarySection";
import { TransactionAnalyticsDashboard } from "@/components/analytics/TransactionAnalyticsDashboard";
import { UserSummaryCard } from "@/components/charts/UserSummaryCard";
import { MeterSummaryCard } from "@/components/charts/MeterSummaryCard";
import { ComplaintsDashboardCard } from "@/components/charts/ComplaintsDashboardCard";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEstateAdminEnergyConsumptionChart } from "@/redux/slice/estate-admin/energy-consumption/estate-admin-energy-consumption";
import { getEstateAdminEstateEnergyUsage } from "@/redux/slice/estate-admin/estate-energy-usage/estate-admin-estate-energy-usage";
import { getEstateAdminUserSummary } from "@/redux/slice/estate-admin/user-analytics/user-analytics";
import {
  selectEstateAdminUserSummaryData,
  selectEstateAdminUserSummaryError,
  selectEstateAdminUserSummaryLoading,
  selectEstateAdminUserSummaryStatus,
} from "@/redux/slice/estate-admin/user-analytics/user-analytics-slice";
import { getEstateAdminComplaintsDashboard } from "@/redux/slice/estate-admin/complaints-dashboard/complaints-dashboard";
import {
  selectEstateAdminComplaintsDashboardData,
  selectEstateAdminComplaintsDashboardError,
  selectEstateAdminComplaintsDashboardLoading,
  selectEstateAdminComplaintsDashboardStatus,
} from "@/redux/slice/estate-admin/complaints-dashboard/complaints-dashboard-slice";
import { getEstateAdminMeterSummary } from "@/redux/slice/estate-admin/meter-summary/meter-summary";
import {
  selectEstateAdminMeterSummaryData,
  selectEstateAdminMeterSummaryError,
  selectEstateAdminMeterSummaryLoading,
  selectEstateAdminMeterSummaryStatus,
} from "@/redux/slice/estate-admin/meter-summary/meter-summary-slice";
import { getEstateAdminTransactionSummary } from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary";
import { selectTransactionSummaryStatus } from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary-slice";
import { getTransactionAnalyticsDashboard } from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics";
import { selectTransactionAnalyticsStatus } from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics-slice";
import { extractEstateIdFromUser, extractEstateNameFromUser } from "@/lib/user-id";
import type { AppDispatch, RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { areSettled, isPending } from "@/lib/async-status";

export default function EstateAdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);

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

  const userSummary = useSelector(selectEstateAdminUserSummaryData);
  const userSummaryLoading = useSelector(selectEstateAdminUserSummaryLoading);
  const userSummaryStatus = useSelector(selectEstateAdminUserSummaryStatus);
  const userSummaryError = useSelector(selectEstateAdminUserSummaryError);

  const complaintsDashboard = useSelector(
    selectEstateAdminComplaintsDashboardData,
  );
  const complaintsDashboardLoading = useSelector(
    selectEstateAdminComplaintsDashboardLoading,
  );
  const complaintsDashboardStatus = useSelector(
    selectEstateAdminComplaintsDashboardStatus,
  );
  const complaintsDashboardError = useSelector(
    selectEstateAdminComplaintsDashboardError,
  );

  const meterSummary = useSelector(selectEstateAdminMeterSummaryData);
  const meterSummaryLoading = useSelector(selectEstateAdminMeterSummaryLoading);
  const meterSummaryStatus = useSelector(selectEstateAdminMeterSummaryStatus);
  const meterSummaryError = useSelector(selectEstateAdminMeterSummaryError);
  const transactionSummaryStatus = useSelector(selectTransactionSummaryStatus);
  const transactionAnalyticsStatus = useSelector(
    selectTransactionAnalyticsStatus,
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        const id = extractEstateIdFromUser(user);
        const name = extractEstateNameFromUser(user) ?? "Estate";
        if (id) {
          setEstateId(id);
          setEstateName(name);
          setInitialLoadDone(false);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    void dispatch(getEstateAdminUserSummary({ estateId }));
    void dispatch(getEstateAdminComplaintsDashboard({ estateId }));
    void dispatch(getEstateAdminMeterSummary({ estateId }));
    void dispatch(getEstateAdminTransactionSummary({ estateId }));
    void dispatch(getTransactionAnalyticsDashboard({ estateId }));
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getEstateAdminEstateEnergyUsage({ estateId, range: usageRange }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      toast.error(message ?? "Failed to load estate energy usage.");
    });
  }, [dispatch, estateId, usageRange]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getEstateAdminEnergyConsumptionChart({
        estateId,
        period: energyPeriod,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      toast.error(message ?? "Failed to load energy consumption chart.");
    });
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
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      toast.error(message ?? "Failed to refresh estate energy usage.");
    } finally {
      setUsageRefreshing(false);
    }
  };

  const handleUserSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getEstateAdminUserSummary({ estateId }));
  };

  const handleComplaintsDashboardRetry = () => {
    if (!estateId) return;
    void dispatch(getEstateAdminComplaintsDashboard({ estateId }));
  };

  const handleMeterSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getEstateAdminMeterSummary({ estateId }));
  };

  const dashboardSettled =
    Boolean(estateId) &&
    areSettled([
      userSummaryStatus,
      meterSummaryStatus,
      complaintsDashboardStatus,
      transactionSummaryStatus,
      transactionAnalyticsStatus,
      estateEnergyUsageStatus,
      energyChartStatus,
    ]);

  useEffect(() => {
    if (dashboardSettled) setInitialLoadDone(true);
  }, [dashboardSettled]);

  const pageLoading =
    bootstrapping || (Boolean(estateId) && !initialLoadDone);

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

        {!bootstrapping && (
          <>
            <TransactionSummarySection estateId={estateId} />
            <UserSummaryCard
              data={userSummary}
              loading={userSummaryLoading}
              error={userSummaryError}
              onRetry={handleUserSummaryRetry}
            />
            <MeterSummaryCard
              data={meterSummary}
              loading={meterSummaryLoading}
              error={meterSummaryError}
              onRetry={handleMeterSummaryRetry}
              estateName={estateName}
            />
            <TransactionAnalyticsDashboard estateId={estateId} />
            <ComplaintsDashboardCard
              data={complaintsDashboard}
              loading={complaintsDashboardLoading}
              error={complaintsDashboardError}
              onRetry={handleComplaintsDashboardRetry}
              estateName={estateName}
            />
          </>
        )}

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
