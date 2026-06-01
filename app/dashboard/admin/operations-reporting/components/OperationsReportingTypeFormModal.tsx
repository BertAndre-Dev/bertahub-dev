"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OperationsReportingType } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string }) => Promise<void> | void;
  loading?: boolean;
  initial?: OperationsReportingType | null;
  submitLabel?: string;
};

export default function OperationsReportingTypeFormModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  initial,
  submitLabel = "Save",
}: Readonly<Props>) {
  const initialName = useMemo(() => initial?.name ?? "", [initial]);
  const initialDescription = useMemo(() => initial?.description ?? "", [initial]);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription, visible]);

  const canSubmit = name.trim().length >= 2;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? "Edit reporting type" : "Create reporting type"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Types group report fields (e.g. Fuel, Water).
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="ops-type-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="ops-type-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Fuel"'
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ops-type-description" className="text-sm font-medium">
            Description
          </label>
          <Input
            id="ops-type-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
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
            onClick={async () =>
              onSubmit({ name: name.trim(), description: description.trim() })
            }
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
