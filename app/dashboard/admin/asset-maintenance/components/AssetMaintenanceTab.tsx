"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/redux/store";
import { getAssetCategories, getAssets, type AssetCategory } from "@/redux/slice/admin/asset-mgt/admin-asset";
import {
  createAssetMaintenance,
  getAssetMaintenanceList,
  updateAssetMaintenance,
  type AssetMaintenanceRecord,
} from "@/redux/slice/admin/asset-maintenance/admin-asset-maintenance";
import { selectAdminAssetMaintenance } from "@/redux/slice/admin/asset-maintenance/admin-asset-maintenance-slice";
import { buildAssetNameMap } from "@/lib/maintenance-schedule-calendar";
import MaintenanceFormModal from "./MaintenanceFormModal";
import MaintenanceScheduleCalendar from "./MaintenanceScheduleCalendar";
import MaintenanceRecordsTable from "./MaintenanceRecordsTable";

const SCHEDULE_LIST_LIMIT = 500;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
  estateName: string;
};

export default function AssetMaintenanceTab({
  estateId,
  estateName,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetMaintenanceRecord | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [scheduleRecords, setScheduleRecords] = useState<AssetMaintenanceRecord[]>(
    [],
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [assetNamesById, setAssetNamesById] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  const { createStatus, updateStatus } = useSelector(selectAdminAssetMaintenance);

  const fetchScheduleRecords = useCallback(
    async (id: string) => {
      if (!id) {
        setScheduleRecords([]);
        return;
      }
      setScheduleLoading(true);
      try {
        const res = await dispatch(
          getAssetMaintenanceList({
            estateId: id,
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
    if (estateId) void fetchScheduleRecords(estateId);
  }, [fetchScheduleRecords, estateId]);

  const bumpRecordsRefresh = useCallback(() => {
    setRecordsRefreshKey((k) => k + 1);
    refreshSchedule();
  }, [refreshSchedule]);

  useEffect(() => {
    if (!estateId) return;
    void fetchScheduleRecords(estateId);
  }, [estateId, fetchScheduleRecords]);

  useEffect(() => {
    if (!estateId) return;
    (async () => {
      try {
        const categoriesRes = await dispatch(
          getAssetCategories({ estateId, page: 1, limit: 200 }),
        ).unwrap();
        setCategories(categoriesRes?.data ?? []);
      } catch {
        setCategories([]);
      }
    })();
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) {
      setAssetNamesById(new Map());
      return;
    }
    (async () => {
      try {
        const res = await dispatch(
          getAssets({ estateId, page: 1, limit: 500 }),
        ).unwrap();
        setAssetNamesById(buildAssetNameMap(res?.data ?? []));
      } catch {
        setAssetNamesById(new Map());
      }
    })();
  }, [dispatch, estateId]);

  const openCreate = () => {
    if (!estateId) {
      toast.info("No estate linked to your account.");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">

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
        scheduleDisabled={!estateId}
        onSchedule={openCreate}
        onEventClick={(record) => {
          setEditing(record);
          setModalOpen(true);
        }}
      />

      <MaintenanceRecordsTable
        estateId={estateId}
        isActiveFilter={isActiveFilter}
        categories={categories}
        refreshKey={recordsRefreshKey}
        onRecordsChange={refreshSchedule}
        onEdit={(record) => {
          setEditing(record);
          setModalOpen(true);
        }}
      />

      <MaintenanceFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        loading={createStatus === "isLoading" || updateStatus === "isLoading"}
        estateId={estateId}
        estateName={estateName}
        categories={categories}
        initial={editing}
        onCreate={async (payload) => {
          try {
            await dispatch(createAssetMaintenance(payload)).unwrap();
            toast.success("Maintenance record created.");
            setModalOpen(false);
            bumpRecordsRefresh();
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
            bumpRecordsRefresh();
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
