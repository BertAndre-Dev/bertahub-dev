"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { iniviteUser, getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import InvitePhoneNumberField from "@/components/invite/InvitePhoneNumberField";
import type { AppDispatch } from "@/redux/store";
import { getDesignations } from "@/redux/slice/designations/designations";
import { DESIGNATIONS_PAGE_SIZE, isCompanyScopedDesignation } from "@/lib/designations";
import {
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationError,
  toE164PhoneNumber,
} from "@/lib/phone-e164";
import {
  inviteRequiresDesignation,
  getAdminInviteLabel,
  type AdminInviteRole,
} from "@/lib/invite-user-roles";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";

type InviteUserFormProps = {
  close: () => void;
  refresh: () => void;
  role?: AdminInviteRole;
};

interface InviteUserFormData {
  estateId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: "resident" | "security" | "staff" | "company" | "";
  residentType: string | null;
  addressIds: string[];
  designationId: string;
}

const roleOptions = [
  { label: "Resident", value: "resident" },
  { label: "Staff", value: "staff" },
  { label: "Security", value: "security" },
  // { label: "Company", value: "company" },
];

const InviteUserForm: React.FC<InviteUserFormProps> = ({
  close,
  refresh,
  role: lockedRole,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState<InviteUserFormData>({
    estateId: "",
    companyId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    role: lockedRole ?? "",
    residentType: lockedRole === "resident" ? "owner" : null,
    addressIds: [],
    designationId: "",
  });

  const [loading, setLoading] = useState(false);
  const [entryOptions, setEntryOptions] = useState<any[]>([]);
  const [designationOptions, setDesignationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [designationLoading, setDesignationLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);

        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const company = parseCompanyFromUser(
          data as Record<string, unknown>,
        );
        const companyId = company?.id ?? "";

        // Stash whatever ids we found so submit can validate later.
        setFormData((prev) => ({ ...prev, estateId, companyId }));

        if (!estateId) {
          toast.error("No estate linked to your account.");
          return;
        }

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured.");
          return;
        }

        const primaryFieldId = fields[0].id;

        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();

        const entries = entryRes?.data || [];

        const options = entries.map((entry: any) => {
          const d = entry.data || {};
          const label = Object.entries(d)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

          return {
            label,
            value: entry.id,
          };
        });

        setEntryOptions(options);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch]);

  useEffect(() => {
    if (!inviteRequiresDesignation(formData.role)) {
      setDesignationOptions([]);
      return;
    }

    const companyId = formData.companyId.trim();
    const estateId = formData.estateId.trim();
    if (!companyId && !estateId) {
      setDesignationOptions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setDesignationLoading(true);
      try {
        const res = await dispatch(
          getDesignations({
            ...(companyId
              ? { companyId }
              : estateId
                ? { estateId }
                : {}),
            page: 1,
            limit: DESIGNATIONS_PAGE_SIZE,
          }),
        ).unwrap();
        if (cancelled) return;
        const items = (res.items ?? []).filter((item) => item.isActive);
        setDesignationOptions(
          (companyId
            ? items.filter(isCompanyScopedDesignation)
            : items
          ).map((item) => ({ value: item.id, label: item.name })),
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
  }, [dispatch, formData.role, formData.companyId, formData.estateId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.estateId) {
      return toast.error("No estate linked to your account.");
    }

    if (!formData.role) {
      return toast.error("Please select a role");
    }

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

    if (formData.role === "resident") {
      if (!formData.addressIds?.length) {
        return toast.error("Please select at least one address");
      }
    }

    if (inviteRequiresDesignation(formData.role) && !formData.designationId.trim()) {
      return toast.error("Please select a designation.");
    }

    // companyId is optional on the invite endpoint — only include it when we
    // actually resolved one for the signed-in admin. This prevents sending
    // empty/null ids which trigger backend ObjectId cast errors.
    const trimmedCompanyId = formData.companyId?.trim();
    const payload = {
      estateId: formData.estateId,
      ...(trimmedCompanyId ? { companyId: trimmedCompanyId } : {}),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: e164Phone,
      role: formData.role,
      residentType: formData.role === "resident" ? "owner" : null,
      ...(inviteRequiresDesignation(formData.role)
        ? { designationId: formData.designationId.trim() }
        : {}),
      // Guard against accidental empty ids (prevents backend ObjectId cast errors)
      addressIds:
        formData.role === "resident"
          ? (formData.addressIds ?? []).map((x) => String(x).trim()).filter(Boolean)
          : ([] as string[]),
    };

    setLoading(true);
    try {
      const res = await dispatch(iniviteUser(payload) as any).unwrap();
      toast.success(res?.message || "User invited successfully");
      close();
      refresh();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  let submitLabel = "Invite User";
  if (loading) submitLabel = "Inviting...";
  else if (lockedRole) submitLabel = getAdminInviteLabel(lockedRole);

  return (
    <Card className="border-0 shadow-none bg-transparent mt-0 py-0 px-0 gap-3">
      <CardHeader className="px-0 md:px-0 pb-0 pr-8">
        <CardTitle className="text-lg font-semibold">
          {lockedRole ? getAdminInviteLabel(lockedRole) : "Invite User"}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 md:px-0">
        <form onSubmit={handleSubmit} className="space-y-3">

          {(
            [
              { name: "firstName", label: "First Name", type: "text" },
              { name: "lastName", label: "Last Name", type: "text" },
              { name: "email", label: "Email", type: "email" },
            ] as const
          ).map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                value={(formData as any)[field.name]}
                onChange={handleInput}
                required
              />
            </div>
          ))}

          {lockedRole ? null : (
          <div>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={roleOptions.find((r) => r.value === formData.role)}
              onChange={(opt) => {
                const role = (opt?.value ?? "") as InviteUserFormData["role"];
                setFormData((prev) => ({
                  ...prev,
                  role,
                  residentType: role === "resident" ? prev.residentType ?? "owner" : null,
                  addressIds: role === "resident" ? prev.addressIds : [],
                  designationId: inviteRequiresDesignation(role)
                    ? prev.designationId
                    : "",
                }));
              }}
              placeholder="Select role"
            />
          </div>
          )}

          {inviteRequiresDesignation(formData.role) ? (
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
                noOptionsMessage={() =>
                  formData.estateId
                    ? "No designations for this estate"
                    : formData.companyId
                      ? "No designations for this company"
                      : "No estate linked to load designations"
                }
              />
            </div>
          ) : null}

          <InvitePhoneNumberField
            id="phoneNumber"
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(countryCode) =>
              setFormData((prev) => ({ ...prev, countryCode }))
            }
            onPhoneNumberChange={handleInput}
          />

          {/* Address(es) – checkboxes for Resident (one email, multiple apartments) */}
          {formData.role === "resident" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Address(es) – select all that apply</Label>
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
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading addresses...</p>
                ) : entryOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No addresses configured.</p>
                ) : (
                  entryOptions.map((entry) => (
                    <label
                      key={entry.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={formData.addressIds.includes(entry.value)}
                        onChange={(e) => {
                          const id = entry.value;
                          setFormData((prev) => ({
                            ...prev,
                            addressIds: e.target.checked
                              ? [...prev.addressIds, id]
                              : prev.addressIds.filter((x) => x !== id),
                          }));
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{entry.label}</span>
                    </label>
                  ))
                )}
              </div>
              {formData.role === "resident" && formData.addressIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.addressIds.length} address(es) selected
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {submitLabel}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
};

export default InviteUserForm;
