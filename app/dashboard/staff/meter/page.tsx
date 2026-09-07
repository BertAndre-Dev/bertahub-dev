"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Eye, KeyRound, Link, Search, Unlink, Zap } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MeterEnergyUsageSection } from "@/components/charts/meter-energy-usage-section";
import { ClearTamperTokenModal } from "@/components/meter/ClearTamperTokenModal";
import {
  getMeterUsage,
  type MeterUsageRange,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import {
  assignMeterToAddress,
  clearTamperToken,
  extractClearTamperToken,
  getAllEstateMeter,
  getVendingStatsByEstate,
} from "@/redux/slice/staff/meter-mgt/meter-mgt";
import { getStaffEnergyConsumptionChart } from "@/redux/slice/staff/energy-consumption/staff-energy-consumption";
import { getEstateEnergyUsage } from "@/redux/slice/staff/estate-energy-usage/staff-estate-energy-usage";
import { getEstateRealtimeReadings } from "@/redux/slice/staff/estate-realtime-readings/staff-estate-realtime-readings";
import { formatRealtimeEnergyKwh } from "@/lib/estate-realtime-readings";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import AssignMeterForm from "@/components/staff/meter-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import Tab from "@/components/tabs/page";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { resolveEstateDisplayName } from "@/lib/user-id";
import { formatAddressRecordCreatedAt, formatAddressEntryLabel } from "@/lib/address";
import { ViewVendLimitModal } from "./components/ViewVendLimitModal";
import { SetVendLimitModal } from "./components/SetVendLimitModal";

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string | { id?: string; _id?: string; name?: string };
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: {
    id: string;
    data: Record<string, string>;
  };
  vendorData?: VendorData;
}

const PAGE_LIMIT = 10;

const METER_TAB_TITLES = ["Meter Management", "Chart Overview"] as const;

