"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IsoDatePicker } from "@/components/ui/iso-date-picker";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/api-error";
import {
  PHONE_E164_ERROR,
  splitPhoneFields,
  toE164PhoneNumber,
} from "@/lib/phone-e164";
import { formatAddressEntryLabel, normalizeAddresses } from "@/lib/address";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import type { AppDispatch } from "@/redux/store";

type AddressSelectOption = { label: string; value: string };

const residentTypeOptions: AddressSelectOption[] = [
  { label: "Owner", value: "owner" },
  { label: "Tenant", value: "tenant" },
];

export type EditableUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  role?: string;
  residentType?: string | null;
  estateId?: string | { id?: string; _id?: string };
  addressId?: string | { id?: string; _id?: string; data?: Record<string, string> };
  addressIds?: (
    | string
    | { id?: string; _id?: string; data?: Record<string, string> }
  )[];
};

export type UpdateUserDetailsData = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  addressIds?: string[];
  role?: string;
  residentType?: string | null;
};

type EditUserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
};

export type EditUserFormProps = {
  userId: string;
  close: () => void;
  onUpdated?: () => void;
  fetchUser: (id: string) => Promise<unknown>;
  saveUser: (id: string, data: UpdateUserDetailsData) => Promise<unknown>;
};

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
}

function emptyForm(): EditUserFormData {
  return {
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    address: "",
  };
}

function mapUserToForm(user: EditableUser): EditUserFormData {
  const { countryCode, nationalNumber } = splitPhoneFields(
    user.phoneNumber,
    user.countryCode,
  );
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    countryCode,
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    gender: user.gender ?? "",
    phoneNumber: nationalNumber,
    address: user.address ?? "",
  };
}

function asEditableUser(res: unknown): EditableUser {
  if (res && typeof res === "object" && "data" in res) {
    const data = (res as { data?: unknown }).data;
    if (data && typeof data === "object") return data as EditableUser;
  }
  return (res ?? {}) as EditableUser;
}

function resolveEstateId(
  raw: string | { id?: string; _id?: string } | null | undefined,
): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  return (raw._id || raw.id || "").trim();
}

function isResidentRole(role?: string | null) {
  return (role ?? "").trim().toLowerCase() === "resident";
}

function optionsFromUserAddresses(user: EditableUser): AddressSelectOption[] {
  const raw = user.addressIds ?? (user.addressId != null ? [user.addressId] : []);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }
      const id = item?.id || item?._id || "";
      if (!id) return null;
      const label = formatAddressEntryLabel(item.data) || id;
      return { value: id, label };
    })
    .filter((opt): opt is AddressSelectOption => Boolean(opt));
}

function mergeAddressOptions(
  estateOptions: AddressSelectOption[],
  userOptions: AddressSelectOption[],
): AddressSelectOption[] {
  const byId = new Map<string, AddressSelectOption>();
  for (const opt of estateOptions) byId.set(opt.value, opt);
  for (const opt of userOptions) {
    if (!byId.has(opt.value)) byId.set(opt.value, opt);
  }
  return Array.from(byId.values());
}

