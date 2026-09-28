"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Settings2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import type { AppDispatch, RootState } from "@/redux/store";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import {
  getEnergyProviderConfigs,
  type EnergyProviderConfigRow,
} from "@/redux/slice/super-admin/energy-provider-config/energy-provider-config";
import { getEnergyProviderVends } from "@/redux/slice/energy-provider/vends/energy-provider-vends";
import {
  energyProviderDisplayName,
  formatCommissionPercent,
  formatCommissionRecipient,
  formatEnergyProviderDate,
} from "@/lib/energy-provider-list";
import EnergyProviderCommissionForm from "./components/EnergyProviderCommissionForm";
import EnergyProviderVendsTab from "./components/EnergyProviderVendsTab";
import { getApiErrorMessage } from "@/lib/api-error";

const PAGE_SIZE = 10;
const ESTATE_FETCH_LIMIT = 500;

type EstateOption = { label: string; value: string };
type ActiveTab = "configurations" | "vend-history";

export default function SuperAdminEnergyProviderPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("configurations");
  const [configOpen, setConfigOpen] = useState(false);
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null);
  const [loadingEstates, setLoadingEstates] = useState(true);
  const [vendsPage, setVendsPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [vendsPageSize, setVendsPageSize] = useState(PAGE_SIZE);
  const [vendsStartDate, setVendsStartDate] = useState("");
  const [vendsEndDate, setVendsEndDate] = useState("");

  const { list, pagination, configsStatus } = useSelector((state: RootState) => ({
    list: state.superAdminEnergyProviderConfig.list,
    pagination: state.superAdminEnergyProviderConfig.pagination,
    configsStatus: state.superAdminEnergyProviderConfig.getListStatus as string,
  }));

  const { vends, vendsPagination, vendsStatus } = useSelector(
    (state: RootState) => ({
      vends: state.energyProviderVends.list,
      vendsPagination: state.energyProviderVends.pagination,
      vendsStatus: state.energyProviderVends.status as string,
    }),
  );

  useEffect(() => {
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getAllEstates({ page: 1, limit: ESTATE_FETCH_LIMIT }),
        ).unwrap();
        const rows = (res?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
        }>;
        const options = rows
          .map((e) => ({
            value: e.id ?? e._id ?? "",
            label: e.name ?? "Unnamed estate",
          }))
          .filter((e) => e.value);
        setEstateOptions(options);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  const fetchConfigs = useCallback(
    (page = 1, limit = pageSize) => {
      if (!selectedEstate?.value) return Promise.resolve();
      return dispatch(
        getEnergyProviderConfigs({
          estateId: selectedEstate.value,
          estateName: selectedEstate.label,
          page,
          limit,
        }),
      ).unwrap();
    },
    [dispatch, pageSize, selectedEstate],
  );

  const fetchVends = useCallback(
    (page = 1, limit = vendsPageSize) => {
      if (!selectedEstate?.value) return Promise.resolve();
      const shouldApplyDate = Boolean(vendsStartDate && vendsEndDate);
      return dispatch(
        getEnergyProviderVends({
          estateId: selectedEstate.value,
          page,
          limit,
          startDate: shouldApplyDate ? vendsStartDate : undefined,
          endDate: shouldApplyDate ? vendsEndDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch, selectedEstate, vendsPageSize, vendsStartDate, vendsEndDate],
  );

  useEffect(() => {
    if (activeTab !== "configurations" || !selectedEstate?.value) return;
    fetchConfigs(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [activeTab, selectedEstate, fetchConfigs]);

  useEffect(() => {
    if (activeTab !== "vend-history" || !selectedEstate?.value) return;
    fetchVends(vendsPage).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [activeTab, selectedEstate, vendsPage, fetchVends]);

  const configColumns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: EnergyProviderConfigRow) =>
          formatEnergyProviderDate(item.createdAt),
        exportValue: (item: EnergyProviderConfigRow) => item.createdAt ?? "",
      },
      {
        key: "name",
        header: "Energy provider",
        render: (item: EnergyProviderConfigRow) =>
          energyProviderDisplayName(item),
        exportValue: (item: EnergyProviderConfigRow) =>
          energyProviderDisplayName(item),
      },
      {
        key: "email",
        header: "Email",
      },
      {
        key: "commissionPercent",
        header: "Commission",
        render: (item: EnergyProviderConfigRow) =>
          formatCommissionPercent(item.commissionPercent),
        exportValue: (item: EnergyProviderConfigRow) =>
          `${item.commissionPercent}%`,
      },
      {
        key: "commissionRecipient",
        header: "Recipient",
        render: (item: EnergyProviderConfigRow) =>
          formatCommissionRecipient(item.commissionRecipient),
        exportValue: (item: EnergyProviderConfigRow) =>
          item.commissionRecipient ?? "",
      },
      {
        key: "isActive",
        header: "Status",
        render: (item: EnergyProviderConfigRow) => (
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
        exportValue: (item: EnergyProviderConfigRow) =>
          item.isActive ? "Active" : "Inactive",
      },
    ],
    [],
  );

  const handleConfigSuccess = () => {
    setConfigOpen(false);
    fetchConfigs(pagination?.currentPage ?? 1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  };

  const handleEstateChange = (option: EstateOption | null) => {
    setSelectedEstate(option);
    setVendsPage(1);
  };

  const tabLoading =
    loadingEstates ||
    (Boolean(selectedEstate?.value) &&
      ((activeTab === "configurations" && isPending(configsStatus)) ||
        (activeTab === "vend-history" && isPending(vendsStatus))));

  return (
    <div className="relative space-y-6">
      {tabLoading && <Loader fullScreen label="Loading..." />}

      <div
        className={[
          "space-y-6",
          tabLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Energy Provider Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View configurations and vend history per estate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="w-full sm:w-56">
              <Select
                options={estateOptions}
                value={selectedEstate}
                onChange={handleEstateChange}
                isLoading={loadingEstates}
                placeholder="Filter by estate"
                isSearchable
              />
            </div>

            <Button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex items-center justify-center gap-2 cursor-pointer"
              disabled={!selectedEstate?.value}
            >
              <Settings2 className="w-4 h-4" />
              Configure commission
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
            {[
              { id: "configurations" as const, label: "Configurations" },
              { id: "vend-history" as const, label: "Vend history" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "vend-history") setVendsPage(1);
                }}
                className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "configurations" ? (
            <Table
              columns={configColumns}
              data={list}
              emptyMessage={
                selectedEstate?.value
                  ? "No energy provider configurations found for this estate"
                  : "Select an estate to view configurations"
              }
              showPagination
              paginationInfo={{
                total: pagination?.total ?? 0,
                current: pagination?.currentPage ?? 1,
                pageSize,
              }}
              onPageChange={(page) => {
                fetchConfigs(page).catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                fetchConfigs(1, size).catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
              }}
              enableExport
              exportFileName="energy-provider-configs"
              onExportRequest={async () => {
                if (!selectedEstate?.value) return [];
                const res = await dispatch(
                  getEnergyProviderConfigs({
                    estateId: selectedEstate.value,
                    estateName: selectedEstate.label,
                    page: 1,
                    limit: 50000,
                  }),
                ).unwrap();
                return res.data;
              }}
            />
          ) : (
            <EnergyProviderVendsTab
              data={vends}
              startDate={vendsStartDate}
              endDate={vendsEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setVendsStartDate(startDate);
                setVendsEndDate(endDate);
                setVendsPage(1);
              }}
              paginationInfo={{
                total: vendsPagination?.total ?? 0,
                current: vendsPagination?.currentPage ?? 1,
                pageSize: vendsPageSize,
              }}
              onPageChange={setVendsPage}
              onPageSizeChange={(size) => {
                setVendsPageSize(size);
                setVendsPage(1);
              }}
              onExportRequest={async () => {
                if (!selectedEstate?.value) return [];
                const shouldApplyDate = Boolean(vendsStartDate && vendsEndDate);
                const res = await dispatch(
                  getEnergyProviderVends({
                    estateId: selectedEstate.value,
                    page: 1,
                    limit: 50000,
                    startDate: shouldApplyDate ? vendsStartDate : undefined,
                    endDate: shouldApplyDate ? vendsEndDate : undefined,
                  }),
                ).unwrap();
                return res.data;
              }}
            />
          )}
        </Card>
      </div>

      {configOpen && (
        <Modal
          visible={configOpen}
          onClose={() => setConfigOpen(false)}
          contentClassName="md:w-[55%] lg:w-[45%] xl:w-[40%]"
        >
          <EnergyProviderCommissionForm
            onClose={() => setConfigOpen(false)}
            onSuccess={handleConfigSuccess}
          />
        </Modal>
      )}
    </div>
  );
}