export default function StaffMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [usageMeterNumber, setUsageMeterNumber] = useState<string | null>(null);
  const [meterUsageRange, setMeterUsageRange] =
    useState<MeterUsageRange>("weekly");
  const [viewVendLimitOpen, setViewVendLimitOpen] = useState(false);
  const [setVendLimitOpen, setSetVendLimitOpen] = useState(false);
  const [meterToUnassign, setMeterToUnassign] = useState<AdminMeterData | null>(
    null,
  );
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);
  const [clearTamperOpen, setClearTamperOpen] = useState(false);
  const [clearTamperMeterNumber, setClearTamperMeterNumber] = useState<
    string | null
  >(null);
  const [clearTamperTokenValue, setClearTamperTokenValue] = useState<
    string | null
  >(null);
  const [clearTamperLoadingMeter, setClearTamperLoadingMeter] = useState<
    string | null
  >(null);

  const { allAdminMeters, pagination, getAllEstateMeterState } = useSelector(
    (state: RootState) => {
      const adminMeterState = state.staffMeter as any;
      return {
        allAdminMeters: adminMeterState?.allAdminMeters?.data || [],
        pagination: adminMeterState?.allAdminMeters?.pagination || {},
        getAllEstateMeterState:
          adminMeterState?.getAllEstateMeterState ?? "idle",
      };
    },
  );

  const pageLoading =
    bootstrapping || (!!estateId && isPending(getAllEstateMeterState));
  
  const { energyConsumptionChart, energyChartLoading } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.staffEnergyConsumption.chart,
      energyChartLoading:
        state.staffEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateRealtimeReadings,
    estateRealtimeReadingsLoading,
  } = useSelector((state: RootState) => ({
    estateRealtimeReadings: state.staffEstateRealtimeReadings.readings,
    estateRealtimeReadingsLoading:
      state.staffEstateRealtimeReadings.status === "isLoading",
  }));

  const {
    meterUsage,
    meterUsageLoading,
    meterUsageMessage,
  } = useSelector((state: RootState) => ({
    meterUsage: state.residentMeter.meterUsage,
    meterUsageLoading:
      state.residentMeter.getMeterUsageState === "isLoading",
    meterUsageMessage: state.residentMeter.meterUsageMessage,
  }));

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.staffEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.staffEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.staffEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.staffEstateEnergyUsage.message,
    estateEnergyUsageError: state.staffEstateEnergyUsage.error,
  }));

  const fetchMeters = useCallback(
    async (page = 1, searchTerm = appliedSearch) => {
      if (!estateId) return;
      await dispatch(
        getAllEstateMeter({
          estateId,
          page,
          limit: PAGE_LIMIT,
          search: searchTerm || undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, appliedSearch],
  );

  const handleSearchSubmit = () => {
    const term = searchInput.trim();
    setAppliedSearch(term);
    fetchMeters(1, term).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    if (!estateId) return;
    dispatch(
      getAllEstateMeter({
        estateId,
        page: 1,
        limit: PAGE_LIMIT,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  };

  // Bootstrap signed-in user and estate only (no meter fetch here).
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const foundEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateIdValue =
          typeof foundEstateId === "string"
            ? foundEstateId
            : foundEstateId?._id || foundEstateId?.id || "";

        const estateFromId =
          (foundEstateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!estateIdValue) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(estateIdValue);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  // Initial meter fetch when estate is resolved (not on every keystroke).
  useEffect(() => {
    if (!estateId) return;
    setSearchInput("");
    setAppliedSearch("");
    dispatch(
      getAllEstateMeter({
        estateId,
        page: 1,
        limit: PAGE_LIMIT,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [estateId, dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getVendingStatsByEstate({ estateId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateRealtimeReadings({ estateId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateEnergyUsage({ estateId, range: usageRange }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, usageRange]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getStaffEnergyConsumptionChart({
        estateId,
        period: energyPeriod,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!estateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getEstateEnergyUsage({
          estateId,
          range: usageRange,
          refresh: true,
        }),
      ).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setUsageRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchMeters(Number(pagination?.currentPage) || 1),
        estateId
          ? dispatch(getVendingStatsByEstate({ estateId })).unwrap()
          : Promise.resolve(),
      ]);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleOpenModal = (meter?: AdminMeterData) => {
    setSelectedMeter(meter || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
  };

  const openUnassignConfirm = (meter: AdminMeterData) => {
    setMeterToUnassign(meter);
  };

  const handleConfirmUnassign = async () => {
    if (!meterToUnassign || !estateId) {
      toast.error("Missing estate or meter for unassign.");
      return;
    }
    setUnassignSubmitting(true);
    try {
      const res = await dispatch(
        assignMeterToAddress({
          meterNumber: meterToUnassign.meterNumber,
          estateId,
          unassign: true,
        }),
      ).unwrap();
      toast.success(res?.message || "Meter unassigned successfully.");
      setMeterToUnassign(null);
      await handleRefresh();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setUnassignSubmitting(false);
    }
  };

  const handleOpenUsageModal = (meter: AdminMeterData) => {
    setUsageMeterNumber(meter.meterNumber);
    setMeterUsageRange("weekly");
    setUsageModalOpen(true);
  };

  const handleCloseUsageModal = () => {
    setUsageModalOpen(false);
    setUsageMeterNumber(null);
  };

  const handleCloseClearTamper = () => {
    setClearTamperOpen(false);
    setClearTamperMeterNumber(null);
    setClearTamperTokenValue(null);
  };

  const handleClearTamper = async (meter: AdminMeterData) => {
    if (!meter.meterNumber) {
      toast.warning("Meter number is missing.");
      return;
    }

    setClearTamperLoadingMeter(meter.meterNumber);
    try {
      const res = await dispatch(
        clearTamperToken({ meterNumber: meter.meterNumber }),
      ).unwrap();
      const token = extractClearTamperToken(res);
      if (!token) {
        toast.error("No clear-tamper token was returned.");
        return;
      }
      setClearTamperMeterNumber(meter.meterNumber);
      setClearTamperTokenValue(token);
      setClearTamperOpen(true);
      toast.success(
        "Clear-tamper token generated. Enter it on the meter keypad.",
      );
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setClearTamperLoadingMeter(null);
    }
  };

  useEffect(() => {
    if (!usageModalOpen || !usageMeterNumber) return;
    dispatch(
      getMeterUsage({ meterNumber: usageMeterNumber, range: meterUsageRange }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, usageModalOpen, usageMeterNumber, meterUsageRange]);

  const columns = [
    {
      key: "createdAt",
      header: "Created Date",
      render: (item: AdminMeterData) =>
        formatAddressRecordCreatedAt(item.createdAt),
      exportValue: (item: AdminMeterData) =>
        formatAddressRecordCreatedAt(item.createdAt),
    },
    { key: "meterNumber", header: "Meter Number" },
    {
      key: "estateId",
      header: "Estate",
      render: (item: AdminMeterData) => {
        const label = resolveEstateDisplayName(item.estateId);
        if (!label) return <span className="text-muted-foreground">—</span>;
        return <span className="font-medium">{label}</span>;
      },
      exportValue: (item: AdminMeterData) =>
        resolveEstateDisplayName(item.estateId) ?? "",
    },
    {
      key: "address",
      header: "Address",
      render: (item: AdminMeterData) =>
        formatAddressEntryLabel(item.addressId?.data) || "—",
      exportValue: (item: AdminMeterData) =>
        formatAddressEntryLabel(item.addressId?.data),
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "isAssigned",
      header: "Assigned To Address",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isAssigned
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isAssigned ? "Assigned to address" : "Not assigned to address"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Assign / Unassign",
      exportable: false,
      render: (item: AdminMeterData) =>
        item.isAssigned ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openUnassignConfirm(item)}
            className="hover:bg-amber-100"
            title="Unassign meter"
          >
            <Unlink className="w-4 h-4 text-amber-600" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
            className="hover:bg-blue-100"
            title="Assign meter"
          >
            <Link className="w-4 h-4 text-blue-600" />
          </Button>
        ),
    },
    {
      key: "energyUsage",
      header: "Energy Usage",
      exportable: false,
      render: (item: AdminMeterData) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenUsageModal(item)}
          className="cursor-pointer hover:bg-emerald-100"
          title="View energy usage"
        >
          <Eye className="w-4 h-4 text-emerald-600" />
        </Button>
      ),
    },
    {
      key: "clearTamper",
      header: "Clear Tamper",
      exportable: false,
      render: (item: AdminMeterData) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleClearTamper(item)}
          className="cursor-pointer hover:bg-orange-100"
          title="Generate clear-tamper token"
          disabled={clearTamperLoadingMeter === item.meterNumber}
        >
          <KeyRound className="w-4 h-4 text-orange-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading estate meters..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Energy Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor energy usage and manage all meters in{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName || ""}
            </span>
            .
          </p>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              disabled={!estateId || bootstrapping}
              className="flex items-center gap-2 cursor-pointer"
            >
              Vend Limit
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-md"
            >
              <DropdownMenu.Item
                onSelect={() => setViewVendLimitOpen(true)}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                See vend limit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => setSetVendLimitOpen(true)}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                Set / update vend limit
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Meters</p>
              <p className="font-heading text-2xl font-bold mt-2 tabular-nums tracking-tight">
                {pagination?.total ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-[#FEE6D480] p-3">
              <IoSpeedometerOutline className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="font-heading text-2xl font-bold mt-2 tabular-nums tracking-tight">
                {estateRealtimeReadingsLoading
                  ? "—"
                  : formatRealtimeEnergyKwh(
                      estateRealtimeReadings?.totalEnergy,
                    )}
              </p>
            </div>
            <div className="rounded-lg bg-[#CCE4DB80] p-3">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <Tab
        titles={[...METER_TAB_TITLES]}
        renderContent={(activeTab) => {
          switch (activeTab) {
            case "Chart Overview":
              return (
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
                      estateEnergyUsageError ??
                      estateEnergyUsageMessage ??
                      undefined
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
              );
            case "Meter Management":
              return (
                <div className="space-y-6">
                  <Card className="p-4">
                    <div className="relative w-full max-w-sm flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
                        <input
                          type="text"
                          placeholder="Search by meter number."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchSubmit();
                            }
                            if (e.key === "Escape") {
                              handleClearSearch();
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {searchInput.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition shrink-0 cursor-pointer"
                        >
                          Search
                        </button>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <Table
                      columns={columns}
                      data={allAdminMeters || []}
                      emptyMessage="No meter found."
                      showPagination
                      paginationInfo={{
                        total: pagination?.total || 0,
                        current: Number(pagination?.currentPage) || 1,
                        pageSize: Number(pagination?.pageSize) || 10,
                      }}
                      onPageChange={(page) => {
                        fetchMeters(page).catch((err: unknown) => {
                          const message = getApiErrorMessage(err);
                          if (message) toast.error(message);
                        });
                      }}
                      enableExport
                      exportFileName="meters"
                      onExportRequest={
                        estateId
                          ? async () => {
                              const res = await dispatch(
                                getAllEstateMeter({
                                  estateId,
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
                </div>
              );
            default:
              return null;
          }
        }}
      />

      {open && estateId && selectedMeter && (
        <Modal visible={open} onClose={handleCloseModal}>
          <AssignMeterForm
            close={handleCloseModal}
            refresh={handleRefresh}
            meterNumber={selectedMeter.meterNumber}
          />
        </Modal>
      )}

      {usageModalOpen && usageMeterNumber && (
        <Modal
          visible={usageModalOpen}
          onClose={handleCloseUsageModal}
          contentClassName="md:w-[min(720px,95vw)] lg:w-[min(800px,95vw)]"
        >
          <div className="space-y-4 pr-6">
            <div>
              <h2 className="font-heading text-xl font-bold">Energy Usage</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Meter{" "}
                <span className="font-medium text-foreground">
                  {usageMeterNumber}
                </span>
              </p>
            </div>
            <MeterEnergyUsageSection
              data={meterUsage}
              loading={meterUsageLoading}
              range={meterUsageRange}
              onRangeChange={setMeterUsageRange}
              exportFileName={`meter_${usageMeterNumber}_energy_usage`}
              emptyMessage={
                meterUsageMessage ||
                meterUsage?.hint ||
                "No energy usage data for this period. The meter may be offline or have no history yet."
              }
            />
          </div>
        </Modal>
      )}

      {estateId ? (
        <>
          <ViewVendLimitModal
            open={viewVendLimitOpen}
            estateId={estateId}
            onClose={() => setViewVendLimitOpen(false)}
          />
          <SetVendLimitModal
            open={setVendLimitOpen}
            estateId={estateId}
            onClose={() => setSetVendLimitOpen(false)}
          />
        </>
      ) : null}

      <DeleteModal
        visible={!!meterToUnassign}
        onClose={() => setMeterToUnassign(null)}
        itemName={meterToUnassign?.meterNumber ?? "this meter"}
        title="Unassign meter"
        confirmLabel="Unassign"
        loading={unassignSubmitting}
        loadingLabel="Unassigning..."
        message={
          <p className="text-sm text-muted-foreground mb-4">
            Unassign meter{" "}
            <strong>{meterToUnassign?.meterNumber ?? "this meter"}</strong> from
            its address? The meter will stay on the estate pool.
          </p>
        }
        onConfirm={handleConfirmUnassign}
      />

      <ClearTamperTokenModal
        visible={clearTamperOpen}
        meterNumber={clearTamperMeterNumber}
        token={clearTamperTokenValue}
        onClose={handleCloseClearTamper}
      />
      </div>
    </div>
  );
}
