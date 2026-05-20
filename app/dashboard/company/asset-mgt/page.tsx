"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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
  createAssetMaintenance,
  getAssetMaintenanceList,
  updateAssetMaintenance,
  type AssetMaintenanceRecord,
} from "@/redux/slice/company/asset-maintenance/company-asset-maintenance";
import { selectCompanyAssetMaintenance } from "@/redux/slice/company/asset-maintenance/company-asset-maintenance-slice";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "../asset/lib/estate";
import MaintenanceFormModal from "./components/MaintenanceFormModal";
import MaintenanceScheduleCalendar from "./components/MaintenanceScheduleCalendar";

const SCHEDULE_LIST_LIMIT = 500;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function CompanyAssetMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstateId, setSelectedEstateId] = useState("");
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetMaintenanceRecord | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);

  const { records, getListStatus, createStatus, updateStatus } = useSelector(
    selectCompanyAssetMaintenance,
  );

  const pageLoading = estatesLoading || getListStatus === "isLoading";

  const fetchList = useCallback(
    (estateId: string) => {
      if (!estateId) return Promise.resolve();
      return dispatch(
        getAssetMaintenanceList({
          estateId,
          page: 1,
          limit: SCHEDULE_LIST_LIMIT,
          isActive: isActiveFilter || undefined,
        }),
      ).unwrap();
    },
    [dispatch, isActiveFilter],
  );

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
        setSelectedEstateId(options[0]?.id ?? "");
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedEstateId) return;
    fetchList(selectedEstateId).catch(() =>
      toast.error("Failed to load maintenance records."),
    );
  }, [selectedEstateId, fetchList]);

  useEffect(() => {
    if (!selectedEstateId) return;
    (async () => {
      try {
        const [categoriesRes] = await Promise.all([
          dispatch(getAssetCategories({ page: 1, limit: 200 })).unwrap(),
          dispatch(getAssets({ estateId: selectedEstateId, page: 1, limit: 1 })),
        ]);
        setCategories(categoriesRes?.data ?? []);
      } catch {
        setCategories([]);
      }
    })();
  }, [dispatch, selectedEstateId]);

  const openCreate = () => {
    if (!estates.length) {
      toast.info("No estates available.");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

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
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Asset Maintenance</h1>
          <p className="mt-1 text-muted-foreground">
            Schedule and track maintenance for assets under{" "}
            <span className="font-bold uppercase text-black">{companyName}</span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="maint-estate-filter" className="text-sm font-medium">
              Estate
            </label>
            <select
              id="maint-estate-filter"
              className="h-10 min-w-[12rem] cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
              value={selectedEstateId}
              onChange={(e) => setSelectedEstateId(e.target.value)}
            >
              {estates.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
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
          records={records}
          loading={getListStatus === "isLoading" && !pageLoading}
          scheduleDisabled={!estates.length}
          onSchedule={openCreate}
          onEventClick={(record) => {
            setEditing(record);
            setModalOpen(true);
          }}
        />
      </div>

      <MaintenanceFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        loading={createStatus === "isLoading" || updateStatus === "isLoading"}
        estates={estates}
        defaultEstateId={selectedEstateId}
        categories={categories}
        initial={editing}
        onCreate={async (payload) => {
          try {
            await dispatch(createAssetMaintenance(payload)).unwrap();
            toast.success("Maintenance record created.");
            setModalOpen(false);
            await fetchList(payload.estateId);
            if (payload.estateId !== selectedEstateId) {
              setSelectedEstateId(payload.estateId);
            }
          } catch (err: unknown) {
            toast.error(
              (err as { message?: string })?.message ?? "Failed to create record.",
            );
          }
        }}
        onUpdate={async (payload) => {
          const id = getId(editing ?? undefined);
          if (!id) return;
          try {
            await dispatch(
              updateAssetMaintenance({ maintenanceId: id, ...payload }),
            ).unwrap();
            toast.success("Maintenance record updated.");
            setModalOpen(false);
            setEditing(null);
            await fetchList(selectedEstateId);
          } catch (err: unknown) {
            toast.error(
              (err as { message?: string })?.message ?? "Failed to update record.",
            );
          }
        }}
      />
    </div>
  );
}
