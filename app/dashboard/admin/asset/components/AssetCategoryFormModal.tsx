"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssetCategory } from "@/redux/slice/admin/asset-mgt/admin-asset";

export type AssetCategoryFormPayload = {
  name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: AssetCategoryFormPayload) => Promise<void> | void;
  loading?: boolean;
  initial?: AssetCategory | null;
};

export default function AssetCategoryFormModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  initial,
}: Readonly<Props>) {
  const initialName = useMemo(() => initial?.name ?? "", [initial]);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, visible]);

  const canSubmit = name.trim().length >= 2;
  const isEdit = Boolean(initial);

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? "Edit Asset Category" : "Create Asset Category"}
        </h2>

        <div className="space-y-2">
          <label
            htmlFor="asset-category-name"
            className="text-sm font-medium text-gray-700"
          >
            Asset Category
          </label>
          <Input
            id="asset-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Electrical Equipments"
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
            onClick={async () => onSubmit({ name: name.trim() })}
          >
            {loading ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
