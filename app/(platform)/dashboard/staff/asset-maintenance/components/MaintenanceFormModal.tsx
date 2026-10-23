"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import {
  IsoDatePicker,
  todayIsoString,
} from "@/components/ui/iso-date-picker";
import type { AppDispatch } from "@/redux/store";
import {
  getAssetCategories,
  getAssets,
  type Asset,
  type AssetCategory,
} from "@/redux/slice/staff/asset-mgt/staff-asset";
import {
  MAINTENANCE_FREQUENCY_OPTIONS,
  toApiMaintenanceFrequency,
} from "@/lib/asset-maintenance-frequency";
import {
  DEFAULT_RECURRING_FIELDS,
  isValidRecurringSpan,
  toCreateRecurringPayload,
} from "@/lib/asset-maintenance-recurring";
import MaintenanceRecurringFields from "@/components/maintenance/MaintenanceRecurringFields";
import {
  getAssetMaintenanceComments,
  type AssetMaintenanceComment,
  type AssetMaintenanceRecord,
  type CreateMaintenancePayload,
} from "@/redux/slice/staff/asset-maintenance/staff-asset-maintenance";
import { selectStaffAssetMaintenance } from "@/redux/slice/staff/asset-maintenance/staff-asset-maintenance-slice";

const SELECT_CLASS =
  "h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm disabled:cursor-not-allowed";

type CreateFormState = {
  estateId: string;
  assetId: string;
  categoryId: string;
  tag: string;
  lastMaintenanceDate: string;
  frequency: string;
  recurring: boolean;
  recurringSpanMonths: number;
  recurringSpanYears: number;
  note: string;
};

type EditFormState = {
  lastMaintenanceDate: string;
  frequency: string;
  note: string;
  feedback: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  estateId: string;
  estateName: string;
  categories: AssetCategory[];
  initial?: AssetMaintenanceRecord | null;
  onCreate: (payload: CreateMaintenancePayload) => Promise<void> | void;
  onUpdate: (payload: {
    lastMaintenanceDate: string;
    frequency: string;
    note?: string;
    feedback?: string;
  }) => Promise<void> | void;
};

