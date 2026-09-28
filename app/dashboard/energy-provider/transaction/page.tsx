"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import EnergyProviderVendsTab from "@/app/dashboard/super-admin/energy-provider/components/EnergyProviderVendsTab";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEnergyProviderTransactionVends } from "@/redux/slice/energy-provider/transaction/energy-provider-transaction";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { isPending } from "@/lib/async-status";

const PAGE_SIZE = 10;

export default function EnergyProviderTransactionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");
  const [loadingUser, setLoadingUser] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { vends, pagination, vendsStatus } = useSelector(
    (state: RootState) => ({
      vends: state.energyProviderTransaction.list,
      pagination: state.energyProviderTransaction.pagination,
      vendsStatus: state.energyProviderTransaction.status,
    }),
  );

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
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
        setLoadingUser(false);
      }
    })();
  }, [dispatch]);

  const fetchVends = useCallback(
    (nextPage = 1) => {
      if (!estateId) return Promise.resolve();
      const shouldApplyDate = Boolean(startDate && endDate);
      return dispatch(
        getEnergyProviderTransactionVends({
          estateId,
          page: nextPage,
          limit: pageSize,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, pageSize, startDate, endDate],
  );

  useEffect(() => {
    if (!estateId) return;
    fetchVends(page).catch(() => toast.error("Failed to load transactions"));
  }, [estateId, page, fetchVends]);

  const loading =
    loadingUser || (Boolean(estateId) && isPending(vendsStatus));

  return (
    <div className="relative space-y-6">
      {loading && <Loader fullScreen label="Loading..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vend history for {estateName} with commission and provider payout
            per transaction.
          </p>
        </div>

        <Card className="p-4">
          <EnergyProviderVendsTab
            data={vends}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
              setStartDate(nextStart);
              setEndDate(nextEnd);
              setPage(1);
            }}
            paginationInfo={{
              total: pagination?.total ?? 0,
              current: pagination?.currentPage ?? 1,
              pageSize,
            }}
            onPageChange={setPage}

            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onExportRequest={async () => {
              if (!estateId) return [];
              const shouldApplyDate = Boolean(startDate && endDate);
              const res = await dispatch(
                getEnergyProviderTransactionVends({
                  estateId,
                  page: 1,
                  limit: 50000,
                  startDate: shouldApplyDate ? startDate : undefined,
                  endDate: shouldApplyDate ? endDate : undefined,
                }),
              ).unwrap();
              return res.data;
            }}
          />
        </Card>
      </div>
    </div>
  );
}
