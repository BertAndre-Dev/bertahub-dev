"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  updateVisitor,
  getVisitorById,
  type VisitingType,
} from "@/redux/slice/resident/visitor/visitor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { formatAddressEntryLabel } from "@/lib/address";

interface VisitorFormProps {
  visitorId?: string | null;
  residentId: string;
  estateId: string;
  addressId: string | { id: string; data: { block: string; unit: string } };
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

export default function VisitorForm({
  visitorId,
  residentId,
  estateId,
  addressId,
  onSubmitSuccess,
  onClose,
}: VisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    purpose: string;
    address: string;
    visitingType: VisitingType;
    visitStartDate: string;
    visitEndDate: string;
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    address: "",
    visitingType: "SHORT_VISIT",
    visitStartDate: "",
    visitEndDate: "",
  });

  // Auto-populate address from addressId prop
  useEffect(() => {
    if (addressId && typeof addressId === "object" && addressId.data) {
      const friendly = formatAddressEntryLabel(addressId.data);
      setFormData((prev) => ({
        ...prev,
        address:
          friendly ||
          [addressId.data?.block, addressId.data?.unit]
            .filter(Boolean)
            .join(", "),
      }));
    }
  }, [addressId]);

  useEffect(() => {
    if (visitorId) {
      const loadVisitor = async () => {
        setLoading(true);
        try {
          const res = await dispatch(getVisitorById(visitorId)).unwrap();
          // API response has flat structure, not nested visitor object
          const visitor = res?.data?.visitor || res?.data;
          if (visitor) {
            const toDateInputValue = (val?: string | null) => {
              if (!val) return "";
              const d = new Date(val);
              if (Number.isNaN(d.getTime())) return "";
              const pad = (n: number) => String(n).padStart(2, "0");
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };
            setFormData({
              firstName: visitor.firstName || "",
              lastName: visitor.lastName || "",
              phone: visitor.phone || "",
              purpose: visitor.purpose || "",
              address: visitor.address || "",
              visitingType:
                (visitor.visitingType as VisitingType) || "SHORT_VISIT",
              visitStartDate: toDateInputValue(visitor.visitStartDate),
              visitEndDate: toDateInputValue(visitor.visitEndDate),
            });
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to load visitor details");
        } finally {
          setLoading(false);
        }
      };
      loadVisitor();
    }
  }, [visitorId, dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      !formData.purpose
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const addressIdString =
      typeof addressId === "object" && addressId !== null
        ? addressId.id
        : addressId;

    if (!addressIdString) {
      toast.error(
        "No address is linked to your account. Please contact your estate admin to assign you an address before inviting visitors.",
      );
      return;
    }

    if (!residentId) {
      toast.error("Unable to identify resident. Please refresh and try again.");
      return;
    }

    if (!estateId) {
      toast.error("Unable to identify estate. Please refresh and try again.");
      return;
    }

    if (formData.visitingType === "LONG_VISIT") {
      if (!formData.visitStartDate || !formData.visitEndDate) {
        toast.error(
          "Start and end dates are required for a long visit",
        );
        return;
      }
      if (
        new Date(formData.visitEndDate).getTime() <
        new Date(formData.visitStartDate).getTime()
      ) {
        toast.error("End date must be after start date");
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
      if (visitorId) {
        await dispatch(
          updateVisitor({
            id: visitorId,
            data: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              purpose: formData.purpose,
              residentId,
              estateId,
              addressId: addressIdString,
              visitingType: formData.visitingType,
              visitStartDate,
              visitEndDate,
            },
          }),
        ).unwrap();
        toast.success("Visitor updated successfully");
      } else {
        await dispatch(
          createVisitor({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            purpose: formData.purpose,
            residentId,
            estateId,
            addressId: addressIdString,
            visitingType: formData.visitingType,
            visitStartDate,
            visitEndDate,
          }),
        ).unwrap();
        toast.success("Visitor created successfully");
      }

      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const apiMessage = Array.isArray(err?.message)
        ? err.message.join(", ")
        : err?.message;
      toast.error(
        apiMessage || `Failed to ${visitorId ? "update" : "create"} visitor`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          {visitorId ? "Update Visitor" : "Create Visitor"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-gray-500 italic">Loading visitor details...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
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
                placeholder="Enter last name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                disabled
                className="mt-1 bg-gray-50"
              />
              {!(typeof addressId === "object"
                ? addressId?.id
                : addressId) && (
                <p className="text-xs text-amber-600 mt-1">
                  No address is linked to your account. Please contact your
                  estate admin to assign you an address before inviting
                  visitors.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="purpose">Purpose of Visit *</Label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Enter purpose of visit"
                required
                rows={3}
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>
        )}

        <div className="pt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || submitting}
          >
            {submitting
              ? `${visitorId ? "Updating" : "Creating"}...`
              : visitorId
                ? "Update Visitor"
                : "Create Visitor"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
