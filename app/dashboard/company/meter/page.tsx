"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import type { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import {
  Plus,
  Search,
  MoreVertical,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MeterEnergyUsageSection } from "@/components/charts/meter-energy-usage-section";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import Tab from "@/components/tabs/page";
import {
  getMeterUsage,
  type MeterUsageRange,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getCompanyEnergyConsumptionChart } from "@/redux/slice/company/energy-consumption/company-energy-consumption";
import { getCompanyEstateEnergyUsage } from "@/redux/slice/company/estate-energy-usage/company-estate-energy-usage";
import {
  deleteCompanyMeter,
  getCompanyMeterByAddressId,
  getCompanyMeters,
} from "@/redux/slice/company/meter-mgt/company-meter";
import {
  ALL_METERS_ESTATE_ID,
  applyCompanyMeterSearch,
  clearCompanyMeterSearch,
  setCompanyMeterEnergyPeriod,
  setCompanyMeterEstateId,
  setCompanyMeterSearchInput,
  setCompanyMeterUsageRange,
  type Pagination,
} from "@/redux/slice/company/meter-mgt/company-meter-slice";
import CompanyAssignMeterForm from "@/components/company/meter-form/page";
import CompanyAssignMeterToEstateForm from "@/components/company/assign-meter-to-estate-form/page";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseCompanyFromUser } from "../lib/company";
import {
  extractEstateId,
  normalizeUserId,
  resolveEstateDisplayName,
} from "@/lib/user-id";
import { formatAddressRecordCreatedAt, formatAddressEntryLabel } from "@/lib/address";

type AddressIdInput = string | { id: string; data?: Record<string, unknown> };
type IdRef = string | { id?: string; _id?: string; name?: string };