function getId(v: { id?: string; _id?: string } | string | undefined) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.id || v._id || "";
}

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInputValue(value: string) {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

function formatCurrency(amount?: number) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function resolveCategoryName(
  asset: Asset | undefined,
  categories: AssetCategory[],
) {
  const raw = asset?.assetCategoryId;
  if (!raw) return "—";
  if (typeof raw !== "string") return raw.name ?? "—";
  return categories.find((c) => getId(c) === raw)?.name ?? raw;
}

function commentText(c: AssetMaintenanceComment) {
  return (c.comment ?? c.text ?? "").trim();
}

function commentAuthor(c: AssetMaintenanceComment) {
  if (c.userName?.trim()) return c.userName.trim();
  const name = [c.user?.firstName, c.user?.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return c.user?.email ?? "User";
}

function formatCommentDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function MaintenanceFormModal({
  visible,
  onClose,
  loading = false,
  estateId,
  estateName,
  categories,
  initial,
  onCreate,
  onUpdate,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(initial);
  const maintenanceId = getId(initial ?? undefined);
  const { commentsByMaintenanceId, getCommentsStatus } = useSelector(
    selectStaffAssetMaintenance,
  );
  const comments = commentsByMaintenanceId[maintenanceId] ?? [];

  const initialCreate: CreateFormState = useMemo(
    () => ({
      estateId: estateId || "",
      assetId: "",
      categoryId: "",
      tag: "",
      lastMaintenanceDate: "",
      frequency: "weekly",
      ...DEFAULT_RECURRING_FIELDS,
      note: "",
    }),
    [estateId],
  );

  const initialEdit: EditFormState = useMemo(
    () => ({
      lastMaintenanceDate: toDateInputValue(initial?.lastMaintenanceDate),
      frequency: toApiMaintenanceFrequency(initial?.frequency),
      note: initial?.note ?? "",
      feedback: "",
    }),
    [initial],
  );

  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreate);
  const [editForm, setEditForm] = useState<EditFormState>(initialEdit);
  const [estateAssets, setEstateAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCreateForm(initialCreate);
    setEditForm(initialEdit);
    setEstateAssets([]);
  }, [initialCreate, initialEdit, visible]);

  useEffect(() => {
    if (!visible || !isEdit || !maintenanceId) return;
    dispatch(
      getAssetMaintenanceComments({
        maintenanceId,
        estateId: estateId || undefined,
        page: 1,
        limit: 20,
      }),
    )
      .unwrap()
      .catch(() => {});
  }, [dispatch, estateId, isEdit, maintenanceId, visible]);

  useEffect(() => {
    if (!visible || isEdit || !estateId) return;
    dispatch(getAssetCategories({ estateId, page: 1, limit: 200 }))
      .unwrap()
      .catch(() => {});
  }, [dispatch, estateId, visible, isEdit]);

  useEffect(() => {
    if (!visible || isEdit || !estateId) {
      setEstateAssets([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAssetsLoading(true);
      try {
        const res = await dispatch(
          getAssets({ estateId, page: 1, limit: 500 }),
        ).unwrap();
        if (!cancelled) setEstateAssets(res?.data ?? []);
      } catch {
        if (!cancelled) setEstateAssets([]);
      } finally {
        if (!cancelled) setAssetsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [estateId, dispatch, isEdit, visible]);

  const selectedAsset = useMemo(
    () => estateAssets.find((a) => getId(a) === createForm.assetId),
    [estateAssets, createForm.assetId],
  );

  const handleAssetChange = (assetId: string) => {
    const asset = estateAssets.find((a) => getId(a) === assetId);
    const categoryId = getId(
      asset?.assetCategoryId as string | { id?: string; _id?: string },
    );
    setCreateForm((s) => ({
      ...s,
      assetId,
      categoryId,
      tag: asset?.tag?.trim() ?? "",
    }));
  };

  const canSubmitCreate =
    Boolean(createForm.estateId) &&
    Boolean(createForm.assetId) &&
    Boolean(createForm.categoryId) &&
    Boolean(createForm.tag.trim()) &&
    Boolean(createForm.lastMaintenanceDate) &&
    Boolean(createForm.frequency) &&
    isValidRecurringSpan(
      createForm.recurring,
      createForm.recurringSpanMonths,
      createForm.recurringSpanYears,
    );

  const canSubmitEdit =
    Boolean(editForm.lastMaintenanceDate) && Boolean(editForm.frequency);

  // Create: today onward. Edit: keep an existing past date selectable, otherwise today onward.
  const scheduleMinDate = useMemo(() => {
    const today = todayIsoString();
    if (!isEdit) return today;
    const existing = toDateInputValue(initial?.lastMaintenanceDate);
    return existing && existing < today ? existing : today;
  }, [isEdit, initial?.lastMaintenanceDate]);

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="space-y-4 max-h-[85vh] overflow-y-auto">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit maintenance" : "Create maintenance record"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Update schedule and notes for this maintenance record."
              : "Select an asset to create maintenance record for."}
          </p>
        </div>

        {isEdit ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="maint-date-edit" className="text-sm font-medium">
                Maintenance date
              </label>
              <IsoDatePicker
                id="maint-date-edit"
                value={editForm.lastMaintenanceDate}
                minDate={scheduleMinDate}
                onChange={(value) =>
                  setEditForm((s) => ({ ...s, lastMaintenanceDate: value }))
                }
                placeholder="Select maintenance date"
                ariaLabel="Maintenance date"
              />
              <p className="text-xs text-muted-foreground">
                Today or a future date.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="maint-freq-edit" className="text-sm font-medium">
                Frequency
              </label>
              <select
                id="maint-freq-edit"
                className={SELECT_CLASS}
                value={editForm.frequency}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, frequency: e.target.value }))
                }
              >
                {MAINTENANCE_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="maint-note-edit" className="text-sm font-medium">
                Note
              </label>
              <textarea
                id="maint-note-edit"
                className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={editForm.note}
                onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                placeholder="Maintenance instructions..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">Previous feedback</p>
              {getCommentsStatus === "isLoading" ? (
                <p className="text-sm text-muted-foreground">Loading feedback...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feedback yet.</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                  {comments.map((c) => {
                    const id = getId(c) || `${c.createdAt}-${commentText(c)}`;
                    const text = commentText(c);
                    if (!text) return null;
                    return (
                      <li key={id} className="text-sm">
                        <p className="text-foreground whitespace-pre-wrap">{text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[commentAuthor(c), formatCommentDate(c.createdAt)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="maint-feedback-edit" className="text-sm font-medium">
                Asset maintenance feedback
              </label>
              <textarea
                id="maint-feedback-edit"
                className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={editForm.feedback}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, feedback: e.target.value }))
                }
                placeholder="Replaced air filters during this maintenance cycle."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">Estate</p>
              <p className="font-medium">{estateName}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="maint-asset" className="text-sm font-medium">
                Asset
              </label>
              <select
                id="maint-asset"
                className={SELECT_CLASS}
                value={createForm.assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                disabled={!estateId || assetsLoading}
              >
                <option value="">
                  {assetsLoading
                    ? "Loading assets..."
                    : estateAssets.length
                      ? "Select asset"
                      : "No assets in this estate"}
                </option>
                {estateAssets.map((a) => {
                  const id = getId(a);
                  const label = [a.name, a.tag].filter(Boolean).join(" · ");
                  return (
                    <option key={id} value={id}>
                      {label || "Asset"}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedAsset && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Asset details</p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{selectedAsset.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tag</dt>
                    <dd className="font-medium">{selectedAsset.tag ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estate</dt>
                    <dd className="font-medium">{estateName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium">
                      {resolveCategoryName(selectedAsset, categories)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-medium">
                      {formatCurrency(selectedAsset.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Useful life</dt>
                    <dd className="font-medium">
                      {selectedAsset.useFullLife != null
                        ? `${selectedAsset.useFullLife} year(s)`
                        : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Date purchased</dt>
                    <dd className="font-medium">
                      {selectedAsset.datePurchased
                        ? new Date(selectedAsset.datePurchased).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 border-t border-border pt-4">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="maint-date" className="text-sm font-medium">
                  Maintenance date
                </label>
                <IsoDatePicker
                  id="maint-date"
                  value={createForm.lastMaintenanceDate}
                  minDate={scheduleMinDate}
                  onChange={(value) =>
                    setCreateForm((s) => ({ ...s, lastMaintenanceDate: value }))
                  }
                  placeholder="Select maintenance date"
                  ariaLabel="Maintenance date"
                />
                <p className="text-xs text-muted-foreground">
                  Today or a future date.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="maint-freq" className="text-sm font-medium">
                  Frequency
                </label>
                <select
                  id="maint-freq"
                  className={SELECT_CLASS}
                  value={createForm.frequency}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, frequency: e.target.value }))
                  }
                >
                  {MAINTENANCE_FREQUENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <MaintenanceRecurringFields
                  idPrefix="maint"
                  value={{
                    recurring: createForm.recurring,
                    recurringSpanMonths: createForm.recurringSpanMonths,
                    recurringSpanYears: createForm.recurringSpanYears,
                  }}
                  onChange={(value) =>
                    setCreateForm((s) => ({
                      ...s,
                      ...value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="maint-note" className="text-sm font-medium">
                  Note
                </label>
                <textarea
                  id="maint-note"
                  className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={createForm.note}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, note: e.target.value }))
                  }
                  placeholder="Check filters and lubrication"
                />
              </div>
            </div>
          </div>
        )}

        <div className="w-full pt-2">
          <Button
            className="w-full cursor-pointer text-white disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0150AC" }}
            disabled={loading || (isEdit ? !canSubmitEdit : !canSubmitCreate)}
            onClick={async () => {
              if (isEdit) {
                await onUpdate({
                  lastMaintenanceDate: fromDateInputValue(editForm.lastMaintenanceDate),
                  frequency: editForm.frequency,
                  note: editForm.note.trim() || undefined,
                  feedback: editForm.feedback.trim() || undefined,
                });
              } else {
                await onCreate({
                  estateId: createForm.estateId,
                  assetId: createForm.assetId,
                  categoryId: createForm.categoryId,
                  tag: createForm.tag.trim(),
                  lastMaintenanceDate: fromDateInputValue(
                    createForm.lastMaintenanceDate,
                  ),
                  frequency: createForm.frequency,
                  ...toCreateRecurringPayload({
                    recurring: createForm.recurring,
                    recurringSpanMonths: createForm.recurringSpanMonths,
                    recurringSpanYears: createForm.recurringSpanYears,
                  }),
                  note: createForm.note.trim() || undefined,
                });
              }
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
