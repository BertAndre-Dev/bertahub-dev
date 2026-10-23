"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import { getCompanyUsersByEstate } from "@/redux/slice/company/user-mgt/company-user";
import { setCompanyEnergyProviderConfig } from "@/redux/slice/company/energy-provider-config/company-energy-provider-config";
import { ENERGY_PROVIDER_ROLE } from "@/lib/invite-user-roles";

type SelectOption = { value: string; label: string };

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

type Props = {
  companyId: string;
  estateOptions: SelectOption[];
  defaultEstateId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
};

export default function CompanyEnergyProviderCommissionForm({
  companyId,
  estateOptions,
  defaultEstateId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();

  const [estateId, setEstateId] = useState(defaultEstateId ?? "");
  const [energyProviderUserId, setEnergyProviderUserId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [energyProviderOptions, setEnergyProviderOptions] = useState<
    SelectOption[]
  >([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultEstateId) setEstateId(defaultEstateId);
  }, [defaultEstateId]);

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
          getCompanyUsersByEstate({
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

  const selectedEstate = useMemo(
    () => estateOptions.find((o) => o.value === estateId) ?? null,
    [estateOptions, estateId],
  );
  const selectedProvider = useMemo(
    () =>
      energyProviderOptions.find((o) => o.value === energyProviderUserId) ??
      null,
    [energyProviderUserId, energyProviderOptions],
  );

  const resetForm = () => {
    setEstateId(defaultEstateId ?? "");
    setEnergyProviderUserId("");
    setCommissionPercent("");
    setEnergyProviderOptions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId.trim()) {
      return toast.error("Company information is missing.");
    }

    if (!estateId.trim()) return toast.error("Please select an estate.");

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
        setCompanyEnergyProviderConfig({
          estateId: estateId.trim(),
          companyId: companyId.trim(),
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
          Set the commission percentage charged on each vend for an estate under
          your company.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Estate</Label>
            <Select
              options={estateOptions}
              value={selectedEstate}
              onChange={(opt) => {
                setEstateId(opt?.value ?? "");
                setEnergyProviderUserId("");
              }}
              placeholder={
                estateOptions.length
                  ? "Select estate"
                  : "No estates found for your company"
              }
              isClearable
              noOptionsMessage={() => "No estates found for your company"}
            />
          </div>

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
            <Label htmlFor="company-commission-percent">Commission percent (%)</Label>
            <Input
              id="company-commission-percent"
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
