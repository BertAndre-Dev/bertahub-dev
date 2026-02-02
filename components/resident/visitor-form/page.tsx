"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  updateVisitor,
  getVisitorById,
} from "@/redux/slice/resident/visitor/visitor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    address: "",
  });

  // Auto-populate address from addressId prop
  useEffect(() => {
    if (addressId && typeof addressId === "object" && addressId.data) {
      const { block, unit } = addressId.data;
      setFormData((prev) => ({
        ...prev,
        address: `${block}, ${unit}`,
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
            setFormData({
              firstName: visitor.firstName || "",
              lastName: visitor.lastName || "",
              phone: visitor.phone || "",
              purpose: visitor.purpose || "",
              address: visitor.address || "",
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

    setSubmitting(true);
    try {
      if (visitorId) {
        // Update visitor
        await dispatch(
          updateVisitor({
            id: visitorId,
            data: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              purpose: formData.purpose,
            },
          }),
        ).unwrap();
        toast.success("Visitor updated successfully");
      } else {
        // Create visitor - extract addressId string if it's an object
        const addressIdString =
          typeof addressId === "object" && addressId !== null
            ? addressId.id
            : addressId;

        await dispatch(
          createVisitor({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            purpose: formData.purpose,
            residentId,
            estateId,
            addressId: addressIdString,
          }),
        ).unwrap();
        toast.success("Visitor created successfully");
      }

      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      toast.error(
        err?.message || `Failed to ${visitorId ? "update" : "create"} visitor`,
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
