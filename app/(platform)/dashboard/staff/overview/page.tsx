"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { UserSummaryCard } from "@/components/charts/UserSummaryCard";
import { RoleBreakdownChart } from "@/components/charts/RoleBreakdownChart";
import { MeterSummaryCard } from "@/components/charts/MeterSummaryCard";
import { BillsSummaryChart } from "@/components/charts/BillsSummaryChart";
import { ComplaintsSummaryStatCard } from "@/components/charts/ComplaintsSummaryStatCard";
import { ComplaintsDashboardCard } from "@/components/charts/ComplaintsDashboardCard";
import Loader from "@/components/ui/Loader";
import { useOverviewChartAccess } from "@/hooks/use-overview-chart-access";
import { areSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getUserRoleBreakdown,
  getUserSummary,
} from "@/redux/slice/staff/user-analytics/user-analytics";
import {
  selectRoleBreakdownData,
  selectRoleBreakdownError,
  selectRoleBreakdownLoading,
  selectRoleBreakdownStatus,
  selectUserSummaryData,
  selectUserSummaryError,
  selectUserSummaryLoading,
  selectUserSummaryStatus,
} from "@/redux/slice/staff/user-analytics/user-analytics-slice";
import { getMeterSummary } from "@/redux/slice/staff/meter-summary/meter-summary";
import {
  selectMeterSummaryData,
  selectMeterSummaryError,
  selectMeterSummaryLoading,
  selectMeterSummaryStatus,
} from "@/redux/slice/staff/meter-summary/meter-summary-slice";
import { getBillsSummary } from "@/redux/slice/staff/bills-summary/bills-summary";
import {
  selectBillsSummaryData,
  selectBillsSummaryError,
  selectBillsSummaryLoading,
  selectBillsSummaryStatus,
} from "@/redux/slice/staff/bills-summary/bills-summary-slice";
import { getComplaintsSummary } from "@/redux/slice/staff/complaints-summary/complaints-summary";
import {
  selectComplaintsSummaryData,
  selectComplaintsSummaryError,
  selectComplaintsSummaryLoading,
  selectComplaintsSummaryStatus,
} from "@/redux/slice/staff/complaints-summary/complaints-summary-slice";
import { getComplaintsDashboard } from "@/redux/slice/staff/complaints-dashboard/complaints-dashboard";
import {
  selectComplaintsDashboardData,
  selectComplaintsDashboardError,
  selectComplaintsDashboardLoading,
  selectComplaintsDashboardStatus,
} from "@/redux/slice/staff/complaints-dashboard/complaints-dashboard-slice";
import type { AppDispatch } from "@/redux/store";

