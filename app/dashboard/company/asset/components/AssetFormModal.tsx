"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Asset,
  AssetCategory,
} from "@/redux/slice/company/asset-mgt/company-asset";

type FormState = {
  name: string;
  assetCategoryId: string;
  amount: string;
  useFullLife: string;
  datePurchased: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    assetCategoryId: string;
    amount: number;
    useFullLife: number;
    datePurchased: string;
  }) => Promise<void> | void;
  loading?: boolean;
  categories: AssetCategory[];
  initial?: Asset | null;
};

function getId(v: { id?: string; _id?: string } | string | undefined) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.id || v._id || "";
}

export default function AssetFormModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  categories,
  initial,
}: Readonly<Props>) {
  const initialForm: FormState = useMemo(() => {
    const categoryId = getId(initial?.assetCategoryId as any);
    return {
      name: initial?.name ?? "",
      assetCategoryId: categoryId ?? "",
      amount:
        initial?.amount != null && !Number.isNaN(Number(initial.amount))
          ? String(initial.amount)
          : "",
      useFullLife:
        initial?.useFullLife != null && !Number.isNaN(Number(initial.useFullLife))
          ? String(initial.useFullLife)
          : "",
      datePurchased: initial?.datePurchased?.slice(0, 10) ?? "",
    };
  }, [initial]);

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm, visible]);

  const canSubmit =
    form.name.trim().length >= 2 &&
    Boolean(form.assetCategoryId) &&
    Number(form.amount) > 0 &&
    Number(form.useFullLife) > 0 &&
    Boolean(form.datePurchased);

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="pr-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? "Edit asset" : "Create asset"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assets must be linked to an asset category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="asset-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="asset-name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder='e.g. "Laptop"'
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="asset-category"
              aria-label="Asset category"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={form.assetCategoryId}
              onChange={(e) =>
                setForm((s) => ({ ...s, assetCategoryId: e.target.value }))
              }
            >
              <option value="">Select category</option>
              {categories.map((c) => {
                const id = getId(c);
                return (
                  <option key={id} value={id}>
                    {c.name ?? "Unnamed"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-amount" className="text-sm font-medium">
              Amount (₦)
            </label>
            <Input
              id="asset-amount"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-life" className="text-sm font-medium">
              Useful life (years)
            </label>
            <Input
              id="asset-life"
              inputMode="numeric"
              value={form.useFullLife}
              onChange={(e) =>
                setForm((s) => ({ ...s, useFullLife: e.target.value }))
              }
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-date" className="text-sm font-medium">
              Date purchased
            </label>
            <Input
              id="asset-date"
              type="date"
              value={form.datePurchased}
              onChange={(e) =>
                setForm((s) => ({ ...s, datePurchased: e.target.value }))
              }
            />
          </div>
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
              onSubmit({
                name: form.name.trim(),
                assetCategoryId: form.assetCategoryId,
                amount: Number(form.amount),
                useFullLife: Number(form.useFullLife),
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

