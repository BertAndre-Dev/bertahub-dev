"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  type VisitingType,
} from "@/redux/slice/resident/visitor/visitor";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  formatAddressEntryLabel,
  normalizeAddresses,
} from "@/lib/address";

interface AdminVisitorFormProps {
  estateId: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

interface SelectOption {
  label: string;
  value: string;
}

interface ResidentRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  addressId?: string | { id?: string } | null;
  addressIds?: Array<string | { id?: string }>;
}

export default function AdminVisitorForm({
  estateId,
  onSubmitSuccess,
  onClose,
}: AdminVisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [residentOptions, setResidentOptions] = useState<SelectOption[]>([]);
  const [addressOptions, setAddressOptions] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    purpose: string;
    residentId: string;
    addressId: string;
    visitingType: VisitingType;
    visitStartDate: string;
    visitEndDate: string;
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    residentId: "",
    addressId: "",
    visitingType: "SHORT_VISIT",
    visitStartDate: "",
    visitEndDate: "",
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
              role: "resident",
            })
          ).unwrap(),
          dispatch(getFieldByEstate(estateId)).unwrap(),
        ]);

        const users = (usersRes?.data || []) as ResidentRecord[];
        const filteredResidents = users.filter(
          (u: any) => (u.role || "").toLowerCase() === "resident"
        );
        setResidents(filteredResidents);
        setResidentOptions(
          filteredResidents.map((u) => ({
            label:
              `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
              u.email ||
              u.id,
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
              const label = formatAddressEntryLabel(entry.data);
              return { label: label || "Unnamed address", value: entry.id };
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

    if (formData.visitingType === "LONG_VISIT") {
      if (!formData.visitStartDate || !formData.visitEndDate) {
        toast.error("Start and end dates are required for a long visit.");
        return;
      }
      if (
        new Date(formData.visitEndDate).getTime() <
        new Date(formData.visitStartDate).getTime()
      ) {
        toast.error("End date must be after start date.");
        return;
      }
    }

    const toIsoOrNull = (val: string) =>
      val ? new Date(val).toISOString() : null;

    const visitStartDate =
      formData.visitingType === "LONG_VISIT"
        ? toIsoOrNull(formData.visitStartDate)
        : null;
    const visitEndDate =
      formData.visitingType === "LONG_VISIT"
        ? toIsoOrNull(formData.visitEndDate)
        : null;

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
          visitingType: formData.visitingType,
          visitStartDate,
          visitEndDate,
        })
      ).unwrap();

      toast.success("Visitor added successfully.");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const rawMessage = err?.message ?? err?.response?.data?.message;
      const apiMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;
      toast.error(apiMessage || "Failed to add visitor.");
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
                value={
                  residentOptions.find((o) => o.value === formData.residentId) ??
                  null
                }
                onChange={(opt) => {
                  const newResidentId = opt?.value ?? "";
                  const matchedResident = residents.find(
                    (r) => r.id === newResidentId,
                  );
                  const residentAddresses = matchedResident
                    ? normalizeAddresses(
                        matchedResident as unknown as Record<string, unknown>,
                      )
                    : [];
                  const primaryResidentAddressId =
                    residentAddresses[0]?.id ?? "";
                  const matchesEstateAddress =
                    !!primaryResidentAddressId &&
                    addressOptions.some(
                      (o) => o.value === primaryResidentAddressId,
                    );
                  setFormData((prev) => ({
                    ...prev,
                    residentId: newResidentId,
                    addressId: matchesEstateAddress
                      ? primaryResidentAddressId
                      : prev.addressId,
                  }));
                }}
                placeholder="Select resident"
                isClearable
              />
            </div>

            <div>
              <Label>Address (unit) *</Label>
              <Select<SelectOption>
                options={addressOptions}
                value={
                  addressOptions.find((o) => o.value === formData.addressId) ??
                  null
                }
                onChange={(opt) =>
                  setFormData((prev) => ({
                    ...prev,
                    addressId: opt?.value ?? "",
                  }))
                }
                placeholder="Select address in this estate"
                isClearable
                noOptionsMessage={() => "No addresses found in this estate"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Defaults to the selected resident&apos;s address when
                available. You can override it.
              </p>
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

            <div>
              <Label htmlFor="visitingType">Visiting Type *</Label>
              <select
                id="visitingType"
                name="visitingType"
                title="Visiting Type"
                aria-label="Visiting Type"
                value={formData.visitingType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visitingType: e.target.value as VisitingType,
                    visitStartDate:
                      e.target.value === "SHORT_VISIT"
                        ? ""
                        : prev.visitStartDate,
                    visitEndDate:
                      e.target.value === "SHORT_VISIT"
                        ? ""
                        : prev.visitEndDate,
                  }))
                }
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="SHORT_VISIT">Short Visit</option>
                <option value="LONG_VISIT">Long Visit</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.visitingType === "SHORT_VISIT"
                  ? "Short visits are valid for the day of creation."
                  : "Long visits require a start and end date."}
              </p>
            </div>

            {formData.visitingType === "LONG_VISIT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitStartDate">Visit Start Date *</Label>
                  <Input
                    id="visitStartDate"
                    name="visitStartDate"
                    type="datetime-local"
                    value={formData.visitStartDate}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="visitEndDate">Visit End Date *</Label>
                  <Input
                    id="visitEndDate"
                    name="visitEndDate"
                    type="datetime-local"
                    value={formData.visitEndDate}
                    min={formData.visitStartDate || undefined}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            )}
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