export default function EditUserForm({
  userId,
  close,
  onUpdated,
  fetchUser,
  saveUser,
}: EditUserFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<string | undefined>();
  const [residentType, setResidentType] = useState<string | null | undefined>();
  const [addressIds, setAddressIds] = useState<string[]>([]);
  const [entryOptions, setEntryOptions] = useState<AddressSelectOption[]>([]);
  const [formData, setFormData] = useState<EditUserFormData>(emptyForm);
  const fetchUserRef = useRef(fetchUser);
  const closeRef = useRef(close);
  fetchUserRef.current = fetchUser;
  closeRef.current = close;

  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      toast.error("User id is missing");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingUser(true);
        setLoadingAddresses(true);

        const res = await fetchUserRef.current(userId);
        const user = asEditableUser(res);
        if (cancelled) return;

        setFormData(mapUserToForm(user));
        setRole(user.role);
        setResidentType(user.residentType);
        const selectedIds = normalizeAddresses(
          user as Record<string, unknown>,
        ).map((addr) => addr.id);
        setAddressIds(selectedIds);

        const userAddressOptions = optionsFromUserAddresses(user);
        let estateId = resolveEstateId(user.estateId);

        if (!estateId) {
          try {
            const signedIn = await dispatch(getSignedInUser()).unwrap();
            const data =
              signedIn?.data ?? (signedIn as Record<string, unknown>);
            estateId = resolveEstateId(
              (data as { estateId?: string | { id?: string; _id?: string } })
                ?.estateId,
            );
          } catch {
            // non-blocking — address dropdown may stay empty
          }
        }

        if (cancelled) return;

        if (!estateId) {
          setEntryOptions(userAddressOptions);
          return;
        }

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          setEntryOptions(userAddressOptions);
          return;
        }

        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();
        const entries = entryRes?.data || [];

        const estateOptions: AddressSelectOption[] = entries.map(
          (entry: { id?: string; data?: Record<string, unknown> }) => {
            const label =
              formatAddressEntryLabel(entry.data) ||
              Object.entries(entry.data || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ") ||
              entry.id ||
              "";
            return { label, value: entry.id || "" };
          },
        ).filter((opt: AddressSelectOption) => Boolean(opt.value));

        if (!cancelled) {
          setEntryOptions(mergeAddressOptions(estateOptions, userAddressOptions));
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        closeRef.current();
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
          setLoadingAddresses(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, userId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User id is missing");
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    const phone = formData.phoneNumber.trim();
    const e164Phone = phone
      ? toE164PhoneNumber(phone, formData.countryCode)
      : "";
    if (phone && !e164Phone) {
      toast.error(PHONE_E164_ERROR);
      return;
    }

    const resident = isResidentRole(role);
    const cleanedAddressIds = addressIds.map((id) => id.trim()).filter(Boolean);

    if (resident && cleanedAddressIds.length === 0) {
      toast.error("Please select at least one address");
      return;
    }
    if (resident && !residentType) {
      toast.error("Please select a resident type");
      return;
    }

    setSubmitting(true);
    try {
      const res = await saveUser(userId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        countryCode: formData.countryCode.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phoneNumber: e164Phone || undefined,
        address: formData.address.trim(),
        addressIds: resident ? cleanedAddressIds : [],
        role,
        residentType: resident ? (residentType ?? undefined) : undefined,
      });
      toast.success(
        getApiSuccessMessage(res) || "User details updated successfully",
      );
      onUpdated?.();
      close();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const showResidentFields = isResidentRole(role);
  const selectedAddressOptions = entryOptions.filter((opt) =>
    addressIds.includes(opt.value),
  );
  const selectedResidentType =
    residentTypeOptions.find((opt) => opt.value === residentType) ?? null;

  return (
    <Card className="max-w-lg mx-auto mt-2 relative min-h-[200px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Edit user details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingUser ? (
          <div className="py-10">
            <Loader label="Loading user details..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-countryCode">Country Code</Label>
                <CountryCodeSelect
                  id="edit-countryCode"
                  value={formData.countryCode}
                  onChange={(countryCode) =>
                    setFormData((prev) => ({ ...prev, countryCode }))
                  }
                  disabled={submitting}
                  placeholder="+234"
                  className="mt-1 cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="8100001427"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                <IsoDatePicker
                  id="edit-dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                  }
                  className="mt-1 h-10"
                  ariaLabel="Date of Birth"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <select
                  id="edit-gender"
                  title="Gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full h-10 px-3 mt-1 rounded-lg border border-border bg-background text-sm cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {showResidentFields ? (
              <>
                <div>
                  <Label htmlFor="edit-residentType">Resident type</Label>
                  <Select
                    inputId="edit-residentType"
                    options={residentTypeOptions}
                    value={selectedResidentType}
                    onChange={(opt) =>
                      setResidentType(opt?.value ?? null)
                    }
                    placeholder="Select resident type"
                    isDisabled={submitting}
                    className="mt-1 cursor-pointer"
                    styles={{
                      control: (base) => ({ ...base, cursor: "pointer" }),
                      option: (base) => ({ ...base, cursor: "pointer" }),
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-addressIds">Address(es)</Label>
                  <Select
                    inputId="edit-addressIds"
                    options={entryOptions}
                    value={selectedAddressOptions}
                    onChange={(opts) =>
                      setAddressIds(
                        (opts ?? []).map((opt) => opt.value).filter(Boolean),
                      )
                    }
                    placeholder={
                      loadingAddresses
                        ? "Loading addresses..."
                        : "Select one or more addresses"
                    }
                    isMulti
                    isLoading={loadingAddresses}
                    isDisabled={submitting || loadingAddresses}
                    closeMenuOnSelect={false}
                    className="mt-1 cursor-pointer"
                    styles={{
                      control: (base) => ({ ...base, cursor: "pointer" }),
                      option: (base) => ({ ...base, cursor: "pointer" }),
                      multiValueRemove: (base) => ({
                        ...base,
                        cursor: "pointer",
                      }),
                    }}
                  />
                  {addressIds.length > 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {addressIds.length} address(es) selected
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update user"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
