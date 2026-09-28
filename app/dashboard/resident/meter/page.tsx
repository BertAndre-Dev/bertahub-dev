"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import { MeterRealtimeBalanceCard } from "@/components/charts/meter-realtime-balance-card";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { MeterEnergyUsageSection } from "@/components/charts/meter-energy-usage-section";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import { formatPowerUsageKwh } from "@/lib/power-usage-chart";
import { parseResidentEstate } from "@/app/dashboard/resident/asset/lib/estate";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMeterByAddress,
  reconnectMeter,
  disconnectMeter,
  getMeterVendHistory,
  getMeterUsage,
  getResidentEnergyConsumptionChart,
  // getVendingStatsByAddress,
  type MeterUsageRange,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getMeterRealtimeBalance } from "@/redux/slice/resident/meter-realtime-balance/resident-meter-realtime-balance";
import { clearResidentMeterRealtimeBalance } from "@/redux/slice/resident/meter-realtime-balance/resident-meter-realtime-balance-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses } from "@/lib/address";
import SwitchAddress from "@/components/resident/switch-address/page";
import VendPower from "@/components/resident/vend-power/page";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import {
  resolveReceiptAddressLabel,
  residentDisplayName,
} from "@/components/receipt/format";
import Table from "@/components/tables/list/page";
import Tab from "@/components/tabs/page";
import type { EnergyListItem } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
import Loader from "@/components/ui/Loader";
import { CopyButton } from "@/components/ui/copy-button";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";

const METER_TAB_TITLES = ["Chart Overview", "Vend"] as const;

