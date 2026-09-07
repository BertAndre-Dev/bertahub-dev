"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Plus, Search, Trash, Eye, X, KeyRound, ArrowRightLeft } from "lucide-react";
import { MeterEnergyUsageSection } from "@/components/charts/meter-energy-usage-section";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import Tab from "@/components/tabs/page";
import { ClearTamperTokenModal } from "@/components/meter/ClearTamperTokenModal";
import ReassignMeterForm from "@/components/meter/ReassignMeterForm";
import {
  getMeterUsage,
  type MeterUsageRange,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getSuperAdminEnergyConsumptionChart } from "@/redux/slice/super-admin/energy-consumption/super-admin-energy-consumption";
import { getSuperAdminEstateEnergyUsage } from "@/redux/slice/super-admin/estate-energy-usage/super-admin-estate-energy-usage";
import {
  clearTamperToken,
  deleteMeter,
  extractClearTamperToken,
  getAllMeters,
  getMeterByAddressId,
  removeEstateMeter,
} from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter";
import {
  applySuperAdminMeterSearch,
  clearSuperAdminMeterSearch,
  setSuperAdminMeterEnergyPeriod,
  setSuperAdminMeterEstateId,
  setSuperAdminMeterSearchInput,
  setSuperAdminMeterUsageRange,
} from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter-slice";
import AssignMeterForm from "@/components/super-admin/meter-form/page";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  extractEstateId,
  extractPopulatedName,
  normalizeUserId,
  resolveEstateDisplayName,
} from "@/lib/user-id";
import { formatAddressRecordCreatedAt, formatAddressEntryLabel } from "@/lib/address";

/** addressId from list API can be a string or populated object with id */
type AddressIdInput = string | { id: string; data?: Record<string, unknown> };

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string | { id?: string; _id?: string; name?: string };
  companyId?: string | { id?: string; _id?: string; name?: string };
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId?: AddressIdInput;
  vendorData?: any;
}

function toAddressIdString(
  addressId: AddressIdInput | null | undefined,
): string | null {
  if (addressId == null) return null;
  if (typeof addressId === "string") return addressId;
  if (typeof addressId === "object" && addressId?.id) return addressId.id;
  return null;
}

function toAddressData(addressId: AddressIdInput | null | undefined): Record<
  string,
  unknown
> | null {
  if (addressId == null) return null;
  if (typeof addressId === "object" && addressId?.data) return addressId.data;
  return null;
}

function formatAddressData(
  data: Record<string, unknown> | null | undefined,
): string {
  return formatAddressEntryLabel(data) || "—";
}

type EstateOption = { label: string; value: string };

const ESTATE_FILTER_FETCH_LIMIT = 500;
const COMPANY_FILTER_FETCH_LIMIT = 500;
const METER_TAB_TITLES = ["Meter Management", "Chart Overview"] as const;

