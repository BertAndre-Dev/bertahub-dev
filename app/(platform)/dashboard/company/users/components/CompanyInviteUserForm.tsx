"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import { iniviteUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  buildInviteUserPayload,
  inviteRequiresDesignation,
  validateEnergyProviderInviteScope,
  type CompanyInviteRole,
  getCompanyInviteLabel,
} from "@/lib/invite-user-roles";
import InvitePhoneNumberField from "@/components/invite/InvitePhoneNumberField";
import {
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationError,
  toE164PhoneNumber,
} from "@/lib/phone-e164";
import { getDesignations } from "@/redux/slice/designations/designations";
import {
  DESIGNATIONS_PAGE_SIZE,
  isCompanyScopedDesignation,
} from "@/lib/designations";

type Props = {
  companyId: string;
  role: CompanyInviteRole;
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
  designationId: string;
};

export default function CompanyInviteUserForm({
  companyId,
  role,
  defaultEstateId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const inviteLabel = getCompanyInviteLabel(role);

  const [formData, setFormData] = useState<FormState>({
    estateId: defaultEstateId ?? "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    designationId: "",
  });
  const [estates, setEstates] = useState<{ id: string; name: string }[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [designationOptions, setDesignationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [designationLoading, setDesignationLoading] = useState(false);
  const requiresDesignation = inviteRequiresDesignation(role);

  useEffect(() => {
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 200 }),
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
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
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
    if (!requiresDesignation) {
      setDesignationOptions([]);
      return;
    }
    const trimmedCompanyId = companyId.trim();
    if (!trimmedCompanyId) {
      setDesignationOptions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setDesignationLoading(true);
      try {
        const res = await dispatch(
          getDesignations({
            companyId: trimmedCompanyId,
            page: 1,
            limit: DESIGNATIONS_PAGE_SIZE,
          }),
        ).unwrap();
        if (cancelled) return;
        setDesignationOptions(
          (res.items ?? [])
            .filter((item) => item.isActive)
            .filter(isCompanyScopedDesignation)
            .map((item) => ({ value: item.id, label: item.name })),
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setDesignationOptions([]);
      } finally {
        if (!cancelled) setDesignationLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, dispatch, requiresDesignation]);

  const estateOptions = estates.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    if (!formData.firstName.trim())
      return toast.error("Please provide first name.");
    if (!formData.lastName.trim())
      return toast.error("Please provide last name.");
    if (!formData.estateId.trim()) return toast.error("Please select an estate.");
    if (requiresDesignation && !formData.designationId.trim()) {
      return toast.error("Please select a designation.");
    }

    const energyProviderError = validateEnergyProviderInviteScope({
      role,
      inviteContext: "company",
      estateId: formData.estateId,
      companyId,
    });
    if (energyProviderError) return toast.error(energyProviderError);

    setSubmitting(true);
    try {
      const res = await dispatch(
        iniviteUser(
          buildInviteUserPayload({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: e164Phone,
            role,
            inviteContext: "company",
            estateId: formData.estateId,
            companyId,
            ...(requiresDesignation
              ? { designationId: formData.designationId.trim() }
              : {}),
          }),
        ),
      ).unwrap();
      toast.success(
        (res as { message?: string })?.message ?? `${inviteLabel} sent`,
      );
      setFormData({
        estateId: defaultEstateId ?? "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        countryCode: DEFAULT_COUNTRY_CODE,
        designationId: "",
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{inviteLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="invite-first-name">First name</Label>
            <Input
              id="invite-first-name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter first name"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-last-name">Last name</Label>
            <Input
              id="invite-last-name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter last name"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              required
            />
          </div>
          <InvitePhoneNumberField
            id="invite-phone"
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
                }))
              }
              isLoading={loadingEstates}
              placeholder="Select estate"
            />
          </div>
          {requiresDesignation ? (
            <div>
              <Label>Designation</Label>
              <Select
                options={designationOptions}
                value={
                  designationOptions.find(
                    (option) => option.value === formData.designationId,
                  ) ?? null
                }
                onChange={(opt) =>
                  setFormData((prev) => ({
                    ...prev,
                    designationId: opt?.value ?? "",
                  }))
                }
                isLoading={designationLoading}
                placeholder={
                  designationLoading
                    ? "Loading designations..."
                    : "Select designation"
                }
                noOptionsMessage={() => "No designations for this company"}
              />
            </div>
          ) : null}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Inviting..." : inviteLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
