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
  addressId?: string;
}

const roleOptions = [
  { label: "Resident", value: "resident" },
  { label: "Security", value: "security" },
];

const InviteUserForm: React.FC<InviteUserFormProps> = ({ close, refresh }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState<InviteUserFormData>({
    estateId: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    addressId: "",
  });

  const [loading, setLoading] = useState(false);
  const [entryOptions, setEntryOptions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const estateId = userRes?.data?.estateId;
        if (!estateId) return toast.error("No estate linked to your account.");

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

    if (formData.role === "resident" && !formData.addressId) {
      return toast.error("Please select an address");
    }

    setLoading(true);
    try {
      const res = await dispatch(iniviteUser(formData) as any).unwrap();
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

          {/* 🔹 ROLE */}
          <div>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={roleOptions.find((r) => r.value === formData.role)}
              onChange={(opt) => {
                const role = opt?.value as "resident" | "security";
                setFormData((prev) => ({
                  ...prev,
                  role,
                  addressId: role === "security" ? "" : prev.addressId,
                }));
              }}
              placeholder="Select role"
            />
          </div>

          {/* 🔹 ADDRESS (RESIDENT ONLY) */}
          {formData.role === "resident" && (
            <div>
              <Label>Address</Label>
              <Select
                options={entryOptions}
                isLoading={loading}
                onChange={(opt) =>
                  setFormData((prev) => ({ ...prev, addressId: opt?.value }))
                }
                placeholder="Select Address (e.g. block: 1, unit: 1, flat: 2)"
              />
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