function formatMeterBalance(balance: number | null | undefined): string {
  const n = Number(balance);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// function formatPurchasedAmount(amount: number): string {
//   return `₦${amount.toLocaleString()}`;
// }

export default function ResidentMeter() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [addressOptions, setAddressOptions] = useState<
    { id: string; data?: Record<string, string> }[]
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [walletId, setWalletId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [viewVend, setViewVend] = useState<EnergyListItem | null>(null);
  const [usageRange, setUsageRange] = useState<MeterUsageRange>("weekly");
  const [pageSize, setPageSize] = useState(10);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [realtimeBalanceRefreshing, setRealtimeBalanceRefreshing] =
    useState(false);
  const { meterVendHistory, pagination, loading } = useSelector(
    (state: RootState) => {
      const vendState = state.residentMeter as any;
      const data = vendState.meterVendHistory?.data || [];
      const pagination = vendState.meterVendHistory?.pagination || {};
      return {
        meterVendHistory: Array.isArray(data) ? data : [],
        pagination,
        loading: vendState.loading || false,
      };
    },
  );

  const meter = useSelector(
    (state: RootState) => state.residentMeter.residentMeter,
  );
  const meterUsage = useSelector(
    (state: RootState) => state.residentMeter.meterUsage,
  );
  const meterUsageMessage = useSelector(
    (state: RootState) => state.residentMeter.meterUsageMessage,
  );
  const getMeterUsageState = useSelector(
    (state: RootState) => state.residentMeter.getMeterUsageState,
  );
  const getMeterByAddressState = useSelector(
    (state: RootState) => state.residentMeter.getMeterByAddressState,
  );
  const meterUsageLoading = isPending(getMeterUsageState);
  const meterLoading = isPending(getMeterByAddressState);
  // const vendingStats = useSelector(
  //   (state: RootState) => state.residentMeter.vendingStatsByAddress,
  // );
  // const vendingStatsLoading =
  //   useSelector(
  //     (state: RootState) => state.residentMeter.getVendingStatsByAddressState,
  //   ) === "isLoading";

  const energyConsumptionChart = useSelector(
    (state: RootState) => state.residentMeter.energyConsumptionChart,
  );
  const getEnergyConsumptionChartState = useSelector(
    (state: RootState) => state.residentMeter.getEnergyConsumptionChartState,
  );
  const energyChartLoading = isPending(getEnergyConsumptionChartState);

  const {
    realtimeBalance,
    realtimeBalanceStatus,
    realtimeBalanceMessage,
    realtimeBalanceError,
  } = useSelector((state: RootState) => ({
    realtimeBalance: state.residentMeterRealtimeBalance.balance,
    realtimeBalanceStatus: state.residentMeterRealtimeBalance.status,
    realtimeBalanceMessage: state.residentMeterRealtimeBalance.message,
    realtimeBalanceError: state.residentMeterRealtimeBalance.error,
  }));
  const realtimeBalanceLoading = isPending(realtimeBalanceStatus);

  // Load user and normalize addresses (addressIds for owners, addressId for tenants)
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const userData = userRes?.data ?? {};
        const foundWalletId: string | null = userData?.walletId ?? null;
        setWalletId(foundWalletId);

        const estate = parseResidentEstate(userData as Record<string, unknown>);
        setEstateId(estate?.id ?? null);
        setEstateName(estate?.name ?? "");
        setPayerName(
          residentDisplayName(userData.firstName, userData.lastName) ?? "",
        );
        setPayerEmail(
          typeof userData.email === "string" ? userData.email : "",
        );

        const addresses = normalizeAddresses(userData);
        if (addresses.length === 0) {
          toast.warning("No address attached to your account.");
          return;
        }

        setAddressOptions(addresses);
        setSelectedAddressId((prev) => {
          const firstId = addresses[0].id;
          return prev ?? firstId;
        });
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  // Fetch meter when selected address changes
  useEffect(() => {
    if (!selectedAddressId) return;
    (async () => {
      try {
        await dispatch(
          getMeterByAddress({ addressId: selectedAddressId }),
        ).unwrap();
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch, selectedAddressId]);

  // useEffect(() => {
  //   if (!selectedAddressId) return;
  //   dispatch(getVendingStatsByAddress({ addressId: selectedAddressId })).catch(
  //     (error: { message?: string }) => {
  //       toast.error(error?.message ?? "Failed to load purchase total.");
  //     },
  //   );
  // }, [dispatch, selectedAddressId]);

  useEffect(() => {
    if (meter?.meterNumber) {
      dispatch(
        getMeterVendHistory({
          meterNumber: meter.meterNumber,
          page: 1,
          limit: pageSize,
        }),
      );
    }
  }, [meter?.meterNumber, dispatch, pageSize]);

  useEffect(() => {
    const meterNumber = meter?.meterNumber;
    if (!meterNumber) return;
    dispatch(getMeterUsage({ meterNumber, range: usageRange }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [meter?.meterNumber, usageRange, dispatch]);

  useEffect(() => {
    if (!estateId || !selectedAddressId) return;
    dispatch(
      getResidentEnergyConsumptionChart({
        estateId,
        addressId: selectedAddressId,
        period: energyPeriod,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, selectedAddressId, energyPeriod]);

  useEffect(() => {
    const meterNumber = meter?.meterNumber;
    if (!meterNumber) {
      dispatch(clearResidentMeterRealtimeBalance());
      return;
    }
    dispatch(
      getMeterRealtimeBalance({ meterNumber, includeUsed: true }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [meter?.meterNumber, dispatch]);

  const energyUsageLoading =
    Boolean(meter?.meterNumber) &&
    (meterUsageLoading || (meterLoading && !meterUsage));

  const handleRefreshRealtimeBalance = async () => {
    if (!meter?.meterNumber) return;
    setRealtimeBalanceRefreshing(true);
    try {
      await dispatch(
        getMeterRealtimeBalance({
          meterNumber: meter.meterNumber,
          includeUsed: true,
          refresh: true,
        }),
      ).unwrap();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setRealtimeBalanceRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedAddressId) return;
    try {
      const tasks: Promise<unknown>[] = [
        dispatch(getMeterByAddress({ addressId: selectedAddressId })).unwrap(),
        // dispatch(
        //   getVendingStatsByAddress({ addressId: selectedAddressId }),
        // ).unwrap(),
      ];
      if (meter?.meterNumber) {
        tasks.push(
          dispatch(
            getMeterVendHistory({
              meterNumber: meter.meterNumber,
              page: 1,
              limit: pageSize,
            }),
          ).unwrap(),
          dispatch(
            getMeterUsage({
              meterNumber: meter.meterNumber,
              range: usageRange,
              refresh: true,
            }),
          ).unwrap(),
          dispatch(
            getMeterRealtimeBalance({
              meterNumber: meter.meterNumber,
              includeUsed: true,
              refresh: true,
            }),
          ).unwrap(),
        );
      }
      await Promise.all(tasks);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) toast.error(message);
    }
  };

  const handleAddressChange = (addressId: string) =>
    setSelectedAddressId(addressId);

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleToggleMeter = async () => {
    if (!meter || !selectedAddressId) return;

    try {
      if (meter.isActive) {
        // Disconnect
        await dispatch(
          disconnectMeter({ meterNumber: meter.meterNumber }),
        ).unwrap();
        toast.success("Meter disconnected successfully");
      } else {
        // Reconnect
        await dispatch(
          reconnectMeter({ meterNumber: meter.meterNumber }),
        ).unwrap();
        toast.success("Meter reconnected successfully");
      }
      // Refresh meter data after toggling
      await handleRefresh();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) toast.error(message);
    }
  };

  const handleVendPageChange = (newPage: number) => {
    if (!meter?.meterNumber) return;
    dispatch(
      getMeterVendHistory({
        meterNumber: meter.meterNumber,
        page: newPage,
        limit: pageSize,
      }),
    );
  };

  const vendColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (row: EnergyListItem) => {
        if (!row.createdAt) return "N/A";
        const date = new Date(row.createdAt);
        return date.toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (row: EnergyListItem) => Number(row.amount).toLocaleString(),
    },
    {
      key: "units",
      header: "Units Bought",
      render: (row: EnergyListItem) => `${row.value} ${row.unit}`,
    },
    {
      key: "receiptNo",
      header: "Receipt No",
      render: (row: EnergyListItem) => row.receiptNo ?? "—",
    },
    {
      key: "token",
      header: "Token",
      render: (row: EnergyListItem) => {
        if (!row.token) return "N/A";
        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[180px]">{row.token}</span>
            <CopyButton value={row.token} title="Copy token" />
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price (₦/kWh)",
      render: (row: EnergyListItem) =>
        row.price ? Number(row.price).toLocaleString() : "N/A",
    },
    {
      key: "device",
      header: "Meter Number",
      render: (row: EnergyListItem) => row.device,
    },
    {
      key: "actions",
      header: "Actions",
      exportable: false as const,
      render: (row: EnergyListItem) => (
        <IconTooltip label="View receipt">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewVend(row)}
            aria-label="View receipt"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </IconTooltip>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={handleAddressChange}
      />

      <Card className="p-6 md:p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 shrink-0">
            <h2 className="text-xl font-semibold tracking-tight">My Meter</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Current Energy Balance
            </p>
            <p className="text-4xl font-bold mt-2 tabular-nums tracking-tight">
              {formatMeterBalance(meter?.balance)}{" "}
              <span className="text-3xl font-bold">kWh</span>
            </p>
          </div>

          <div className="flex flex-1 items-stretch rounded-xl border border-border bg-muted/40 max-w-80">
            <div className="flex flex-1 flex-col justify-center p-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Total Energy Consumed
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {energyUsageLoading
                  ? "—"
                  : `${formatPowerUsageKwh(Number(meterUsage?.totalUsage) || 0)} kWh`}
              </p>
            </div>
            {/* <div
              className="w-px shrink-0 self-stretch bg-border my-4"
              aria-hidden
            />
            <div className="flex flex-1 flex-col justify-center p-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Total Amount Purchased
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {vendingStatsLoading
                  ? "—"
                  : formatPurchasedAmount(
                      Number(vendingStats?.totalAmount) || 0,
                    )}
              </p>
            </div> */}
          </div>

          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 shrink-0">
            <Button
              onClick={handleOpenModal}
              size="lg"
              className="w-full sm:w-auto px-8 text-white hover:opacity-90"
              style={{ backgroundColor: "#0150AC" }}
            >
              Buy Power
            </Button>
            <Button
              onClick={handleToggleMeter}
              size="lg"
              className="w-full sm:w-auto px-8"
              variant={meter?.isActive ? "destructive" : "default"}
            >
              {meter?.isActive ? "Disconnect Meter" : "Reconnect Meter"}
            </Button>
          </div>
        </div>
      </Card>

      <Tab
        titles={[...METER_TAB_TITLES]}
        renderContent={(activeTab) => {
          switch (activeTab) {
            case "Chart Overview":
              return (
                <div className="space-y-6">
                  <MeterRealtimeBalanceCard
                    data={realtimeBalance}
                    loading={
                      Boolean(meter?.meterNumber) && realtimeBalanceLoading
                    }
                    onRefresh={handleRefreshRealtimeBalance}
                    refreshing={realtimeBalanceRefreshing}
                    emptyMessage={
                      !meter?.meterNumber
                        ? "No meter linked to this address."
                        : (realtimeBalanceError ??
                          realtimeBalanceMessage ??
                          undefined)
                    }
                  />

                  <MeterEnergyUsageSection
                    data={meterUsage}
                    loading={energyUsageLoading}
                    range={usageRange}
                    onRangeChange={setUsageRange}
                    showPeriodFilter={Boolean(meter?.meterNumber)}
                    emptyMessage={
                      !selectedAddressId
                        ? "Add an address to your account to see energy usage."
                        : !meter?.meterNumber
                          ? "No meter linked to this address."
                          : meterUsageMessage ||
                            meterUsage?.hint ||
                            "No energy usage data for this period. The meter may be offline or have no history yet."
                    }
                  />
                  <EnergyConsumptionOverTimeCard
                    data={energyConsumptionChart}
                    loading={energyChartLoading}
                    period={energyPeriod}
                    onPeriodChange={setEnergyPeriod}
                    emptyMessage={
                      !estateId
                        ? "Your account is not linked to an estate."
                        : !selectedAddressId
                          ? "Select an address to view vending data."
                          : "No vending data for this period yet."
                    }
                  />
                </div>
              );
            case "Vend":
              return (
                <Card className="p-4">
                  <h2 className="font-semibold mb-4">Vend History</h2>
                  <Table
                    columns={vendColumns}
                    data={meterVendHistory || []}
                    emptyMessage={
                      loading ? (
                        <Loader label="Loading vend history..." />
                      ) : (
                        "No vend history available."
                      )
                    }
                    showPagination
                    paginationInfo={{
                      total: pagination?.total ?? meterVendHistory.length ?? 0,
                      current: Number(pagination?.page) || 1,
                      pageSize,
                    }}
                    onPageChange={handleVendPageChange}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      if (!meter?.meterNumber) return;
                      dispatch(
                        getMeterVendHistory({
                          meterNumber: meter.meterNumber,
                          page: 1,
                          limit: size,
                        }),
                      );
                    }}
                    enableExport
                    exportFileName="meter-vend-history"
                    onExportRequest={
                      meter?.meterNumber
                        ? async () => {
                            const res = await dispatch(
                              getMeterVendHistory({
                                meterNumber: meter.meterNumber,
                                page: 1,
                                limit: 50000,
                              }),
                            ).unwrap();
                            return res?.data ?? [];
                          }
                        : undefined
                    }
                  />
                </Card>
              );
            default:
              return null;
          }
        }}
      />

      {open && meter && walletId && selectedAddressId && (
        <Modal visible={open} onClose={handleOpenModal}>
          <VendPower
            walletId={walletId}
            meterNumber={meter?.meterNumber ?? ""}
            tariffPrice={meter?.currentTariff?.price ?? null}
            onSubmitSuccess={handleRefresh}
            onClose={handleOpenModal}
          />
        </Modal>
      )}

      <ReceiptModal
        isOpen={!!viewVend}
        onClose={() => setViewVend(null)}
        type="vend"
        vend={viewVend}
        party={{
          payerName: payerName || undefined,
          email: payerEmail || undefined,
          estateName: estateName || undefined,
          addressLabel: resolveReceiptAddressLabel(
            addressOptions,
            selectedAddressId,
          ),
        }}
      />
    </div>
  );
}
