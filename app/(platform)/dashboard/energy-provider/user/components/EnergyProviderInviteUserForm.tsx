"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/redux/store";
import { iniviteUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEnergyProviderEstates } from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate";
import { getEnergyProviderFieldByEstate } from "@/redux/slice/energy-provider/address-mgt/fields/energy-provider-fields";
import { getEnergyProviderEntriesByField } from "@/redux/slice/energy-provider/address-mgt/entry/energy-provider-entry";
import { buildEnergyProviderInviteHomeOwnerPayload } from "@/lib/invite-user-roles";
import InvitePhoneNumberField from "@/components/invite/InvitePhoneNumberField";
import {
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationError,
  toE164PhoneNumber,
} from "@/lib/phone-e164";

type Props = {
  companyId?: string;
  defaultEstateId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormState = {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  addressIds: string[];
};

type AddressOption = {
  label: string;
  value: string;
};

export default function EnergyProviderInviteUserForm({
  companyId,
  defaultEstateId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<FormState>({
    estateId: defaultEstateId ?? "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    addressIds: [],
  });
  const [estates, setEstates] = useState<{ id: string; name: string }[]>([]);
  const [entryOptions, setEntryOptions] = useState<AddressOption[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getEnergyProviderEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const rows = (res?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
        }>;
        setEstates(
          rows
            .map((e) => ({
              id: e.id || e._id || "",
              name: e.name ?? "Unnamed estate",
            }))
            .filter((e) => e.id),
        );
      } catch {
        toast.error("Failed to load estates");
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (defaultEstateId) {
      setFormData((prev) => ({ ...prev, estateId: defaultEstateId }));
    }
  }, [defaultEstateId]);

  useEffect(() => {
    const estateId = formData.estateId.trim();
    if (!estateId) {
      setEntryOptions([]);
      setFormData((prev) => ({ ...prev, addressIds: [] }));
      return;
    }

    (async () => {
      setLoadingAddresses(true);
      try {
        const fieldRes = await dispatch(
          getEnergyProviderFieldByEstate(estateId),
        ).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          setEntryOptions([]);
          return;
        }

        const fieldId = fields[0]?.id || fields[0]?._id;
        if (!fieldId) {
          setEntryOptions([]);
          return;
        }

        const entryRes = await dispatch(
          getEnergyProviderEntriesByField({
            fieldId,
            page: 1,
            limit: 200,
          }),
        ).unwrap();

        const options = (entryRes?.data || []).map(
          (entry: { id?: string; data?: Record<string, unknown> }) => {
            const data = entry.data || {};
            const label = Object.entries(data)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(", ");
            return {
              label: label || entry.id || "Address",
              value: entry.id || "",
            };
          },
        ).filter((option: AddressOption) => option.value);

        setEntryOptions(options);
      } catch {
        toast.error("Failed to load addresses for this estate.");
        setEntryOptions([]);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [dispatch, formData.estateId]);

  const estateOptions = estates.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAddress = (addressId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      addressIds: checked
        ? [...prev.addressIds, addressId]
        : prev.addressIds.filter((id) => id !== addressId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return toast.error("Please provide an email.");
    if (!formData.phoneNumber.trim()) {
      return toast.error("Please provide a phone number.");
    }
    if (!formData.countryCode.trim()) {
      return toast.error("Please select a country code.");
    }
    const e164Phone = toE164PhoneNumber(
      formData.phoneNumber,
      formData.countryCode,
    );
    if (!e164Phone) {
      return toast.error(
        getPhoneValidationError(
          formData.phoneNumber,
          formData.countryCode,
        ),
      );
    }
    if (!formData.firstName.trim()) return toast.error("Please provide first name.");
    if (!formData.lastName.trim()) return toast.error("Please provide last name.");
    if (!formData.estateId.trim()) return toast.error("Please select an estate.");
    if (!formData.addressIds.length) {
      return toast.error("Please select at least one address.");
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        iniviteUser(
          buildEnergyProviderInviteHomeOwnerPayload({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: e164Phone,
            estateId: formData.estateId,
            companyId,
            addressIds: formData.addressIds,
          }),
        ),
      ).unwrap();
      toast.success(
        (res as { message?: string })?.message ?? "Home owner invited successfully",
      );
      setFormData({
        estateId: defaultEstateId ?? "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        countryCode: DEFAULT_COUNTRY_CODE,
        addressIds: [],
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to invite home owner";
      toast.error(typeof message === "string" ? message : "Failed to invite home owner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Invite home owner</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="ep-invite-first-name">First name</Label>
            <Input
              id="ep-invite-first-name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter first name"
              required
            />
          </div>
          <div>
            <Label htmlFor="ep-invite-last-name">Last name</Label>
            <Input
              id="ep-invite-last-name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter last name"
              required
            />
          </div>
          <div>
            <Label htmlFor="ep-invite-email">Email</Label>
            <Input
              id="ep-invite-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              required
            />
          </div>
          <InvitePhoneNumberField
            id="ep-invite-phone"
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(countryCode) =>
              setFormData((prev) => ({ ...prev, countryCode }))
            }
            onPhoneNumberChange={handleInputChange}
          />
          <div>
            <Label>Estate</Label>
            <Select
              options={estateOptions}
              value={
                estateOptions.find((o) => o.value === formData.estateId) ?? null
              }
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  estateId: opt?.value ?? "",
                  addressIds: [],
                }))
              }
              isLoading={loadingEstates}
              placeholder="Select estate"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Address(es)</Label>
              {entryOptions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        addressIds: entryOptions.map((o) => o.value),
                      }))
                    }
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, addressIds: [] }))
                    }
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3 space-y-2 bg-muted/20">
              {loadingAddresses ? (
                <p className="text-sm text-muted-foreground">Loading addresses...</p>
              ) : entryOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No addresses configured for this estate.
                </p>
              ) : (
                entryOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.addressIds.includes(option.value)}
                      onChange={(e) =>
                        toggleAddress(option.value, e.target.checked)
                      }
                      className="mt-1"
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={submitting || loadingAddresses}
          >
            {submitting ? "Inviting..." : "Invite home owner"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
