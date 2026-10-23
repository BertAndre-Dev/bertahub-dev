"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppDispatch } from "@/redux/store";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import { getAllUsersByEstate } from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import { setEnergyProviderConfig } from "@/redux/slice/super-admin/energy-provider-config/energy-provider-config";
import { ENERGY_PROVIDER_ROLE } from "@/lib/invite-user-roles";
import { getApiErrorMessage } from "@/lib/api-error";

type SelectOption = { value: string; label: string };
type ConfigScope = "estate" | "company";

type EstateRecord = {
  id: string;
  name: string;
  companyId: string;
};

type EnergyProviderUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function userId(user: EnergyProviderUser): string {
  return user.id ?? user._id ?? "";
}

function userLabel(user: EnergyProviderUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (name && user.email) return `${name} (${user.email})`;
  return name || user.email || "Unnamed user";
}

function resolveCompanyId(
  value?: string | { id?: string; _id?: string } | null,
): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return String(value.id ?? value._id ?? "").trim();
}

function toEstateRecord(estate: {
  id?: string;
  _id?: string;
  name?: string;
  companyId?: string | { id?: string; _id?: string };
  company?: { id?: string; _id?: string };
}): EstateRecord | null {
  const id = String(estate.id ?? estate._id ?? "").trim();
  if (!id) return null;

  const companyId =
    resolveCompanyId(estate.companyId) || resolveCompanyId(estate.company);

  return {
    id,
    name: estate.name ?? "Unnamed estate",
    companyId,
  };
}

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
};

