"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { AppDispatch } from "@/redux/store";
import { createVisitor } from "@/redux/slice/resident/visitor/visitor";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

interface AdminVisitorFormProps {
  estateId: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

interface SelectOption {
  label: string;
  value: string;
}

export default function AdminVisitorForm({
  estateId,
  onSubmitSuccess,
  onClose,
}: AdminVisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [residentOptions, setResidentOptions] = useState<SelectOption[]>([]);
  const [addressOptions, setAddressOptions] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    residentId: "",
    addressId: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!estateId) return;
      setLoading(true);
      try {
        const [usersRes, fieldRes] = await Promise.all([
          dispatch(
            getAllUsersByEstate({
              estateId,
              page: 1,
              limit: 500,
            })
          ).unwrap(),
          dispatch(getFieldByEstate(estateId)).unwrap(),
        ]);

        const users = usersRes?.data || [];
        const residents = users.filter(
          (u: any) => (u.role || "").toLowerCase() === "resident"
        );
        setResidentOptions(
          residents.map((u: any) => ({
            label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id,
            value: u.id,
          }))
        );

        const fields = fieldRes?.data || [];
        if (fields.length > 0) {
          const entryRes = await dispatch(
            getEntriesByField({ fieldId: fields[0].id, page: 1, limit: 500 })
          ).unwrap();
          const entries = entryRes?.data || [];
          setAddressOptions(
            entries.map((entry: any) => {
              const d = entry.data || {};
              const label = Object.entries(d)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
              return { label: label || "Unnamed", value: entry.id };
            })
          );
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load residents and addresses.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [estateId, dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.purpose ||
      !formData.residentId ||
      !formData.addressId
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        createVisitor({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          purpose: formData.purpose,
          residentId: formData.residentId,
          estateId,
          addressId: formData.addressId,
        })
      ).unwrap();

      toast.success("Visitor added successfully.");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      toast.error(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to add visitor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-600">
          Add Visitor
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-gray-500 italic">Loading residents and addresses...</p>
        ) : (
          <>
            <div>
              <Label>Resident *</Label>
              <Select<SelectOption>
                options={residentOptions}
                value={residentOptions.find((o) => o.value === formData.residentId) ?? null}
                onChange={(opt) =>
                  setFormData((prev) => ({ ...prev, residentId: opt?.value ?? "" }))
                }
                placeholder="Select resident"
                isClearable
              />
            </div>

            <div>
              <Label>Address (unit) *</Label>
              <Select<SelectOption>
                options={addressOptions}
                value={addressOptions.find((o) => o.value === formData.addressId) ?? null}
                onChange={(opt) =>
                  setFormData((prev) => ({ ...prev, addressId: opt?.value ?? "" }))
                }
                placeholder="Select address"
                isClearable
              />
            </div>

            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Visitor first name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Visitor last name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 0810000000"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="purpose">Purpose of visit *</Label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="e.g. To make a delivery"
                required
                rows={3}
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </>
        )}

        <div className="pt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading || submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || submitting}
          >
            {submitting ? "Adding..." : "Add Visitor"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
