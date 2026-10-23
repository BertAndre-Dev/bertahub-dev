"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";
import { InvitePlanSelect } from "@/components/invite/InvitePlanSelect";
import { DEFAULT_PLAN, normalizePlanKey } from "@/lib/plans";
import {
  type EstateData,
  VisitorVerificationMode,
} from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate";

type Props = {
  initialData?: EstateData | null;
  onSubmit: (data: EstateData) => void;
};

export default function EnergyProviderEstateForm({
  initialData = null,
  onSubmit,
}: Readonly<Props>) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<EstateData>(() => ({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "",
    plan: normalizePlanKey(initialData?.plan) || DEFAULT_PLAN,
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
        plan: normalizePlanKey(initialData.plan),
        visitorVerificationMode:
          initialData.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      plan: normalizePlanKey(formData.plan),
    });
  };

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold pb-4">
          {initialData ? "Update Estate" : "Create New Estate"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
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
          value={normalizePlanKey(formData.plan)}
          onChange={(plan) => setFormData((prev) => ({ ...prev, plan }))}
          description="Assigns modules and vending/bill rates from this plan."
        />

        <div className="w-full pt-4">
          <Button type="submit" className="w-full cursor-pointer">
            {isEditing ? "Update" : "Create Estate"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
