"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";
import { cn } from "@/lib/utils";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { EstateData } from "@/redux/slice/company/estate-mgt/company-estate";

const MODULE_LABELS: Record<string, string> = {
  bills: "Bills",
  rent: "Rent Management",
  meter: "Meter Management",
  marketplace: "Marketplace",
  visitor: "Visitor Management",
  complaints: "Complaints",
  announcements: "Announcements",
  wallet: "Wallet",
  transactions: "Transactions",
  comments: "Comments",
  asset: "Asset Management",
  assets: "Asset Management",
  expense: "Expense",
  reporting: "Reporting",
  users: "Users",
  address: "Address",
};

type Props = {
  initialData?: EstateData | null;
  onSubmit: (data: EstateData) => void;
};

export default function CompanyEstateForm({
  initialData = null,
  onSubmit,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();

  const { companyModules, modulesLoading } = useSelector((state: RootState) => {
    const user = state.auth.user as { modules?: unknown } | null;
    const modules = Array.isArray(user?.modules) ? (user!.modules as string[]) : [];
    return {
      companyModules: modules,
      modulesLoading: state.auth.getSignedInUserStatus === "isLoading",
    };
  });

  const [formData, setFormData] = useState<EstateData>(() => ({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "",
    modules: Array.isArray(initialData?.modules) ? [...initialData!.modules!] : [],
  }));

  useEffect(() => {
    if (companyModules.length === 0) {
      dispatch(getSignedInUser());
    }
  }, [dispatch, companyModules.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleModule = (key: string) => {
    setFormData((prev) => {
      const current = new Set(prev.modules ?? []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...prev, modules: Array.from(current) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modules || formData.modules.length === 0) {
      toast.error("Select at least one module for this estate");
      return;
    }
    onSubmit({ ...formData });
  };

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ];

  const selectedModules = formData.modules ?? [];

  return (
    <form onSubmit={handleSubmit} >
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

        <div className="space-y-3">
          <Label>Modules</Label>
          <p className="text-sm text-muted-foreground">
            Choose which of your company&apos;s modules to enable for this estate.
          </p>

          {modulesLoading && companyModules.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your company&apos;s modules…
            </div>
          ) : companyModules.length === 0 ? (
            <p className="text-sm text-destructive">
              Your company has no modules assigned. Please contact the super admin.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {companyModules.map((key) => {
                const selected = selectedModules.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModule(key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                      selected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background hover:bg-muted/50 text-foreground",
                    )}
                  >
                    {MODULE_LABELS[key] ?? key}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full pt-4">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={companyModules.length === 0 || selectedModules.length === 0}
          >
            {initialData ? "Update" : "Create Estate"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
