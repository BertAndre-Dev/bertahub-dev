"use client";

import { useEffect, useState, type ReactNode } from "react";
import Select from "react-select";
import { Loader2 } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DesignationToggle } from "@/components/designations/DesignationToggle";
import { ModuleSelectionChips } from "@/components/shared/module-selection-chips";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Designation } from "@/lib/designations";
import { parseEstateModulesResponse } from "@/lib/estate-module-labels";
import axiosInstance from "@/utils/axiosInstance";

export type DesignationFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  estateId?: string;
  modules: string[];
};

type EstateSelectOption = { label: string; value: string };

type Props = {
  open: boolean;
  saving?: boolean;
  initial?: Designation | null;
  scopeLabel: string;
  showEstateSelect?: boolean;
  estateOptions?: EstateSelectOption[];
  estatesLoading?: boolean;
  defaultEstateId?: string;
  companyId?: string;
  onClose: () => void;
  onSubmit: (values: DesignationFormValues) => Promise<void> | void;
};

export function DesignationFormSheet({
  open,
  saving = false,
  initial,
  scopeLabel,
  showEstateSelect = false,
  estateOptions = [],
  estatesLoading = false,
  defaultEstateId = "",
  companyId = "",
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [estateId, setEstateId] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setIsActive(initial?.isActive ?? true);
    setEstateId(initial?.estateId ?? defaultEstateId ?? "");
    setModules(initial?.modules ?? []);
    setAvailableModules([]);
    setModulesError(null);
  }, [open, initial, defaultEstateId]);

  useEffect(() => {
    if (!open) return;
    const resolvedCompanyId = companyId.trim();
    const resolvedEstateId = estateId.trim();
    let modulesUrl = "";
    if (resolvedCompanyId) modulesUrl = "/api/v1/company-mgt/modules";
    else if (resolvedEstateId) {
      modulesUrl = `/api/v1/estate-mgt/${resolvedEstateId}/modules`;
    }

    if (!modulesUrl) {
      setAvailableModules([]);
      setModulesLoading(false);
      setModulesError(null);
      return;
    }

    let cancelled = false;
    setModulesLoading(true);
    setModulesError(null);

    axiosInstance
      .get(modulesUrl)
      .then((res) => {
        if (cancelled) return;
        const next = parseEstateModulesResponse(res.data);
        setAvailableModules(next);
        setModules((prev) => prev.filter((module) => next.includes(module)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAvailableModules([]);
        setModulesError(
          getApiErrorMessage(err) ?? "Failed to load modules.",
        );
      })
      .finally(() => {
        if (!cancelled) setModulesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, companyId, estateId]);

  const editing = Boolean(initial?.id);
  const needsEstate = showEstateSelect && !editing;
  const canSubmit =
    name.trim().length >= 2 &&
    !saving &&
    !modulesLoading &&
    (!needsEstate || Boolean(estateId));

  let submitLabel = "Create designation";
  if (saving) submitLabel = "Saving…";
  else if (editing) submitLabel = "Save changes";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      isActive,
      estateId: estateId.trim() || undefined,
      modules,
    });
  };

  let modulesContent: ReactNode;
  if (!companyId.trim() && !estateId.trim()) {
    modulesContent = (
      <p className="text-sm text-muted-foreground">
        Select an estate to load modules.
      </p>
    );
  } else if (modulesLoading) {
    modulesContent = (
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading modules…
      </div>
    );
  } else if (modulesError) {
    modulesContent = <p className="text-sm text-destructive">{modulesError}</p>;
  } else if (availableModules.length === 0) {
    modulesContent = (
      <p className="text-sm text-muted-foreground">
        {companyId.trim()
          ? "No modules available."
          : "This estate has no modules enabled."}
      </p>
    );
  } else {
    modulesContent = (
      <ModuleSelectionChips
        availableModules={availableModules}
        selectedModules={modules}
        onChange={setModules}
      />
    );
  }

  return (
    <Modal visible={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/45">
            {scopeLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {editing ? "Edit designation" : "New designation"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Names are unique for this {scopeLabel.toLowerCase()}.
          </p>
        </div>

        {needsEstate ? (
          <div className="space-y-2">
            <Label htmlFor="designation-estate">Estate</Label>
            <Select
              inputId="designation-estate"
              options={estateOptions}
              placeholder={
                estatesLoading ? "Loading estates…" : "Select an estate"
              }
              value={
                estateOptions.find((option) => option.value === estateId) ?? null
              }
              onChange={(option) => {
                setEstateId(option?.value ?? "");
                setModules([]);
              }}
              isSearchable
              isLoading={estatesLoading}
              isDisabled={estatesLoading || saving}
              className="text-sm"
              menuPortalTarget={
                typeof document === "undefined" ? undefined : document.body
              }
              menuPosition="fixed"
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                menuPortal: (base) => ({ ...base, zIndex: 80 }),
              }}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="designation-name">Title</Label>
          <Input
            id="designation-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Facility Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="designation-description">Description</Label>
          <Textarea
            id="designation-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Oversees estate facilities and vendors."
          />
        </div>

        <div className="space-y-2">
          <Label>Modules</Label>
          <p className="text-sm text-muted-foreground">
            Choose which features staff with this title can access.
          </p>
          {modulesContent}
        </div>

        {editing ? (
          <div className="rounded-lg border border-black/5 bg-muted/30 px-3.5 py-3">
            <DesignationToggle
              checked={isActive}
              disabled={saving}
              label={isActive ? "Active" : "Inactive"}
              onCheckedChange={setIsActive}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Deactivate titles that are still assigned to staff instead of
              deleting them.
            </p>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button
            className="text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
