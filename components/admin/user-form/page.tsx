"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { iniviteUser, getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch } from "@/redux/store";

type InviteUserFormProps = {
  close: () => void;
  refresh: () => void;
};

interface InviteUserFormData {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "resident" | "security" | "";
  residentType: string;
  addressIds: string[];
}

const roleOptions = [
  { label: "Resident", value: "resident" },
  { label: "Security", value: "security" },
];

const residentTypeOptions = [
  { label: "Owner", value: "owner" },
  { label: "Tenant", value: "tenant" },
];

const InviteUserForm: React.FC<InviteUserFormProps> = ({ close, refresh }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState<InviteUserFormData>({
    estateId: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    residentType: "",
    addressIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [entryOptions, setEntryOptions] = useState<any[]>([]);

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

        if (!estateId) {
          return toast.error("No estate linked to your account.");
        }

        setFormData((prev) => ({ ...prev, estateId }));

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) return toast.error("No address fields configured.");

        const primaryFieldId = fields[0].id;

        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 })
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
      } catch {
        toast.error("Failed to load estate address entries.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      return toast.error("Please select a role");
    }

    if (formData.role === "resident") {
      if (!formData.residentType) {
        return toast.error("Please select resident type (Owner or Tenant)");
      }
      if (!formData.addressIds?.length) {
        return toast.error("Please select at least one address");
      }
    }

    const payload = {
      estateId: formData.estateId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      residentType: formData.role === "resident" ? formData.residentType : "owner",
      addressIds: formData.role === "resident" ? formData.addressIds : [] as string[],
    };

    setLoading(true);
    try {
      const res = await dispatch(iniviteUser(payload) as any).unwrap();
      toast.success(res?.message || "User invited successfully");
      close();
      refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Invite User</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {["firstName", "lastName", "email"].map((field) => (
            <div key={field}>
              <Label className="capitalize">{field}</Label>
              <Input
                name={field}
                type={field === "email" ? "email" : "text"}
                value={(formData as any)[field]}
                onChange={handleInput}
                required
              />
            </div>
          ))}

          {/* Role */}
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
                  residentType: role === "resident" ? prev.residentType : "",
                  addressIds: role === "resident" ? prev.addressIds : [],
                }));
              }}
              placeholder="Select role"
            />
          </div>

          {/* Resident type (for Resident role) */}
          {formData.role === "resident" && (
            <div>
              <Label>Resident Type</Label>
              <Select
                options={residentTypeOptions}
                value={residentTypeOptions.find((r) => r.value === formData.residentType)}
                onChange={(opt) =>
                  setFormData((prev) => ({ ...prev, residentType: opt?.value ?? "" }))
                }
                placeholder="Select Owner or Tenant"
              />
            </div>
          )}

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
            {loading ? "Inviting..." : "Invite User"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
};

export default InviteUserForm;
