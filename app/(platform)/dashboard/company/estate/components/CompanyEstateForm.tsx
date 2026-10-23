"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";
import { InvitePlanSelect } from "@/components/invite/InvitePlanSelect";
import { normalizePlanKey } from "@/lib/plans";
import type { RootState } from "@/redux/store";
import {
  type EstateData,
  VisitorVerificationMode,
} from "@/redux/slice/company/estate-mgt/company-estate";

type Props = {
  initialData?: EstateData | null;
  onSubmit: (data: EstateData) => void;
};

function selectSignedInPlan(state: RootState): string {
  const user = state.auth.user as { plan?: unknown } | null;
  return normalizePlanKey(user?.plan);
}

export default function CompanyEstateForm({
  initialData = null,
  onSubmit,
}: Readonly<Props>) {
  const isEditing = Boolean(initialData);
  const companyPlan = useSelector(selectSignedInPlan);

  const [formData, setFormData] = useState<EstateData>(() => ({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "",
    plan: companyPlan,
    visitorVerificationMode:
      initialData?.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
  }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        address: initialData.address,
        city: initialData.city,
        state: initialData.state,
        country: initialData.country,
        plan: companyPlan,
        visitorVerificationMode:
          initialData.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      });
      return;
    }
    setFormData((prev) => ({ ...prev, plan: companyPlan }));
  }, [initialData, companyPlan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      plan: companyPlan,
    });
  };

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold pr-8">
        {initialData ? "Update Estate" : "Create New Estate"}
      </h2>

      <div className="space-y-4">
        {textFields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              required
            />
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Country</Label>
            <CountryDropdown
              value={formData.country}
              onChange={(val) => setFormData({ ...formData, country: val, state: "" })}
              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <Label>State / Region</Label>
            <RegionDropdown
              country={formData.country}
              value={formData.state}
              onChange={(val) => setFormData({ ...formData, state: val })}
              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitorVerificationMode">Visitor Verification Mode</Label>
          <select
            id="visitorVerificationMode"
            name="visitorVerificationMode"
            title="Visitor verification mode"
            value={
              formData.visitorVerificationMode ??
              VisitorVerificationMode.VIEW_AND_VERIFY
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                visitorVerificationMode: e.target.value as VisitorVerificationMode,
              }))
            }
            className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value={VisitorVerificationMode.VIEW_AND_VERIFY}>
              View and verify
            </option>
            <option value={VisitorVerificationMode.VERIFY_ONLY}>Verify only</option>
            <option value={VisitorVerificationMode.VIEW_ONLY}>View only</option>
          </select>
        </div>

        <InvitePlanSelect
          value={companyPlan}
          onChange={() => {}}
          disabled
          description="This estate uses your company plan. It cannot be changed here."
        />

        <div className="w-full pt-1">
          <Button type="submit" className="w-full cursor-pointer">
            {isEditing ? "Update" : "Create Estate"}
          </Button>
        </div>
      </div>
    </form>
  );
}
