"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const initialKey = useMemo(() => initial?.key ?? "", [initial]);
  const [label, setLabel] = useState(initialLabel);
  const [key, setKey] = useState(initialKey);

  useEffect(() => {
    setLabel(initialLabel);
    setKey(initialKey);
  }, [initialLabel, initialKey, visible]);

  const canSubmit = label.trim().length >= 2 && key.trim().length >= 1;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? "Edit report field" : "Create report field"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set a display label and a key used in report entry data (e.g.
            &quot;Block/Unit&quot;).
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="ops-field-label" className="text-sm font-medium">
            Label
          </label>
          <Input
            id="ops-field-label"
            value={label}
            onChange={(e) => {
              const value = e.target.value;
              setLabel(value);
              if (!initial && !key.trim()) {
                setKey(labelToReportingFieldKey(value));
              }
            }}
            placeholder='e.g. "Address Name"'
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ops-field-key" className="text-sm font-medium">
            Key
          </label>
          <Input
            id="ops-field-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder='e.g. "Block/Unit"'
            className="font-mono text-sm"
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
              onSubmit({ label: label.trim(), key: key.trim() })
            }
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
