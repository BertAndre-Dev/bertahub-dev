"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { iniviteUser } from "@/redux/slice/auth-mgt/auth-mgt"; // keep name you used
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import {
  buildInviteUserPayload,
  isEnergyProviderRole,
  SUPER_ADMIN_COMPANY_INVITE_ROLE_OPTIONS,
  SUPER_ADMIN_ESTATE_INVITE_ROLE_OPTIONS,
  validateEnergyProviderInviteScope,
} from "@/lib/invite-user-roles";
import InvitePhoneNumberField from "@/components/invite/InvitePhoneNumberField";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationError,
  toE164PhoneNumber,
} from "@/lib/phone-e164";

type InviteUserFormProps = {
  close: () => void;
};

interface InviteUserFormData {
  estateId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: string;
}

// ✅ FIXED: Correct React.FC syntax
const InviteUserForm: React.FC<InviteUserFormProps> = ({ close }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [inviteScope, setInviteScope] = useState<"estate" | "company">("estate");
  const [formData, setFormData] = useState<InviteUserFormData>({
    estateId: "",
    companyId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    role: "",
  });

  const [estates, setEstates] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ FIXED: Properly select estate slice
  const estateState = useSelector((state: RootState) => state.estate);
  const estateListFromStore =
    estateState?.allEstates?.data || estateState?.allEstates || [];

  useEffect(() => {
    async function fetchEstates() {
      if (
        Array.isArray(estateListFromStore) &&
        estateListFromStore.length > 0
      ) {
        setEstates(estateListFromStore);
        return;
      }

      setLoadingEstates(true);
      try {
        const res = await await dispatch(
          getAllEstates({ page: 1, limit: 10 }),
        ).unwrap();
        const payload = res?.payload || res;
        const data = payload?.data || payload;
        if (Array.isArray(data)) setEstates(data);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingEstates(false);
      }
    }

    fetchEstates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res: any = await dispatch(
          getCompanies({ page: 1, limit: 200 }),
        ).unwrap();
        const data = res?.data ?? [];
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, [dispatch]);

  const roleOptions =
    inviteScope === "company"
      ? [...SUPER_ADMIN_COMPANY_INVITE_ROLE_OPTIONS]
      : [...SUPER_ADMIN_ESTATE_INVITE_ROLE_OPTIONS];

  const invitingEnergyProvider = isEnergyProviderRole(formData.role);

  const estateOptions = estates.map((est: any) => ({
    value: est.id ?? est._id,
    label: est.name,
  }));

  const companyOptions = companies.map((c: any) => ({
    value: c.id ?? c._id,
    label: c.name,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (field: keyof InviteUserFormData, option: any) => {
    setFormData((prev) => ({ ...prev, [field]: option?.value ?? "" }));
  };

  const resetForm = () =>
    setFormData({
      estateId: "",
      companyId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      countryCode: DEFAULT_COUNTRY_CODE,
      role: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) return toast.error("Please select a role.");
    if (!formData.email) return toast.error("Please provide an email.");
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
    if (!formData.firstName) return toast.error("Please provide first name.");
    if (!formData.lastName) return toast.error("Please provide last name.");
    if (inviteScope === "estate" && !formData.estateId?.trim()) {
      return toast.error("Please select an estate.");
    }
    if (inviteScope === "company" && !formData.companyId?.trim()) {
      return toast.error("Please select a company.");
    }

    const energyProviderError = validateEnergyProviderInviteScope({
      role: formData.role,
      inviteContext: inviteScope,
      estateId: formData.estateId,
      companyId: formData.companyId,
    });
    if (energyProviderError) return toast.error(energyProviderError);

    setSubmitting(true);
    try {
      const payload = buildInviteUserPayload({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: e164Phone,
        role: formData.role,
        inviteContext: inviteScope,
        estateId: formData.estateId,
        companyId: formData.companyId,
      });
      const res = await dispatch(iniviteUser(payload) as any).unwrap();
      toast.success(res?.message || "User invited successfully");
      resetForm();
      setInviteScope("estate");
      close();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTextFields = () => {
    const fields = [
      {
        label: "First Name",
        name: "firstName",
        placeholder: "Enter first name",
        required: true,
      },
      {
        label: "Last Name",
        name: "lastName",
        placeholder: "Enter last name",
        required: true,
      },
      {
        label: "Email Address",
        name: "email",
        placeholder: "Enter email",
        required: true,
        type: "email",
      },
    ];

    const nodes: JSX.Element[] = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      nodes.push(
        <div key={f.name}>
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            name={f.name}
            type={(f as any).type ?? "text"}
            value={(formData as any)[f.name] ?? ""}
            onChange={handleInputChange}
            placeholder={f.placeholder}
            required={f.required}
            className="mb-2"
          />
        </div>,
      );
    }
    return nodes;
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {inviteScope === "company"
            ? "Invite admin to Company"
            : "Invite admins to Estate"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {renderTextFields()}

          <div className="space-y-3">
            <Label>Invite admin to</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="inviteScope"
                  value="estate"
                  checked={inviteScope === "estate"}
                  onChange={() => {
                    setInviteScope("estate");
                    setFormData((p) => ({ ...p, companyId: "", role: "", plan: "" }));
                  }}
                />
                Estate
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="inviteScope"
                  value="company"
                  checked={inviteScope === "company"}
                  onChange={() => {
                    setInviteScope("company");
                    setFormData((p) => ({ ...p, estateId: "", role: "", plan: "" }));
                  }}
                />
                Company
              </label>
            </div>
          </div>

          {inviteScope === "estate" ? (
            <div>
              <Label>Estate</Label>
              <Select
                options={estateOptions}
                value={
                  estateOptions.find((o) => o.value === formData.estateId) ??
                  null
                }
                onChange={(opt) => handleSelectChange("estateId", opt)}
                isLoading={loadingEstates}
                placeholder="Select estate"
                isClearable
              />
            </div>
          ) : (
            <>
              <div>
                <Label>Company</Label>
                <Select
                  options={companyOptions}
                  value={
                    companyOptions.find((o) => o.value === formData.companyId) ??
                    null
                  }
                  onChange={(opt) => handleSelectChange("companyId", opt)}
                  isLoading={loadingCompanies}
                  placeholder="Select company"
                  isClearable
                />
              </div>
              {invitingEnergyProvider && (
                <div>
                  <Label>Estate</Label>
                  <Select
                    options={estateOptions}
                    value={
                      estateOptions.find((o) => o.value === formData.estateId) ??
                      null
                    }
                    onChange={(opt) => handleSelectChange("estateId", opt)}
                    isLoading={loadingEstates}
                    placeholder="Select estate"
                    isClearable
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={roleOptions.find((o) => o.value === formData.role) ?? null}
              onChange={(opt) => handleSelectChange("role", opt)}
              placeholder="Select role"
              isClearable
            />
          </div>

          <InvitePhoneNumberField
            id="phoneNumber"
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(countryCode) =>
              setFormData((prev) => ({ ...prev, countryCode }))
            }
            onPhoneNumberChange={handleInputChange}
          />

          <Button
            type="submit"
            className="w-full mt-2 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Inviting..." : "Invite User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InviteUserForm;
