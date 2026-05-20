"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";
import type { EstateData } from "@/redux/slice/company/estate-mgt/company-estate";

type Props = {
  initialData?: EstateData | null;
  onSubmit: (data: EstateData) => void;
};

export default function CompanyEstateForm({
  initialData = null,
  onSubmit,
}: Readonly<Props>) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        address: initialData.address,
        city: initialData.city,
        state: initialData.state,
        country: initialData.country,
      });
    } else {
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData
    });
  };

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-8">
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

        <div className="w-full pt-4">
          <Button type="submit" className="w-full cursor-pointer">
            {initialData ? "Update" : "Create Estate"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
