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
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";

type InviteUserFormProps = {
  close: () => void;
};

interface InviteUserFormData {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  addressId?: string;
}

// ✅ FIXED: Correct React.FC syntax
const InviteUserForm: React.FC<InviteUserFormProps> = ({ close }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<InviteUserFormData>({
    estateId: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    addressId: "",
  });

  const [estates, setEstates] = useState<any[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(false);
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
      } catch (err) {
        console.error("Failed to fetch estates", err);
        toast.error("Failed to fetch estates");
      } finally {
        setLoadingEstates(false);
      }
    }

    fetchEstates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const roleOptions = [
    { value: "estate admin", label: "Estate Admin" },
    { value: "admin", label: "Admin" },
  ];

  const estateOptions = estates.map((est: any) => ({
    value: est.id ?? est._id,
    label: est.name,
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
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      addressId: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.estateId) return toast.error("Please select an estate.");
    if (!formData.role) return toast.error("Please select a role.");
    if (!formData.email) return toast.error("Please provide an email.");
    if (!formData.firstName) return toast.error("Please provide first name.");
    if (!formData.lastName) return toast.error("Please provide last name.");

    setSubmitting(true);
    try {
      const res = await dispatch(iniviteUser(formData) as any).unwrap();
      toast.success(res?.message || "User invited successfully");
      resetForm();
      close();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to invite user (unknown error)";
      toast.error(message);
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
        label: "Email",
        name: "email",
        placeholder: "user@example.com",
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
          Invite User to Estate
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderTextFields()}

          <div>
            <Label>Estate</Label>
            <Select
              options={estateOptions}
              value={
                estateOptions.find((o) => o.value === formData.estateId) ?? null
              }
              onChange={(opt) => handleSelectChange("estateId", opt)}
              isLoading={loadingEstates}
              placeholder="Select estate..."
              isClearable
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={roleOptions.find((o) => o.value === formData.role) ?? null}
              onChange={(opt) => handleSelectChange("role", opt)}
              placeholder="Select role..."
              isClearable
            />
          </div>

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