export default function EnergyProviderCommissionForm({
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();

  const [configScope, setConfigScope] = useState<ConfigScope>("estate");
  const [estateId, setEstateId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [energyProviderUserId, setEnergyProviderUserId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [allEstates, setAllEstates] = useState<EstateRecord[]>([]);
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [energyProviderOptions, setEnergyProviderOptions] = useState<
    SelectOption[]
  >([]);

  const [loadingEstates, setLoadingEstates] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getAllEstates({ page: 1, limit: 500 }),
        ).unwrap();
        const rows = (res?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
          companyId?: string | { id?: string; _id?: string };
          company?: { id?: string; _id?: string };
        }>;
        setAllEstates(
          rows
            .map((e) => toEstateRecord(e))
            .filter((e): e is EstateRecord => Boolean(e)),
        );
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      setLoadingCompanies(true);
      try {
        const res = await dispatch(
          getCompanies({ page: 1, limit: 500 }),
        ).unwrap();
        const rows = (res?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
        }>;
        setCompanyOptions(
          rows
            .map((c) => ({
              value: c.id ?? c._id ?? "",
              label: c.name ?? "Unnamed company",
            }))
            .filter((c) => c.value),
        );
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) {
      setEnergyProviderOptions([]);
      setEnergyProviderUserId("");
      return;
    }

    (async () => {
      setLoadingProviders(true);
      try {
        const res = await dispatch(
          getAllUsersByEstate({
            estateId,
            page: 1,
            limit: 500,
            role: ENERGY_PROVIDER_ROLE,
          }),
        ).unwrap();
        const rows = (res?.data ?? []) as EnergyProviderUser[];
        setEnergyProviderOptions(
          rows
            .map((u) => ({
              value: userId(u),
              label: userLabel(u),
            }))
            .filter((u) => u.value),
        );
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setEnergyProviderOptions([]);
      } finally {
        setLoadingProviders(false);
      }
    })();
  }, [dispatch, estateId]);

  const estateScopeOptions = useMemo(
    () =>
      allEstates.map((e) => ({
        value: e.id,
        label: e.name,
      })),
    [allEstates],
  );

  const companyEstateOptions = useMemo(() => {
    if (!companyId) return [];
    return allEstates
      .filter((e) => e.companyId === companyId)
      .map((e) => ({
        value: e.id,
        label: e.name,
      }));
  }, [allEstates, companyId]);

  const activeEstateOptions =
    configScope === "estate" ? estateScopeOptions : companyEstateOptions;

  const selectedEstate = useMemo(
    () => activeEstateOptions.find((o) => o.value === estateId) ?? null,
    [activeEstateOptions, estateId],
  );
  const selectedCompany = useMemo(
    () => companyOptions.find((o) => o.value === companyId) ?? null,
    [companyId, companyOptions],
  );
  const selectedProvider = useMemo(
    () =>
      energyProviderOptions.find((o) => o.value === energyProviderUserId) ??
      null,
    [energyProviderUserId, energyProviderOptions],
  );

  const resetForm = () => {
    setConfigScope("estate");
    setEstateId("");
    setCompanyId("");
    setEnergyProviderUserId("");
    setCommissionPercent("");
    setEnergyProviderOptions([]);
  };

  const handleScopeChange = (scope: ConfigScope) => {
    setConfigScope(scope);
    setEstateId("");
    setCompanyId("");
    setEnergyProviderUserId("");
    setEnergyProviderOptions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estateId.trim()) return toast.error("Please select an estate.");

    const selectedEstateRecord = allEstates.find((e) => e.id === estateId.trim());
    const resolvedCompanyId =
      configScope === "company"
        ? companyId.trim()
        : selectedEstateRecord?.companyId?.trim() ?? "";

    if (!resolvedCompanyId) {
      return toast.error(
        configScope === "company"
          ? "Please select a company."
          : "Selected estate is not linked to a company.",
      );
    }

    if (!energyProviderUserId.trim()) {
      return toast.error("Please select an energy provider.");
    }

    const percent = Number(commissionPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return toast.error("Enter a valid commission percentage between 0 and 100.");
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        setEnergyProviderConfig({
          estateId: estateId.trim(),
          companyId: resolvedCompanyId,
          energyProviderUserId: energyProviderUserId.trim(),
          commissionPercent: percent,
        }),
      ).unwrap();
      toast.success(
        (res as { message?: string })?.message ??
          "Energy provider commission configured successfully",
      );
      resetForm();
      onSuccess?.();
      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Configure energy provider commission
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set the commission percentage charged on each vend.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Configure for</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="configScope"
                  value="estate"
                  checked={configScope === "estate"}
                  onChange={() => handleScopeChange("estate")}
                />
                Estate
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="configScope"
                  value="company"
                  checked={configScope === "company"}
                  onChange={() => handleScopeChange("company")}
                />
                Company
              </label>
            </div>
          </div>

          {configScope === "estate" ? (
            <div>
              <Label>Estate</Label>
              <Select
                options={estateScopeOptions}
                value={selectedEstate}
                onChange={(opt) => {
                  setEstateId(opt?.value ?? "");
                  setEnergyProviderUserId("");
                }}
                isLoading={loadingEstates}
                placeholder="Select estate"
                isClearable
              />
            </div>
          ) : (
            <>
              <div>
                <Label>Company</Label>
                <Select
                  options={companyOptions}
                  value={selectedCompany}
                  onChange={(opt) => {
                    setCompanyId(opt?.value ?? "");
                    setEstateId("");
                    setEnergyProviderUserId("");
                  }}
                  isLoading={loadingCompanies}
                  placeholder="Select company"
                  isClearable
                />
              </div>

              {companyId && (
                <div>
                  <Label>Estate</Label>
                  <Select
                    options={companyEstateOptions}
                    value={selectedEstate}
                    onChange={(opt) => {
                      setEstateId(opt?.value ?? "");
                      setEnergyProviderUserId("");
                    }}
                    isLoading={loadingEstates}
                    isDisabled={!companyId}
                    placeholder={
                      companyEstateOptions.length
                        ? "Select estate"
                        : "No estates found for this company"
                    }
                    isClearable
                    noOptionsMessage={() =>
                      "No estates found for this company"
                    }
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Energy provider</Label>
            <Select
              options={energyProviderOptions}
              value={selectedProvider}
              onChange={(opt) => setEnergyProviderUserId(opt?.value ?? "")}
              isLoading={loadingProviders}
              isDisabled={!estateId}
              placeholder={
                estateId
                  ? "Select energy provider"
                  : "Select an estate first"
              }
              isClearable
              noOptionsMessage={() =>
                estateId
                  ? "No energy providers found for this estate"
                  : "Select an estate first"
              }
            />
          </div>

          <div>
            <Label htmlFor="commission-percent">Commission percent (%)</Label>
            <Input
              id="commission-percent"
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="e.g. 2.5"
              required
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save commission config"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
