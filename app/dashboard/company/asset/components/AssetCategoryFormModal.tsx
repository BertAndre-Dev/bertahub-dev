"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssetCategory } from "@/redux/slice/company/asset-mgt/company-asset";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string }) => Promise<void> | void;
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

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? "Edit asset category" : "Create asset category"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Categories are required before creating assets.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="asset-category-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="asset-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Electronics"'
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading}
            onClick={async () => onSubmit({ name: name.trim() })}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

