"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatRecurringSpan } from "@/lib/asset-maintenance-recurring";
import type { AppDispatch } from "@/redux/store";
import {
  getAssets,
  type Asset,
  type AssetCategory,
} from "@/redux/slice/staff/asset-mgt/staff-asset";
import {
  activateAssetMaintenance,
  deleteAssetMaintenance,
  getAssetMaintenanceList,
  suspendAssetMaintenance,
  type AssetMaintenanceRecord,
} from "@/redux/slice/staff/asset-maintenance/staff-asset-maintenance";
import { selectStaffAssetMaintenance } from "@/redux/slice/staff/asset-maintenance/staff-asset-maintenance-slice";

const PAGE_SIZE = 10;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

function lookupLabel(
  value: string | { id?: string; _id?: string; name?: string } | undefined,
  options: { id: string; name: string }[],
) {
  if (!value) return "—";
  if (typeof value !== "string") return value.name ?? "—";
  const match = options.find((o) => o.id === value);
  return match?.name ?? value;
}

type Props = {
  estateId: string;
  isActiveFilter: string;
  categories: AssetCategory[];
  onEdit: (record: AssetMaintenanceRecord) => void;
  refreshKey?: number;
  onRecordsChange?: () => void;
};

export default function MaintenanceRecordsTable({
  estateId,
  isActiveFilter,
  categories,
  onEdit,
  refreshKey = 0,
  onRecordsChange,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [itemToDelete, setItemToDelete] =
    useState<AssetMaintenanceRecord | null>(null);

  const {
    records,
    pagination,
    getListStatus,
    deleteStatus,
    suspendStatus,
    activateStatus,
  } = useSelector(selectStaffAssetMaintenance);

  const fetchList = useCallback(
    (estate: string, pageNum: number) => {
      if (!estate) return Promise.resolve();
      return dispatch(
        getAssetMaintenanceList({
          estateId: estate,
          page: pageNum,
          limit: PAGE_SIZE,
          isActive: isActiveFilter || undefined,
        }),
      ).unwrap();
    },
    [dispatch, isActiveFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [estateId, isActiveFilter]);

  useEffect(() => {
    if (!estateId) return;
    fetchList(estateId, page).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [estateId, page, fetchList, refreshKey]);

  useEffect(() => {
    if (!estateId) {
      setAssets([]);
      return;
    }
    (async () => {
      try {
        const res = await dispatch(
          getAssets({ estateId, page: 1, limit: 500 }),
        ).unwrap();
        setAssets(res?.data ?? []);
      } catch {
        setAssets([]);
      }
    })();
  }, [dispatch, estateId]);

  const columns = useMemo(
    () => [
      {
        key: "lastMaintenanceDate" as const,
        header: "Maintenance date", 
        render: (item: AssetMaintenanceRecord) =>
          item.lastMaintenanceDate
            ? new Date(item.lastMaintenanceDate).toLocaleString()
            : "—",
      },
      { key: "tag" as const, header: "Tag" },
      {
        key: "assetId" as const,
        header: "Asset",
        render: (item: AssetMaintenanceRecord) =>
          lookupLabel(
            item.assetId as never,
            assets.map((a) => ({
              id: getId(a),
              name: a.name ?? a.tag ?? "Asset",
            })),
          ),
      },
      {
        key: "categoryId" as const,
        header: "Category",
        render: (item: AssetMaintenanceRecord) =>
          lookupLabel(
            item.categoryId as never,
            categories.map((c) => ({ id: getId(c), name: c.name ?? "Category" })),
          ),
      },
      { key: "frequency" as const, header: "Frequency" },
      {
        key: "recurring" as const,
        header: "Recurring",
        render: (item: AssetMaintenanceRecord) =>
          formatRecurringSpan(
            item.recurring,
            item.recurringSpanMonths,
            item.recurringSpanYears,
          ),
      },
      {
        key: "note" as const,
        header: "Note",
        render: (item: AssetMaintenanceRecord) => item.note ?? "—",
      },
      {
        key: "isActive" as const,
        header: "Status",
        render: (item: AssetMaintenanceRecord) => (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.isActive !== false
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {item.isActive !== false ? "Active" : "Suspended"}
          </span>
        ),
      },
      {
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: AssetMaintenanceRecord) => {
          const id = getId(item);
          const active = item.isActive !== false;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 cursor-pointer"
                title={active ? "Suspend" : "Activate"}
                disabled={
                  suspendStatus === "isLoading" || activateStatus === "isLoading"
                }
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!id) return;
                  try {
                    if (active) {
                      await dispatch(suspendAssetMaintenance(id)).unwrap();
                      toast.success("Record suspended.");
                    } else {
                      await dispatch(activateAssetMaintenance(id)).unwrap();
                      toast.success("Record activated.");
                    }
                    await fetchList(estateId, page);
                    onRecordsChange?.();
                  } catch (err: unknown) {
                    const message = getApiErrorMessage(err);
                    if (message) toast.error(message);
                  }
                }}
              >
                {active ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 cursor-pointer text-destructive"
                disabled={deleteStatus === "isLoading"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!id) return;
                  setItemToDelete(item);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      activateStatus,
      assets,
      categories,
      dispatch,
      estateId,
      fetchList,
      onEdit,
      onRecordsChange,
      page,
      suspendStatus,
      deleteStatus,
    ],
  );

  const total = Number(pagination?.total ?? records.length);
  const current =
    Number(pagination?.currentPage ?? pagination?.page ?? page) || page;
  const pageSize =
    Number(pagination?.pageSize ?? pagination?.limit ?? PAGE_SIZE) || PAGE_SIZE;

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = getId(itemToDelete);
    if (!id) return;
    try {
      await dispatch(deleteAssetMaintenance(id)).unwrap();
      toast.success("Record deleted.");
      setItemToDelete(null);
      setPage(1);
      await fetchList(estateId, 1);
      onRecordsChange?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  return (
    <>
      <Card className="p-4">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Maintenance records
        </h2>
        <Table
          columns={columns}
          data={records}
          emptyMessage={
            estateId
              ? getListStatus === "isLoading"
                ? "Loading records..."
                : "No maintenance records yet."
              : "No estate linked to your account."
          }
          showPagination
          paginationInfo={{ total, current, pageSize }}
          onPageChange={(p) => setPage(p)}
          enableExport
          exportFileName="asset-maintenance"
          onExportRequest={() => Promise.resolve(records)}
        />
      </Card>
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.tag ?? "this record"}
        title="Delete record"
        loading={deleteStatus === "isLoading"}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
