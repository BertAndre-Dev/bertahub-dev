"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getEstateProfile,
  updateEstateProfile,
} from "@/redux/slice/estate-profile/estate-profile";

type EstateFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
};

export function GeneralSettingsCard() {
  const dispatch = useDispatch<AppDispatch>();
  const estateId = useSelector((state: RootState) => {
    const rawId =
      state.auth.user?.estateId ||
      state.auth.user?.estate?._id ||
      state.auth.user?.estate?.id ||
      "";
    const trimmed = typeof rawId === "string" ? rawId.trim() : "";
    return trimmed.length > 0 ? trimmed : "";
  });
  const { estate, getStatus, updateStatus, error } = useSelector(
    (state: RootState) => state.estateProfile,
  );
  const [formData, setFormData] = useState<EstateFormState>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    isActive: true,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (estateId) {
      dispatch(getEstateProfile(estateId));
    }
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estate) return;
    setFormData({
      name: estate.name || "",
      address: estate.address || "",
      city: estate.city || "",
      state: estate.state || "",
      country: estate.country || "",
      isActive: estate.isActive ?? true,
    });
  }, [estate]);

  const isLoading = useMemo(
    () => getStatus === "isLoading" || updateStatus === "isLoading",
    [getStatus, updateStatus],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!estateId) {
      setFormError("No estate linked to this account");
      return;
    }

    if (!formData.name || !formData.address || !formData.city) {
      setFormError("Estate name, address, and city are required");
      return;
    }

    try {
      const res = await dispatch(
        updateEstateProfile({
          id: estateId,
          data: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            isActive: formData.isActive,
          },
        }),
      ).unwrap();
      toast.success(res?.message || "Estate updated successfully");
    } catch (err: any) {
      const message = err?.message || err?.payload || "Failed to update estate";
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 w-full md:w-3/4 lg:w-2/3 mx-auto">
        <h2 className="font-heading text-xl font-bold text-center mb-6">
          Estate Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || error) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {formError || error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium" htmlFor="estate-name">
              Estate Name
            </label>
            <Input
              id="estate-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 h-10"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="address">
              Address
            </label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-2 h-10"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="city">
                City
              </label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="state">
                State
              </label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="country">
                Country
              </label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="is-active"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                  disabled={isLoading}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 w-full md:w-auto"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
