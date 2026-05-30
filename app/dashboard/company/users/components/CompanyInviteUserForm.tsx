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
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";

type Props = {
  companyId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormState = {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export default function CompanyInviteUserForm({
  companyId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<FormState>({
    estateId: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });
  const [estates, setEstates] = useState<{ id: string; name: string }[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      } catch {
        toast.error("Failed to load estates");
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch]);

  const roleOptions = [
    { value: "estate admin", label: "Estate Admin" },
    { value: "admin", label: "Admin" },
  ];

  const estateOptions = estates.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) return toast.error("Please select a role.");
    if (!formData.email.trim()) return toast.error("Please provide an email.");
    if (!formData.firstName.trim()) return toast.error("Please provide first name.");
    if (!formData.lastName.trim()) return toast.error("Please provide last name.");

    setSubmitting(true);
    try {
      const res = await dispatch(
        iniviteUser({
          companyId,
          ...(formData.estateId.trim() ? { estateId: formData.estateId.trim() } : {}),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          role: formData.role,
          residentType: null,
          addressIds: [],
        }),
      ).unwrap();
      toast.success((res as { message?: string })?.message ?? "User invited successfully");
      setFormData({
        estateId: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "",
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to invite user";
      toast.error(typeof message === "string" ? message : "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Invite user</CardTitle>
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
          <div>
            <Label>
              Estate{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Select
              options={estateOptions}
              value={estateOptions.find((o) => o.value === formData.estateId) ?? null}
              onChange={(opt) =>
                setFormData((prev) => ({ ...prev, estateId: opt?.value ?? "" }))
              }
              isLoading={loadingEstates}
              placeholder="Select estate"
              isClearable
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={roleOptions.find((o) => o.value === formData.role) ?? null}
              onChange={(opt) =>
                setFormData((prev) => ({ ...prev, role: opt?.value ?? "" }))
              }
              placeholder="Select role"
            />
          </div>
          <Button type="submit" className="w-full cursor-pointer" disabled={submitting}>
            {submitting ? "Inviting..." : "Invite user"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
