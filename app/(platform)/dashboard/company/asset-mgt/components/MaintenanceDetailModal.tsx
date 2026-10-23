"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { MAINTENANCE_FREQUENCY_OPTIONS } from "@/lib/asset-maintenance-frequency";
import { formatRecurringSpan } from "@/lib/asset-maintenance-recurring";
import type { AppDispatch } from "@/redux/store";
import {
  getAssetMaintenanceComments,
  type AssetMaintenanceComment,
  type AssetMaintenanceRecord,
} from "@/redux/slice/company/asset-maintenance/company-asset-maintenance";
import { selectCompanyAssetMaintenance } from "@/redux/slice/company/asset-maintenance/company-asset-maintenance-slice";

type Props = {
  visible: boolean;
  onClose: () => void;
  record: AssetMaintenanceRecord | null;
  estateId?: string;
  assetName?: string;
};

function getId(v: { id?: string; _id?: string } | string | undefined) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.id || v._id || "";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function frequencyLabel(frequency?: string) {
  if (!frequency) return "—";
  const normalized = frequency.toLowerCase().replaceAll("_", "-");
  return (
    MAINTENANCE_FREQUENCY_OPTIONS.find((o) => o.value === normalized)?.label ??
    frequency
  );
}

function resolveAssetLabel(
  record: AssetMaintenanceRecord | null,
  assetName?: string,
) {
  if (assetName?.trim()) return assetName.trim();
  const asset = record?.assetId;
  if (asset && typeof asset !== "string" && asset.name?.trim()) {
    return asset.name.trim();
  }
  if (record?.tag?.trim()) return record.tag.trim();
  return "Asset";
}

function commentText(c: AssetMaintenanceComment) {
  return (c.comment ?? c.text ?? "").trim();
}

function commentAuthor(c: AssetMaintenanceComment) {
  if (c.userName?.trim()) return c.userName.trim();
  const name = [c.user?.firstName, c.user?.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return c.user?.email ?? "Admin";
}

export default function MaintenanceDetailModal({
  visible,
  onClose,
  record,
  estateId,
  assetName,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const maintenanceId = getId(record ?? undefined);
  const { commentsByMaintenanceId, getCommentsStatus } = useSelector(
    selectCompanyAssetMaintenance,
  );
  const comments = commentsByMaintenanceId[maintenanceId] ?? [];

  useEffect(() => {
    if (!visible || !maintenanceId) return;
    dispatch(
      getAssetMaintenanceComments({
        maintenanceId,
        estateId: estateId || undefined,
        page: 1,
        limit: 50,
      }),
    )
      .unwrap()
      .catch(() => {});
  }, [dispatch, estateId, maintenanceId, visible]);

  const details = useMemo(() => {
    if (!record) return [];
    return [
      { label: "Asset", value: resolveAssetLabel(record, assetName) },
      { label: "Tag", value: record.tag?.trim() || "—" },
      {
        label: "Maintenance date",
        value: formatDate(record.lastMaintenanceDate),
      },
      {
        label: "Next maintenance",
        value: formatDate(record.nextMaintenanceDate),
      },
      { label: "Frequency", value: frequencyLabel(record.frequency) },
      {
        label: "Recurring",
        value: formatRecurringSpan(
          record.recurring,
          record.recurringSpanMonths,
          record.recurringSpanYears,
        ),
      },
      {
        label: "Status",
        value: record.isActive === false ? "Suspended" : "Active",
      },
    ];
  }, [assetName, record]);

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="max-h-[85vh] space-y-4 overflow-y-auto">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Maintenance details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and feedback left by estate administrators.
          </p>
        </div>

        {!record ? (
          <p className="text-sm text-muted-foreground">No record selected.</p>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Note</dt>
                <dd className="mt-0.5 whitespace-pre-wrap font-medium text-foreground">
                  {record.note?.trim() || "—"}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-sm font-medium">Admin comments</p>
              {getCommentsStatus === "isLoading" ? (
                <p className="text-sm text-muted-foreground">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No comments yet.
                </p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                  {comments.map((c) => {
                    const id =
                      getId(c) || `${c.createdAt}-${commentText(c)}`;
                    const text = commentText(c);
                    if (!text) return null;
                    return (
                      <li key={id} className="text-sm">
                        <p className="whitespace-pre-wrap text-foreground">
                          {text}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[commentAuthor(c), formatDateTime(c.createdAt)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
