"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Asset,
  AssetCategory,
  UpdateAssetPayload,
} from "@/redux/slice/admin/asset-mgt/admin-asset";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<UpdateAssetPayload, "id">) => Promise<void> | void;
  loading?: boolean;
  category: AssetCategory | null;
  asset: Asset | null;
};

type FormState = {
  name: string;
  tag: string;
  amount: string;
  useFullLife: string;
  datePurchased: string;
};

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return trimmed.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function AssetEditModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  category,
  asset,
}: Readonly<Props>) {
  const initial: FormState = useMemo(
    () => ({
      name: asset?.name ?? "",
      tag: asset?.tag ?? "",
      amount: asset?.amount != null ? String(asset.amount) : "",
      useFullLife: asset?.useFullLife != null ? String(asset.useFullLife) : "",
      datePurchased: toDateInputValue(asset?.datePurchased),
    }),
    [asset],
  );

  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial, visible]);

  const amountNum = Number(form.amount);
  const lifeNum = Number(form.useFullLife);
  const validNumbers =
    !Number.isNaN(amountNum) &&
    amountNum > 0 &&
    !Number.isNaN(lifeNum) &&
    lifeNum > 0 &&
    Boolean(form.datePurchased);

  const canSubmit =
    form.name.trim().length >= 2 &&
    form.tag.trim().length >= 1 &&
    validNumbers;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900">Edit Asset</h2>

        <div className="space-y-2">
          <label htmlFor="edit-asset-category" className="text-sm font-medium">
            Asset Category
          </label>
          <Input
            id="edit-asset-category"
            value={category?.name ?? ""}
            readOnly
            disabled
            className="h-11 bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label htmlFor="edit-asset-amount" className="text-sm font-medium">
              Amount (₦)
            </label>
            <Input
              id="edit-asset-amount"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) =>
                setForm((s) => ({ ...s, amount: e.target.value }))
              }
              placeholder="50000"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-asset-life" className="text-sm font-medium">
              Useful life (yrs)
            </label>
            <Input
              id="edit-asset-life"
              inputMode="numeric"
              value={form.useFullLife}
              onChange={(e) =>
                setForm((s) => ({ ...s, useFullLife: e.target.value }))
              }
              placeholder="5"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-asset-date" className="text-sm font-medium">
              Date Purchased
            </label>
            <Input
              id="edit-asset-date"
              type="date"
              value={form.datePurchased}
              onChange={(e) =>
                setForm((s) => ({ ...s, datePurchased: e.target.value }))
              }
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-asset-name" className="text-sm font-medium">
            Asset Name
          </label>
          <Input
            id="edit-asset-name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Generator 1"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-asset-tag" className="text-sm font-medium">
            Asset Code
          </label>
          <Input
            id="edit-asset-tag"
            value={form.tag}
            onChange={(e) => setForm((s) => ({ ...s, tag: e.target.value }))}
            placeholder="ASSET-2024-001"
            className="h-11"
          />
        </div>

        <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            className="h-11 text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading}
            onClick={async () =>
              onSubmit({
                name: form.name.trim(),
                tag: form.tag.trim(),
                amount: amountNum,
                useFullLife: lifeNum,
                datePurchased: form.datePurchased,
              })
            }
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