function resolveEstateOrCompanyLabel(
  item: { estateId?: unknown; companyId?: unknown },
  estateNameById: Record<string, string>,
  companyNameById: Record<string, string>,
): string | null {
  const estateLabel = resolveEstateDisplayName(item.estateId, estateNameById);
  if (estateLabel) return estateLabel;
  const companyId = normalizeUserId(item.companyId);
  if (companyId) {
    return (
      companyNameById[companyId] ??
      extractPopulatedName(item.companyId) ??
      companyId
    );
  }
  return extractPopulatedName(item.companyId);
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [assignMeter, setAssignMeter] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsAddressId, setDetailsAddressId] = useState<string | null>(null);
  const [detailsMeterNumber, setDetailsMeterNumber] = useState<string | null>(
    null,
  );
  const [meterUsageRange, setMeterUsageRange] =
    useState<MeterUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);
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
  const [reassignMeterRow, setReassignMeterRow] =
    useState<AdminMeterData | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    allSuperAdminMeters,
    pagination,
    loading,
    meterDetails,
    detailsLoading,
    selectedEstateId,
    searchInput,
    searchQuery,
    usageRange,
    energyPeriod,
  } = useSelector((state: RootState) => {
    const superAdminMeter = state.superAdminMeter;
    const filters = superAdminMeter.filters ?? {
      selectedEstateId: "",
      searchInput: "",
      searchQuery: "",
      usageRange: "weekly" as const,
      energyPeriod: "weekly" as const,
    };
    const selectedId = filters.selectedEstateId;
    return {
      allSuperAdminMeters: (superAdminMeter?.allSuperAdminMeter?.data ||
        []) as AdminMeterData[],
      pagination: superAdminMeter?.allSuperAdminMeter?.pagination ?? {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
      },
      loading: isPending(superAdminMeter?.getAllMetersState),
      meterDetails: superAdminMeter?.superAdminMeter ?? null,
      detailsLoading: superAdminMeter?.getMeterByAddressIdState === "isLoading",
      selectedEstateId:
        selectedId && selectedId !== "all" ? selectedId : "",
      searchInput: filters.searchInput,
      searchQuery: filters.searchQuery,
      usageRange: filters.usageRange,
      energyPeriod: filters.energyPeriod,
    };
  });

  const { allEstates, estatesLoading } = useSelector((state: RootState) => ({
    allEstates: state.estate.allEstates?.data ?? [],
    estatesLoading: state.estate.getAllEstatesState === "isLoading",
  }));

  const allCompanies = useSelector(
    (state: RootState) => state.superAdminCompany.list ?? [],
  );

  const { meterUsage, meterUsageLoading, meterUsageMessage } = useSelector(
    (state: RootState) => ({
      meterUsage: state.residentMeter.meterUsage,
      meterUsageLoading:
        state.residentMeter.getMeterUsageState === "isLoading",
      meterUsageMessage: state.residentMeter.meterUsageMessage,
    }),
  );

  const { energyConsumptionChart, energyChartLoading } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.superAdminEnergyConsumption.chart,
      energyChartLoading:
        state.superAdminEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.superAdminEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.superAdminEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.superAdminEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.superAdminEstateEnergyUsage.message,
    estateEnergyUsageError: state.superAdminEstateEnergyUsage.error,
  }));

  const estateNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const estate of allEstates) {
      const id =
        (estate as { id?: string; _id?: string })?.id ??
        (estate as { _id?: string })?._id;
      const name = (estate as { name?: string })?.name;
      if (id && name) map[String(id)] = String(name);
    }
    return map;
  }, [allEstates]);

  const companyNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const company of allCompanies) {
      const id = company?.id ?? company?._id;
      const name = company?.name;
      if (id && name) map[String(id)] = String(name);
    }
    return map;
  }, [allCompanies]);

  const estateOptions = useMemo<EstateOption[]>(
    () =>
      Object.entries(estateNameById)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [estateNameById],
  );

  const selectedEstate =
    estateOptions.find((o) => o.value === selectedEstateId) ?? null;

  const pageSize = Number(pagination?.pageSize) || 10;

  const fetchMeters = useCallback(
    async (page = 1, search = searchQuery) => {
      await dispatch(
        getAllMeters({
          page,
          limit: pageSize,
          search: search || undefined,
        }),
      ).unwrap();
    },
    [dispatch, pageSize, searchQuery],
  );

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: ESTATE_FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch(() => {
        // non-blocking: table can still render estateId if name isn't available
      });
    dispatch(getCompanies({ page: 1, limit: COMPANY_FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch(() => {
        // non-blocking: table can still render companyId if name isn't available
      });
  }, [dispatch]);

  // Default chart estate to the first option once estates load
  useEffect(() => {
    if (selectedEstateId) return;
    if (!estateOptions.length) return;
    dispatch(setSuperAdminMeterEstateId(estateOptions[0].value));
  }, [dispatch, estateOptions, selectedEstateId]);

  useEffect(() => {
    fetchMeters(1, searchQuery).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [searchQuery, fetchMeters]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getSuperAdminEstateEnergyUsage({
        estateId: selectedEstateId,
        range: usageRange,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, selectedEstateId, usageRange]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getSuperAdminEnergyConsumptionChart({
        estateId: selectedEstateId,
        period: energyPeriod,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, selectedEstateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!selectedEstateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getSuperAdminEstateEnergyUsage({
          estateId: selectedEstateId,
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

  const chartEmptyMessage = useMemo(() => {
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found.";
    if (!selectedEstateId) return "Select an estate to view energy data.";
    return undefined;
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

  const vendChartEmptyMessage = useMemo(() => {
    if (chartEmptyMessage) return chartEmptyMessage;
    return "No vending data for this period yet.";
  }, [chartEmptyMessage]);

  const handleRefresh = async () => {
    try {
      await fetchMeters(Number(pagination?.currentPage) || 1, searchQuery);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleOpenRemoveModal = (meter: AdminMeterData) => {
    setSelectedMeter(meter);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
  };

  const handleAssignMeter = () => {
    setAssignMeter((prev) => !prev);
  };

  const handleOpenReassignMeter = (meter: AdminMeterData) => {
    setReassignMeterRow(meter);
  };

  const handleCloseReassignMeter = () => {
    setReassignMeterRow(null);
  };

  const handleRemoveMeter = async () => {
    if (!selectedMeter) return;

    try {
      // Pass meterNumber and estateId as expected by removeEstateMeter thunk
      await dispatch(
        removeEstateMeter({
          meterNumber: selectedMeter.meterNumber,
          estateId: extractEstateId(selectedMeter.estateId) || "",
        }),
      ).unwrap();

      toast.success("Meter removed successfully");
      handleRefresh();
      handleCloseModal();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleViewDetails = (meter: AdminMeterData) => {
    const addressIdStr = toAddressIdString(meter.addressId);
    if (!addressIdStr) {
      toast.warning("No address linked to this meter yet");
      return;
    }
    setDetailsAddressId(addressIdStr);
    setDetailsMeterNumber(meter.meterNumber);
    setMeterUsageRange("weekly");
    setDetailsModalOpen(true);
    dispatch(getMeterByAddressId(addressIdStr)).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
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

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsAddressId(null);
    setDetailsMeterNumber(null);
  };

  useEffect(() => {
    if (!detailsModalOpen || !detailsMeterNumber) return;
    dispatch(
      getMeterUsage({ meterNumber: detailsMeterNumber, range: meterUsageRange }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, detailsModalOpen, detailsMeterNumber, meterUsageRange]);

  const handleDeleteMeter = async (meterId: string) => {
    if (!meterId) {
      toast.error("Meter ID is missing");
      return;
    }
    setItemToDelete({ id: meterId, name: "this meter" });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      const response = await dispatch(deleteMeter(itemToDelete.id)).unwrap();
      toast.success(response?.message || "Meter deleted successfully");
      setItemToDelete(null);
      handleRefresh();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

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
      header: "Estate/Company",
      render: (item: AdminMeterData) => {
        const label = resolveEstateOrCompanyLabel(
          item,
          estateNameById,
          companyNameById,
        );
        if (!label) return <span className="text-muted-foreground">—</span>;
        return <span className="font-medium">{label}</span>;
      },
      exportValue: (item: AdminMeterData) =>
        resolveEstateOrCompanyLabel(item, estateNameById, companyNameById) ??
        "",
    },
    {
      key: "address",
      header: "Address",
      render: (item: AdminMeterData) =>
        formatAddressData(toAddressData(item.addressId)),
      exportValue: (item: AdminMeterData) =>
        formatAddressEntryLabel(toAddressData(item.addressId)),
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
      header: "Action",
      render: (item: AdminMeterData) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1"
            onClick={() => handleViewDetails(item)}
            title="View details"
            disabled={!toAddressIdString(item.addressId)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {(extractEstateId(item.estateId) ||
            normalizeUserId(item.companyId)) && (
            <div className="relative group/reassign">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1"
                onClick={() => handleOpenReassignMeter(item)}
                title="Reassign to estate"
                aria-label="Reassign to estate"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              </Button>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow transition-opacity group-hover/reassign:opacity-100"
              >
                Reassign to estate
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1"
            onClick={() => handleClearTamper(item)}
            title="Generate clear-tamper token"
            disabled={clearTamperLoadingMeter === item.meterNumber}
          >
            <KeyRound className="w-4 h-4 text-orange-600" />
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            size="sm"
            onClick={() => handleDeleteMeter(item.id!)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Energy Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor energy usage and manage meters across estates.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Button
            onClick={handleAssignMeter}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Meter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const meters = allSuperAdminMeters as AdminMeterData[];

          const stats = [
            {
              label: "Total Meters",
              value: pagination?.total ?? 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Meters",
              value:
                meters?.filter((meter: AdminMeterData) => meter.isActive)
                  ?.length || 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#CCE4DB80]",
            },
          ];

          return stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
      </div>

      <Tab
        titles={[...METER_TAB_TITLES]}
        renderContent={(activeTab) => {
          switch (activeTab) {
            case "Chart Overview":
              return (
                <div className="space-y-6">
                  <div className="w-full max-w-xs">
                    <Select
                      options={estateOptions}
                      placeholder="Filter by estate"
                      value={selectedEstate}
                      onChange={(option) =>
                        dispatch(
                          setSuperAdminMeterEstateId(option?.value ?? ""),
                        )
                      }
                      isSearchable
                      isLoading={estatesLoading}
                      isDisabled={!estateOptions.length || estatesLoading}
                      styles={{
                        control: (base) => ({ ...base, cursor: "pointer" }),
                        option: (base) => ({ ...base, cursor: "pointer" }),
                        dropdownIndicator: (base) => ({
                          ...base,
                          cursor: "pointer",
                        }),
                        clearIndicator: (base) => ({
                          ...base,
                          cursor: "pointer",
                        }),
                      }}
                    />
                  </div>
                  <EstatePowerUsageSection
                    data={estateEnergyUsage}
                    loading={
                      estatesLoading ||
                      (!!selectedEstateId && estateEnergyUsageLoading)
                    }
                    progress={estateEnergyUsageProgress}
                    range={usageRange}
                    onRangeChange={(range) =>
                      dispatch(setSuperAdminMeterUsageRange(range))
                    }
                    onRefresh={
                      selectedEstateId ? handleRefreshUsage : undefined
                    }
                    refreshing={usageRefreshing}
                    exportFileName={
                      selectedEstate
                        ? `estate_${selectedEstate.label.replace(/[^a-z0-9-_]/gi, "_")}_energy_usage`
                        : "estate_energy_usage"
                    }
                    emptyMessage={
                      chartEmptyMessage ??
                      estateEnergyUsageError ??
                      estateEnergyUsageMessage ??
                      "No energy usage data for this period."
                    }
                  />
                  <EnergyConsumptionOverTimeCard
                    data={energyConsumptionChart}
                    loading={
                      estatesLoading ||
                      (!!selectedEstateId && energyChartLoading)
                    }
                    period={energyPeriod}
                    onPeriodChange={(period) =>
                      dispatch(setSuperAdminMeterEnergyPeriod(period))
                    }
                    emptyMessage={vendChartEmptyMessage}
                  />
                </div>
              );
            case "Meter Management":
              return (
                <div className="relative space-y-6">
                  {loading && <Loader fullScreen label="Loading meters..." />}

                  <div
                    className={[
                      "space-y-6",
                      loading ? "pointer-events-none select-none" : "",
                    ].join(" ")}
                  >
                    <Card className="p-4">
                      <div className="relative w-full max-w-sm flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <input
                            ref={searchInputRef}
                            placeholder="Search by meter number."
                            value={searchInput}
                            onChange={(e) =>
                              dispatch(
                                setSuperAdminMeterSearchInput(e.target.value),
                              )
                            }
                            onKeyDown={(e) => {
                              const hasValue = searchInput.trim().length > 0;
                              if (e.key === "Enter" && hasValue) {
                                dispatch(applySuperAdminMeterSearch());
                              }
                              if (e.key === "Escape") {
                                dispatch(clearSuperAdminMeterSearch());
                                searchInputRef.current?.focus();
                              }
                            }}
                            className="w-full pl-9 pr-8 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {searchInput.trim().length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                dispatch(clearSuperAdminMeterSearch());
                                searchInputRef.current?.focus();
                              }}
                              aria-label="Clear search"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {searchInput.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(applySuperAdminMeterSearch())
                            }
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition"
                          >
                            Search
                          </button>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <Table
                        columns={columns}
                        data={allSuperAdminMeters}
                        emptyMessage="No meters found."
                        showPagination
                        onSearch={(value) =>
                          dispatch(setSuperAdminMeterSearchInput(value))
                        }
                        paginationInfo={{
                          total: pagination?.total || 0,
                          current: Number(pagination?.currentPage) || 1,
                          pageSize: Number(pagination?.pageSize) || 10,
                        }}
                        onPageChange={(page) => {
                          fetchMeters(page, searchQuery).catch(
                            (err: unknown) => {
                              const message = getApiErrorMessage(err);
                              if (message) toast.error(message);
                            },
                          );
                        }}
                        enableExport
                        exportFileName="meters"
                        onExportRequest={async () => {
                          // Fetch via axios (not Redux) so the paginated table
                          // isn't replaced with the full export result set.
                          const params = new URLSearchParams();
                          params.set("page", "1");
                          params.set("limit", "50000");
                          if (searchQuery.trim()) {
                            params.set("search", searchQuery.trim());
                          }
                          const res = await axiosInstance.get(
                            `/api/v1/meters?${params.toString()}`,
                          );
                          return (res.data?.data ?? []) as AdminMeterData[];
                        }}
                      />
                    </Card>
                  </div>
                </div>
              );
            default:
              return null;
          }
        }}
      />

      {open && selectedMeter && (
          <Modal visible={open} onClose={handleCloseModal}>
            <div className="space-y-4 p-4">
              <h2 className="text-lg font-semibold">Remove Meter</h2>
              <p>
                Are you sure you want to remove meter{" "}
                <strong>{selectedMeter.meterNumber}</strong>?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRemoveMeter}>
                  Remove
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {assignMeter && (
          <Modal visible={assignMeter} onClose={handleAssignMeter}>
            <AssignMeterForm
              close={handleAssignMeter}
              refresh={handleRefresh}
            />
          </Modal>
        )}

        {reassignMeterRow && (
          <Modal
            visible={Boolean(reassignMeterRow)}
            onClose={handleCloseReassignMeter}
          >
            <ReassignMeterForm
              meterNumber={reassignMeterRow.meterNumber}
              estateId={extractEstateId(reassignMeterRow.estateId) ?? undefined}
              companyId={
                normalizeUserId(reassignMeterRow.companyId) || undefined
              }
              estateOptions={estateOptions}
              estatesLoading={estatesLoading}
              close={handleCloseReassignMeter}
              refresh={handleRefresh}
              title={
                extractEstateId(reassignMeterRow.estateId)
                  ? "Reassign to estate"
                  : "Assign to estate"
              }
            />
          </Modal>
        )}

        {/* View details modal */}
        <Modal
          visible={detailsModalOpen}
          onClose={handleCloseDetailsModal}
          contentClassName="md:w-[min(720px,95vw)] lg:w-[min(800px,95vw)]"
        >
          <div className="space-y-6 p-4 pr-8">
            <h2 className="text-lg font-semibold">Meter details</h2>
            {detailsLoading ? (
              <div className="py-6 flex justify-center">
                <Loader label="Loading details..." />
              </div>
            ) : meterDetails ? (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Meter number</dt>
                  <dd className="font-medium">
                    {meterDetails.meterNumber ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estate/Company</dt>
                  <dd className="font-medium">
                    {resolveEstateOrCompanyLabel(
                      meterDetails,
                      estateNameById,
                      companyNameById,
                    ) ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        meterDetails.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {meterDetails.isActive ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Assigned</dt>
                  <dd>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        meterDetails.isAssigned
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {meterDetails.isAssigned ? "Yes" : "No"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium">
                    {formatAddressData(toAddressData(meterDetails.addressId))}
                  </dd>
                </div>
                {meterDetails.lastCredit != null && (
                  <div>
                    <dt className="text-muted-foreground">Last credit</dt>
                    <dd className="font-medium">{meterDetails.lastCredit}</dd>
                  </div>
                )}
                {meterDetails.createdAt && (
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">
                      {new Date(meterDetails.createdAt).toLocaleString()}
                    </dd>
                  </div>
                )}
                {meterDetails.vendorData &&
                  typeof meterDetails.vendorData === "object" && (
                    <>
                      <div>
                        <dt className="text-muted-foreground">Vendor</dt>
                        <dd className="font-medium">
                          {meterDetails.vendorData.name ?? "—"}
                        </dd>
                      </div>
                      {meterDetails.vendorData.utilityName && (
                        <div>
                          <dt className="text-muted-foreground">Utility</dt>
                          <dd className="font-medium">
                            {meterDetails.vendorData.utilityName}
                          </dd>
                        </div>
                      )}
                    </>
                  )}
              </dl>
            ) : detailsAddressId ? (
              <p className="text-muted-foreground py-4">
                Could not load meter details.
              </p>
            ) : null}

            {detailsMeterNumber ? (
              <MeterEnergyUsageSection
                data={meterUsage}
                loading={meterUsageLoading}
                range={meterUsageRange}
                onRangeChange={setMeterUsageRange}
                exportFileName={`meter_${detailsMeterNumber}_energy_usage`}
                emptyMessage={
                  meterUsageMessage ||
                  meterUsage?.hint ||
                  "No energy usage data for this period. The meter may be offline or have no history yet."
                }
              />
            ) : null}
          </div>
        </Modal>
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={"this meter"}
        title="Delete meter"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />

      <ClearTamperTokenModal
        visible={clearTamperOpen}
        meterNumber={clearTamperMeterNumber}
        token={clearTamperTokenValue}
        onClose={handleCloseClearTamper}
      />
    </div>
  );
}
