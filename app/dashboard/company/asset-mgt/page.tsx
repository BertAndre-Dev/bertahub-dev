"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";
import Loader from "@/components/ui/Loader";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  getAssetCategories,
  getAssets,
  type AssetCategory,
} from "@/redux/slice/company/asset-mgt/company-asset";
import {
  getAssetMaintenanceList,
  type AssetMaintenanceRecord,
} from "@/redux/slice/company/asset-maintenance/company-asset-maintenance";
import { buildAssetNameMap } from "@/lib/maintenance-schedule-calendar";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "../asset/lib/estate";
import MaintenanceScheduleCalendar from "./components/MaintenanceScheduleCalendar";
import MaintenanceRecordsTable from "./components/MaintenanceRecordsTable";

const SCHEDULE_LIST_LIMIT = 500;

type EstateSelectOption = { label: string; value: string };

export default function CompanyAssetMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [scheduleRecords, setScheduleRecords] = useState<AssetMaintenanceRecord[]>(
    [],
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [assetNamesById, setAssetNamesById] = useState<Map<string, string>>(
    () => new Map(),
  );

  const selectedEstateId = selectedEstate?.value ?? "";

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  const pageLoading = estatesLoading;

  const fetchScheduleRecords = useCallback(
    async (estateId: string) => {
      if (!estateId) {
        setScheduleRecords([]);
        return;
      }
      setScheduleLoading(true);
      try {
        const res = await dispatch(
          getAssetMaintenanceList({
            estateId,
            page: 1,
            limit: SCHEDULE_LIST_LIMIT,
            isActive: isActiveFilter || undefined,
          }),
        ).unwrap();
        setScheduleRecords(res?.data ?? []);
      } catch {
        setScheduleRecords([]);
        toast.error("Failed to load maintenance schedule.");
      } finally {
        setScheduleLoading(false);
      }
    },
    [dispatch, isActiveFilter],
  );

  const refreshSchedule = useCallback(() => {
    if (selectedEstateId) {
      void fetchScheduleRecords(selectedEstateId);
    }
  }, [fetchScheduleRecords, selectedEstateId]);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch {
          toast.error("Failed to fetch company estates.");
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedEstateId) return;
    void fetchScheduleRecords(selectedEstateId);
  }, [selectedEstateId, fetchScheduleRecords]);

  useEffect(() => {
    if (!selectedEstateId) return;
    (async () => {
      try {
        const categoriesRes = await dispatch(
          getAssetCategories({ estateId: selectedEstateId, page: 1, limit: 200 }),
        ).unwrap();
        setCategories(categoriesRes?.data ?? []);
      } catch {
        setCategories([]);
      }
    })();
  }, [dispatch, selectedEstateId]);

  useEffect(() => {
    if (!selectedEstateId) {
      setAssetNamesById(new Map());
      return;
    }
    (async () => {
      try {
        const res = await dispatch(
          getAssets({ estateId: selectedEstateId, page: 1, limit: 500 }),
        ).unwrap();
        setAssetNamesById(buildAssetNameMap(res?.data ?? []));
      } catch {
        setAssetNamesById(new Map());
      }
    })();
  }, [dispatch, selectedEstateId]);

  return (
    <div className="relative space-y-6">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex min-h-[200px] items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading..." />
        </div>
      )}

      <div
        className={
          pageLoading ? "pointer-events-none select-none blur-sm opacity-60" : ""
        }
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Asset Maintenance</h1>
            <p className="mt-1 text-muted-foreground">
              View maintenance schedules for assets under{" "}
              <span className="font-bold uppercase text-black">{companyName}</span>.
              Scheduling is managed by estate administrators.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-48 min-w-[12rem]">
              <Select
                options={estateOptions}
                placeholder="Filter by estate"
                value={selectedEstate}
                onChange={(option) =>
                  setSelectedEstate(option as EstateSelectOption | null)
                }
                isSearchable
                isDisabled={!estateOptions.length}
                styles={{
                  control: (base) => ({ ...base, cursor: "pointer" }),
                  option: (base) => ({ ...base, cursor: "pointer" }),
                  dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                  clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="maint-active-filter" className="text-sm font-medium">
              Status
            </label>
            <select
              id="maint-active-filter"
              className="h-10 cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </div>
        </div>

        <MaintenanceScheduleCalendar
          records={scheduleRecords}
          assetNamesById={assetNamesById}
          loading={scheduleLoading}
          showScheduleButton={false}
        />

        <MaintenanceRecordsTable
          estateId={selectedEstateId}
          isActiveFilter={isActiveFilter}
          categories={categories}
          onRecordsChange={refreshSchedule}
          readOnly
        />
      </div>
    </div>
  );
}
