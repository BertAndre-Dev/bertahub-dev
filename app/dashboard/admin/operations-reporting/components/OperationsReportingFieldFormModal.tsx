"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OperationsReportingField } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { labelToReportingFieldKey } from "@/lib/operations-reporting-field-key";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { label: string; key: string }) => Promise<void> | void;
  loading?: boolean;
  initial?: OperationsReportingField | null;
  submitLabel?: string;
};

export default function OperationsReportingFieldFormModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  initial,
  submitLabel = "Save",
}: Readonly<Props>) {
  const initialLabel = useMemo(() => initial?.label ?? "", [initial]);
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel, visible]);

  const canSubmit = label.trim().length >= 2;

  const handleSubmit = async () => {
    const trimmedLabel = label.trim();
    const key = labelToReportingFieldKey(trimmedLabel);
    if (!trimmedLabel || !key) return;
    await onSubmit({ label: trimmedLabel, key });
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? "Edit report field" : "Create report field"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a display label. The field key is generated automatically, like address
            fields.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ops-field-label">Label</Label>
          <Input
            id="ops-field-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Block Name, Street, Flat Number"
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
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
