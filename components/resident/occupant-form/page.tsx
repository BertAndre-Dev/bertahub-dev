"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { createOccupant } from "@/redux/slice/resident/visitor/occupant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { formatAddressEntryLabel } from "@/lib/address";

interface OccupantFormProps {
  addressId: string | { id: string; data: { block: string; unit: string } };
  onSubmitSuccess?: () => void | Promise<void>;
  onClose?: () => void;
}

export default function OccupantForm({
  addressId,
  onSubmitSuccess,
  onClose,
}: OccupantFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    relationship: string;
    address: string;
  }>({
    firstName: "",
    lastName: "",
    relationship: "",
    address: "",
  });

  useEffect(() => {
    if (addressId && typeof addressId === "object" && addressId.data) {
      const friendly = formatAddressEntryLabel(addressId.data);
      setFormData((prev) => ({
        ...prev,
        address:
          friendly ||
          [addressId.data?.block, addressId.data?.unit].filter(Boolean).join(", "),
      }));
    }
  }, [addressId]);

  const addressIdString =
    typeof addressId === "object" && addressId !== null ? addressId.id : addressId;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.relationship) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!addressIdString) {
      toast.error(
        "No address is linked to your account. Please select an address before adding an occupant.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        createOccupant({
          firstName: formData.firstName,
          lastName: formData.lastName,
          relationship: formData.relationship,
          addressId: addressIdString,
        }),
      ).unwrap();

      toast.success("Occupant added successfully");
      await onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const apiMessage = Array.isArray(err?.message)
        ? err.message.join(", ")
        : err?.message;
      toast.error(apiMessage || "Failed to add occupant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          Add Occupant
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
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
          </div>

          <div>
            <Label htmlFor="relationship">Relationship *</Label>
            <Input
              id="relationship"
              name="relationship"
              type="text"
              value={formData.relationship}
              onChange={handleInputChange}
              placeholder="e.g. child, spouse, parent"
              required
              className="mt-1"
            />
          </div>
        </div>

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
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Adding..." : "Add Occupant"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}