interface CompanyMeterRow {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: IdRef;
  companyId?: IdRef;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId?: AddressIdInput;
  vendorData?: {
    name?: string;
    utilityName?: string;
  };
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

const METER_TAB_TITLES = ["Meter Management", "Chart Overview"] as const;

const ALL_ESTATES_OPTION: EstateOption = {
  label: "All",
  value: ALL_METERS_ESTATE_ID,
};

const ESTATE_FILTER_FETCH_LIMIT = 500;

export default function CompanyMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [assignMeter, setAssignMeter] = useState(false);
  const [reassignMeterRow, setReassignMeterRow] =
    useState<CompanyMeterRow | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsAddressId, setDetailsAddressId] = useState<string | null>(null);
  const [detailsMeterNumber, setDetailsMeterNumber] = useState<string | null>(
    null,
  );
  const [meterUsageRange, setMeterUsageRange] =
    useState<MeterUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    meters,
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
    const companyMeter = state.companyMeter;
    const filters = companyMeter.filters ?? {
      selectedEstateId: ALL_METERS_ESTATE_ID,
      searchInput: "",
      searchQuery: "",
      usageRange: "weekly" as const,
      energyPeriod: "weekly" as const,
    };
    return {
      meters: (companyMeter?.meterList?.data || []) as CompanyMeterRow[],
      pagination: (companyMeter?.meterList?.pagination ??
        null) as Pagination | null,
      loading: isPending(companyMeter?.getMetersState),
      meterDetails: companyMeter?.meterDetails ?? null,
      detailsLoading: companyMeter?.getMeterByAddressIdState === "isLoading",
      selectedEstateId: filters.selectedEstateId || ALL_METERS_ESTATE_ID,
      searchInput: filters.searchInput,
      searchQuery: filters.searchQuery,
      usageRange: filters.usageRange,
      energyPeriod: filters.energyPeriod,
    };
  });

  const { allEstates, estatesLoading } = useSelector((state: RootState) => ({
    allEstates: state.companyEstate.allEstates?.data ?? [],
    estatesLoading: state.companyEstate.getAllEstatesStatus === "isLoading",
  }));

  const companyId = useSelector((state: RootState) => {
    const user = state.auth.user as Record<string, unknown> | null;
    if (!user) return "";
    return parseCompanyFromUser(user)?.id ?? "";
  });

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
      energyConsumptionChart: state.companyEnergyConsumption.chart,
      energyChartLoading:
        state.companyEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.companyEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.companyEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.companyEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.companyEstateEnergyUsage.message,
    estateEnergyUsageError: state.companyEstateEnergyUsage.error,
  }));

  const isAllEstates = selectedEstateId === ALL_METERS_ESTATE_ID;
  const chartEstateId = isAllEstates ? "" : selectedEstateId;

  const estateNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const estate of allEstates) {
      const id = estate?.id ?? estate?._id;
      const name = estate?.name;
      if (id && name) map[String(id)] = String(name);
    }
    return map;
  }, [allEstates]);

  const estateOptions = useMemo<EstateOption[]>(
    () => [
      ALL_ESTATES_OPTION,
      ...Object.entries(estateNameById)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ],
    [estateNameById],
  );

  const selectedEstate =
    estateOptions.find((o) => o.value === selectedEstateId) ??
    ALL_ESTATES_OPTION;

  const pageSize = Number(pagination?.pageSize) || 10;

  const fetchMeters = useCallback(
    async (page = 1, search = searchQuery) => {
      await dispatch(
        getCompanyMeters({
          page,
          limit: pageSize,
          search: search || undefined,
          estateId: selectedEstateId || ALL_METERS_ESTATE_ID,
        }),
      ).unwrap();
    },
    [dispatch, selectedEstateId, pageSize, searchQuery],
  );

  useEffect(() => {
    if (companyId) return;
    dispatch(getSignedInUser())
      .unwrap()
      .then((userRes) => {
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        if (!parseCompanyFromUser(data)) {
          toast.warning("No company linked to your account.");
        }
      })
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, companyId]);

  useEffect(() => {
    dispatch(getCompanyEstates({ page: 1, limit: ESTATE_FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch]);

  useEffect(() => {
    fetchMeters(1, searchQuery).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [selectedEstateId, searchQuery, fetchMeters, isAllEstates]);

  useEffect(() => {
    if (!chartEstateId) return;
    dispatch(
      getCompanyEstateEnergyUsage({
        estateId: chartEstateId,
        range: usageRange,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, chartEstateId, usageRange]);

  useEffect(() => {
    if (!chartEstateId) return;
    dispatch(
      getCompanyEnergyConsumptionChart({
        estateId: chartEstateId,
        period: energyPeriod,
      }),
    ).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch, chartEstateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!chartEstateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getCompanyEstateEnergyUsage({
          estateId: chartEstateId,
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
    if (isAllEstates || !chartEstateId) {
      return "Select an estate to view energy data.";
    }
    return undefined;
  }, [estatesLoading, isAllEstates, chartEstateId]);

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

  const handleAssignMeter = () => {
    setAssignMeter((prev) => !prev);
  };

  const handleOpenReassignMeter = (meter: CompanyMeterRow) => {
    setReassignMeterRow(meter);
  };

  const handleCloseReassignMeter = () => {
    setReassignMeterRow(null);
  };

  const handleViewDetails = (meter: CompanyMeterRow) => {
    const addressIdStr = toAddressIdString(meter.addressId);
    if (!addressIdStr) {
      toast.warning("No address linked to this meter yet");
      return;
    }
    setDetailsAddressId(addressIdStr);
    setDetailsMeterNumber(meter.meterNumber);
    setMeterUsageRange("weekly");
    setDetailsModalOpen(true);
    dispatch(getCompanyMeterByAddressId(addressIdStr)).catch(
      (err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      },
    );
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
    setItemToDelete({ id: meterId });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      const response = await dispatch(deleteCompanyMeter(itemToDelete.id)).unwrap();
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
      render: (item: CompanyMeterRow) =>
        formatAddressRecordCreatedAt(item.createdAt),
      exportValue: (item: CompanyMeterRow) =>
        formatAddressRecordCreatedAt(item.createdAt),
    },
    { key: "meterNumber", header: "Meter Number" },
    {
      key: "estateId",
      header: "Estate",
      render: (item: CompanyMeterRow) => {
        const label = resolveEstateDisplayName(item.estateId, estateNameById);
        if (!label) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              Not assigned
            </span>
          );
        }
        return <span className="font-medium">{label}</span>;
      },
      exportValue: (item: CompanyMeterRow) =>
        resolveEstateDisplayName(item.estateId, estateNameById) ??
        "Not assigned",
    },
    {
      key: "address",
      header: "Address",
      render: (item: CompanyMeterRow) => {
        const label = formatAddressEntryLabel(toAddressData(item.addressId));
        if (!label) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              Not assigned
            </span>
          );
        }
        return label;
      },
      exportValue: (item: CompanyMeterRow) =>
        formatAddressEntryLabel(toAddressData(item.addressId)) || "Not assigned",
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: CompanyMeterRow) => (
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
      render: (item: CompanyMeterRow) => (
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
      header: "Actions",
      exportable: false,
      render: (item: CompanyMeterRow) => {
        const hasEstate = Boolean(extractEstateId(item.estateId));
        const canAssignOrReassign =
          hasEstate ||
          Boolean(normalizeUserId(item.companyId) || companyId);
        const canView = Boolean(toAddressIdString(item.addressId));

        return (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Actions"
                className="cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[220px] rounded-md border bg-white p-1 shadow-md"
              >
                {canAssignOrReassign ? (
                  <DropdownMenu.Item
                    disabled={!companyId}
                    onSelect={() => handleOpenReassignMeter(item)}
                    className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    {hasEstate ? "Reassign to estate" : "Assign to estate"}
                  </DropdownMenu.Item>
                ) : null}
                <DropdownMenu.Item
                  disabled={!canView}
                  onSelect={() => handleViewDetails(item)}
                  className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  View details
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => handleDeleteMeter(item.id!)}
                  className="cursor-pointer select-none rounded px-3 py-2 text-sm text-red-600 outline-none hover:bg-gray-100 focus:bg-gray-100 hover:text-red-700"
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        );
      },
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
          <div className="w-full sm:w-56">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) =>
                dispatch(
                  setCompanyMeterEstateId(
                    option?.value ?? ALL_METERS_ESTATE_ID,
                  ),
                )
              }
              isSearchable
              isLoading={estatesLoading}
              isDisabled={estatesLoading}
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
          <Button
            onClick={handleAssignMeter}
            className="flex items-center gap-2 cursor-pointer"
            disabled={!companyId}
          >
            <Plus className="w-4 h-4" /> Add Meter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Meters",
              value: pagination?.total ?? 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Meters",
              value: meters.filter((meter) => meter.isActive).length || 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#CCE4DB80]",
            },
          ];

          return stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
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
                  <EstatePowerUsageSection
                    data={estateEnergyUsage}
                    loading={
                      estatesLoading ||
                      (!!chartEstateId && estateEnergyUsageLoading)
                    }
                    progress={estateEnergyUsageProgress}
                    range={usageRange}
                    onRangeChange={(range) =>
                      dispatch(setCompanyMeterUsageRange(range))
                    }
                    onRefresh={chartEstateId ? handleRefreshUsage : undefined}
                    refreshing={usageRefreshing}
                    exportFileName={
                      chartEstateId && selectedEstate
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
                      (!!chartEstateId && energyChartLoading)
                    }
                    period={energyPeriod}
                    onPeriodChange={(period) =>
                      dispatch(setCompanyMeterEnergyPeriod(period))
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
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
                          <input
                            placeholder="Search by meter number."
                            value={searchInput}
                            onChange={(e) =>
                              dispatch(
                                setCompanyMeterSearchInput(e.target.value),
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                dispatch(applyCompanyMeterSearch());
                              }
                              if (e.key === "Escape") {
                                dispatch(clearCompanyMeterSearch());
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {searchInput.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => dispatch(applyCompanyMeterSearch())}
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
                        data={meters}
                        emptyMessage={
                          isAllEstates
                            ? "No company meters found."
                            : "No estate meters found."
                        }
                        showPagination
                        onSearch={(value) =>
                          dispatch(setCompanyMeterSearchInput(value))
                        }
                        paginationInfo={{
                          total: pagination?.total || 0,
                          current: Number(pagination?.currentPage) || 1,
                          pageSize: Number(pagination?.pageSize) || 10,
                        }}
                        onPageChange={(page) => {
                          fetchMeters(page, searchQuery).catch((err: unknown) => {
                            const message = getApiErrorMessage(err);
                            if (message) toast.error(message);
                          });
                        }}
                        enableExport
                        exportFileName={
                          isAllEstates ? "company-meters" : "estate-meters"
                        }
                        onExportRequest={async () => {
                          const res = await dispatch(
                            getCompanyMeters({
                              page: 1,
                              limit: 50000,
                              estateId: selectedEstateId,
                            }),
                          ).unwrap();
                          return res?.data ?? [];
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

      {assignMeter && companyId && (
        <Modal visible={assignMeter} onClose={handleAssignMeter}>
          <CompanyAssignMeterForm
            companyId={companyId}
            close={handleAssignMeter}
            refresh={handleRefresh}
          />
        </Modal>
      )}

      {reassignMeterRow && companyId && (
        <Modal
          visible={Boolean(reassignMeterRow)}
          onClose={handleCloseReassignMeter}
        >
          <CompanyAssignMeterToEstateForm
            meterNumber={reassignMeterRow.meterNumber}
            companyId={
              normalizeUserId(reassignMeterRow.companyId) || companyId
            }
            estateId={extractEstateId(reassignMeterRow.estateId) ?? undefined}
            close={handleCloseReassignMeter}
            refresh={handleRefresh}
          />
        </Modal>
      )}

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
                <dt className="text-muted-foreground">Estate</dt>
                <dd className="font-medium">
                  {resolveEstateDisplayName(
                    meterDetails.estateId,
                    estateNameById,
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
    </div>
  );
}
