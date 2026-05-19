"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDispatch } from "@/redux/store";
import {
  getAssetCategories,
  getAssets,
  type Asset,
  type AssetCategory,
} from "@/redux/slice/company/asset-mgt/company-asset";
import type {
  AssetMaintenanceRecord,
  CreateMaintenancePayload,
} from "@/redux/slice/company/asset-maintenance/company-asset-maintenance";
import type { EstateOption } from "../../asset/lib/estate";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

type CreateFormState = {
  estateId: string;
  assetId: string;
  categoryId: string;
  tag: string;
  lastMaintenanceDate: string;
  frequency: string;
  note: string;
};

type EditFormState = {
  lastMaintenanceDate: string;
  frequency: string;
  note: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  estates: EstateOption[];
  defaultEstateId?: string;
  categories: AssetCategory[];
  initial?: AssetMaintenanceRecord | null;
  onCreate: (payload: CreateMaintenancePayload) => Promise<void> | void;
  onUpdate: (payload: {
    lastMaintenanceDate: string;
    frequency: string;
    note?: string;
  }) => Promise<void> | void;
};

function getId(v: { id?: string; _id?: string } | string | undefined) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.id || v._id || "";
}

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** Upper bound for datetime-local inputs (no future maintenance dates). */
function maxDatetimeLocalNow() {
  return toDatetimeLocal(new Date().toISOString());
}

function clampDatetimeLocal(value: string, max: string) {
  if (!value || !max) return value;
  return value > max ? max : value;
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

function resolveEstateName(
  asset: Asset | undefined,
  estates: EstateOption[],
) {
  const raw = asset?.estateId;
  if (!raw) return "—";
  if (typeof raw !== "string") return raw.name ?? "—";
  return estates.find((e) => e.id === raw)?.name ?? raw;
}

export default function MaintenanceFormModal({
  visible,
  onClose,
  loading = false,
  estates,
  defaultEstateId = "",
  categories,
  initial,
  onCreate,
  onUpdate,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(initial);

  const initialCreate: CreateFormState = useMemo(
    () => ({
      estateId: defaultEstateId || estates[0]?.id || "",
      assetId: "",
      categoryId: "",
      tag: "",
      lastMaintenanceDate: "",
      frequency: "weekly",
      note: "",
    }),
    [estates, defaultEstateId],
  );

  const initialEdit: EditFormState = useMemo(
    () => ({
      lastMaintenanceDate: toDatetimeLocal(initial?.lastMaintenanceDate),
      frequency: initial?.frequency ?? "weekly",
      note: initial?.note ?? "",
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
    if (!visible || isEdit) return;
    dispatch(getAssetCategories({ page: 1, limit: 200 }))
      .unwrap()
      .catch(() => {});
  }, [dispatch, visible, isEdit]);

  useEffect(() => {
    if (!visible || isEdit || !createForm.estateId) {
      setEstateAssets([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAssetsLoading(true);
      try {
        const res = await dispatch(
          getAssets({ estateId: createForm.estateId, page: 1, limit: 500 }),
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
  }, [createForm.estateId, dispatch, isEdit, visible]);

  const selectedAsset = useMemo(
    () => estateAssets.find((a) => getId(a) === createForm.assetId),
    [estateAssets, createForm.assetId],
  );

  const handleEstateChange = (estateId: string) => {
    setCreateForm({
      estateId,
      assetId: "",
      categoryId: "",
      tag: "",
      lastMaintenanceDate: createForm.lastMaintenanceDate,
      frequency: createForm.frequency,
      note: createForm.note,
    });
  };

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
    Boolean(createForm.frequency);

  const canSubmitEdit =
    Boolean(editForm.lastMaintenanceDate) && Boolean(editForm.frequency);

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
              : "Select an estate and asset; asset details are filled in automatically."}
          </p>
        </div>

        {isEdit ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="maint-date-edit" className="text-sm font-medium">
                Last maintenance date
              </label>
              <Input
                id="maint-date-edit"
                type="datetime-local"
                max={maxDatetimeLocalNow()}
                value={editForm.lastMaintenanceDate}
                onChange={(e) =>
                  setEditForm((s) => ({
                    ...s,
                    lastMaintenanceDate: clampDatetimeLocal(
                      e.target.value,
                      maxDatetimeLocalNow(),
                    ),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maint-freq-edit" className="text-sm font-medium">
                Frequency
              </label>
              <select
                id="maint-freq-edit"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={editForm.frequency}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, frequency: e.target.value }))
                }
              >
                {FREQUENCY_OPTIONS.map((o) => (
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="maint-estate" className="text-sm font-medium">
                Estate
              </label>
              <select
                id="maint-estate"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={createForm.estateId}
                onChange={(e) => handleEstateChange(e.target.value)}
              >
                <option value="">Select estate</option>
                {estates.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="maint-asset" className="text-sm font-medium">
                Asset
              </label>
              <select
                id="maint-asset"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={createForm.assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                disabled={!createForm.estateId || assetsLoading}
              >
                <option value="">
                  {assetsLoading
                    ? "Loading assets..."
                    : !createForm.estateId
                      ? "Select estate first"
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
                    <dd className="font-medium">
                      {resolveEstateName(selectedAsset, estates)}
                    </dd>
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
                  Last maintenance date
                </label>
                <Input
                  id="maint-date"
                  type="datetime-local"
                  max={maxDatetimeLocalNow()}
                  value={createForm.lastMaintenanceDate}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      lastMaintenanceDate: clampDatetimeLocal(
                        e.target.value,
                        maxDatetimeLocalNow(),
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="maint-freq" className="text-sm font-medium">
                  Frequency
                </label>
                <select
                  id="maint-freq"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={createForm.frequency}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, frequency: e.target.value }))
                  }
                >
                  {FREQUENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
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
            className="text-white w-full"
            style={{ backgroundColor: "#0150AC" }}
            disabled={loading || (isEdit ? !canSubmitEdit : !canSubmitCreate)}
            onClick={async () => {
              if (isEdit) {
                await onUpdate({
                  lastMaintenanceDate: fromDatetimeLocal(editForm.lastMaintenanceDate),
                  frequency: editForm.frequency,
                  note: editForm.note.trim() || undefined,
                });
              } else {
                await onCreate({
                  estateId: createForm.estateId,
                  assetId: createForm.assetId,
                  categoryId: createForm.categoryId,
                  tag: createForm.tag.trim(),
                  lastMaintenanceDate: fromDatetimeLocal(
                    createForm.lastMaintenanceDate,
                  ),
                  frequency: createForm.frequency,
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