export default function StaffOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [resolvingEstate, setResolvingEstate] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const {
    modulesReady,
    showUserSummary,
    showRoleBreakdown,
    showMeterSummary,
    showBillsSummary,
    showComplaintsSummary,
    showComplaintsDashboard,
  } = useOverviewChartAccess();

  const userSummary = useSelector(selectUserSummaryData);
  const userSummaryLoading = useSelector(selectUserSummaryLoading);
  const userSummaryStatus = useSelector(selectUserSummaryStatus);
  const userSummaryError = useSelector(selectUserSummaryError);

  const roleBreakdown = useSelector(selectRoleBreakdownData);
  const roleBreakdownLoading = useSelector(selectRoleBreakdownLoading);
  const roleBreakdownStatus = useSelector(selectRoleBreakdownStatus);
  const roleBreakdownError = useSelector(selectRoleBreakdownError);

  const meterSummary = useSelector(selectMeterSummaryData);
  const meterSummaryLoading = useSelector(selectMeterSummaryLoading);
  const meterSummaryStatus = useSelector(selectMeterSummaryStatus);
  const meterSummaryError = useSelector(selectMeterSummaryError);

  const billsSummary = useSelector(selectBillsSummaryData);
  const billsSummaryLoading = useSelector(selectBillsSummaryLoading);
  const billsSummaryStatus = useSelector(selectBillsSummaryStatus);
  const billsSummaryError = useSelector(selectBillsSummaryError);

  const complaintsSummary = useSelector(selectComplaintsSummaryData);
  const complaintsSummaryLoading = useSelector(selectComplaintsSummaryLoading);
  const complaintsSummaryStatus = useSelector(selectComplaintsSummaryStatus);
  const complaintsSummaryError = useSelector(selectComplaintsSummaryError);

  const complaintsDashboard = useSelector(selectComplaintsDashboardData);
  const complaintsDashboardLoading = useSelector(
    selectComplaintsDashboardLoading,
  );
  const complaintsDashboardStatus = useSelector(
    selectComplaintsDashboardStatus,
  );
  const complaintsDashboardError = useSelector(selectComplaintsDashboardError);

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
        setResolvingEstate(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    if (showUserSummary) void dispatch(getUserSummary({ estateId }));
    if (showRoleBreakdown) void dispatch(getUserRoleBreakdown({ estateId }));
  }, [dispatch, estateId, showUserSummary, showRoleBreakdown]);

  useEffect(() => {
    if (!estateId || !modulesReady) return;
    if (showMeterSummary) void dispatch(getMeterSummary({ estateId }));
    if (showBillsSummary) void dispatch(getBillsSummary({ estateId }));
    if (showComplaintsSummary) void dispatch(getComplaintsSummary({ estateId }));
    if (showComplaintsDashboard) {
      void dispatch(getComplaintsDashboard({ estateId }));
    }
  }, [
    dispatch,
    estateId,
    modulesReady,
    showMeterSummary,
    showBillsSummary,
    showComplaintsSummary,
    showComplaintsDashboard,
  ]);

  const handleUserSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getUserSummary({ estateId }));
  };

  const handleRoleBreakdownRetry = () => {
    if (!estateId) return;
    void dispatch(getUserRoleBreakdown({ estateId }));
  };

  const handleMeterSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getMeterSummary({ estateId }));
  };

  const handleBillsSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getBillsSummary({ estateId }));
  };

  const handleComplaintsSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getComplaintsSummary({ estateId }));
  };

  const handleComplaintsDashboardRetry = () => {
    if (!estateId) return;
    void dispatch(getComplaintsDashboard({ estateId }));
  };

  const enabledStatuses = [
    ...(showUserSummary ? [userSummaryStatus] : []),
    ...(showRoleBreakdown ? [roleBreakdownStatus] : []),
    ...(modulesReady && showMeterSummary ? [meterSummaryStatus] : []),
    ...(modulesReady && showBillsSummary ? [billsSummaryStatus] : []),
    ...(modulesReady && showComplaintsSummary
      ? [complaintsSummaryStatus]
      : []),
    ...(modulesReady && showComplaintsDashboard
      ? [complaintsDashboardStatus]
      : []),
  ];

  const hasVisibleCharts = enabledStatuses.length > 0;

  const dashboardSettled =
    Boolean(estateId) &&
    (!hasVisibleCharts || areSettled(enabledStatuses));

  useEffect(() => {
    if (dashboardSettled) setInitialLoadDone(true);
  }, [dashboardSettled]);

  const pageLoading =
    resolvingEstate || (Boolean(estateId) && !initialLoadDone);

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of{" "}
            <span className="font-bold uppercase">{estateName}</span>
          </p>
        </div>

        {showComplaintsSummary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ComplaintsSummaryStatCard
              data={complaintsSummary}
              loading={complaintsSummaryLoading}
              error={complaintsSummaryError}
              onRetry={handleComplaintsSummaryRetry}
            />
          </div>
        ) : null}

        {showUserSummary ? (
          <UserSummaryCard
            data={userSummary}
            loading={userSummaryLoading}
            error={userSummaryError}
            onRetry={handleUserSummaryRetry}
          />
        ) : null}

        {showMeterSummary ? (
          <MeterSummaryCard
            data={meterSummary}
            loading={meterSummaryLoading}
            error={meterSummaryError}
            onRetry={handleMeterSummaryRetry}
            estateName={estateName}
          />
        ) : null}

        {showComplaintsDashboard ? (
          <ComplaintsDashboardCard
            data={complaintsDashboard}
            loading={complaintsDashboardLoading}
            error={complaintsDashboardError}
            onRetry={handleComplaintsDashboardRetry}
            estateName={estateName}
          />
        ) : null}

        {showRoleBreakdown || showBillsSummary ? (
          <div
            className={[
              "grid grid-cols-1 gap-4 lg:gap-6",
              showRoleBreakdown && showBillsSummary ? "lg:grid-cols-2" : "",
            ].join(" ")}
          >
            {showRoleBreakdown ? (
              <RoleBreakdownChart
                data={roleBreakdown}
                loading={roleBreakdownLoading}
                error={roleBreakdownError}
                onRetry={handleRoleBreakdownRetry}
              />
            ) : null}
            {showBillsSummary ? (
              <BillsSummaryChart
                data={billsSummary}
                loading={billsSummaryLoading}
                error={billsSummaryError}
                onRetry={handleBillsSummaryRetry}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
