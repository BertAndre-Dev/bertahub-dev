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
import { ASSET_STATUSES, type AssetStatus } from "./AssetFormModal";

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
  status: AssetStatus;
};

const STATUS_DEFAULT: AssetStatus = "Active";

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
      status: STATUS_DEFAULT,
    }),
    [asset],
  );

  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial, visible]);

  const canSubmit =
    form.name.trim().length >= 2 && form.tag.trim().length >= 1;

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

        <div className="space-y-2">
          <label htmlFor="edit-asset-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="edit-asset-status"
            aria-label="Asset status"
            className="h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={form.status}
            onChange={(e) =>
              setForm((s) => ({ ...s, status: e.target.value as AssetStatus }))
            }
          >
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
