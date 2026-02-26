"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CreateComplaintPayload } from "@/redux/slice/resident/maintenance/resident-complaints";

const CATEGORY_OPTIONS = [
  { value: "", label: "Select category" },
  { value: "ELECTRICITY ISSUE", label: "Electricity" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "SECURITY", label: "Security" },
  { value: "OTHER", label: "Other" },
];

interface ResidentComplaintFormProps {
  readonly addressOptions: { value: string; label: string }[];
  readonly estateId: string;
  readonly residentId: string;
  readonly onSubmit: (
    payload: Omit<CreateComplaintPayload, "residentId" | "estateId">
  ) => Promise<void>;
  readonly onCancel: () => void;
  readonly loading?: boolean;
}

export function ResidentComplaintForm({
  addressOptions,
  estateId,
  residentId,
  onSubmit,
  onCancel,
  loading = false,
}: ResidentComplaintFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [addressId, setAddressId] = useState(
    addressOptions[0]?.value ?? ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category || !addressId) {
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      addressId,
    });
  };

  const valid = title.trim() && description.trim() && category && addressId;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="resident-title">Title</Label>
        <Input
          id="resident-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Leaking pipe in bathroom"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="resident-description">Description</Label>
        <textarea
          id="resident-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>
      <div>
        <Label htmlFor="resident-category">Category</Label>
        <Select
          id="resident-category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full"
        />
      </div>
      {addressOptions.length > 1 && (
        <div>
          <Label htmlFor="resident-address">Address</Label>
          <Select
            id="resident-address"
            options={addressOptions}
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className="mt-1 w-full"
          />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || loading}>
          {loading ? "Submitting..." : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
