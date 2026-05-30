"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IsoDatePicker } from "@/components/ui/iso-date-picker";
import type { AppDispatch, RootState } from "@/redux/store";
import { resetStaffUserProfileState } from "@/redux/slice/staff/user-profile/staff-user-profile-slice";
import {
  getStaffUserProfile,
  updateStaffUserProfile,
} from "@/redux/slice/staff/user-profile/staff-user-profile";

type StaffFormState = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  role: string;
};

function extractUserId(raw: unknown): string | null {
  if (!raw) return null;
  const str = typeof raw === "string" ? raw.trim() : String(raw).trim();
  if (/^[a-f\d]{24}$/i.test(str)) return str;
  return null;
}

export function StaffGeneralSettingsCard() {
  const dispatch = useDispatch<AppDispatch>();

  const userId = useSelector((state: RootState) => {
    const raw = state.auth.user?.id || state.auth.user?._id;
    return extractUserId(raw);
  });

  const { user, getStatus, updateStatus, error } = useSelector(
    (state: RootState) => state.staffUserProfile,
  );

  const [formData, setFormData] = useState<StaffFormState>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    role: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormError("");
    dispatch(resetStaffUserProfileState());
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;
    dispatch(getStaffUserProfile(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      countryCode: user.countryCode || "",
      phoneNumber: user.phoneNumber || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      gender: user.gender || "",
      role: user.role || "",
    });
  }, [user]);

  const isLoading = useMemo(
    () => getStatus === "isLoading" || updateStatus === "isLoading",
    [getStatus, updateStatus],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!userId) {
      setFormError("Your session is not ready yet. Please wait or refresh.");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFormError("First name, last name, and email are required");
      return;
    }

    if (!formData.email.includes("@")) {
      setFormError("Please enter a valid email");
      return;
    }

    try {
      const res = await dispatch(
        updateStaffUserProfile({
          id: userId,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            countryCode: formData.countryCode,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            phoneNumber: formData.phoneNumber,
            role: formData.role || undefined,
          },
        }),
      ).unwrap();
      toast.success(res?.message || "Profile updated successfully");
    } catch (err: any) {
      const message =
        err?.message || err?.payload || "Failed to update profile";
      setFormError(message);
      toast.error(message);
    }
  };

  if (!userId) {
    return (
      <div className="space-y-6">
        <Card className="pt-6 md:pt-8 px-8 md:px-16 pb-12 md:pb-18 w-full md:w-3/4 lg:w-2/3 mx-auto">
          <p className="text-center text-sm text-muted-foreground py-8">
            Loading your profile...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="pt-6 md:pt-8 px-8 md:px-16 pb-12 md:pb-18 w-full md:w-3/4 lg:w-2/3 mx-auto">
        <h2 className="font-heading text-xl font-bold text-center">
          Profile Information
        </h2>
        <p className="text-sm text-gray-500 text-center">
          Update your staff profile details here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || error) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {formError || error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="staff-first-name">
                First Name
              </label>
              <Input
                id="staff-first-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="staff-last-name">
                Last Name
              </label>
              <Input
                id="staff-last-name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="staff-email">
                Email
              </label>
              <Input
                id="staff-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="staff-dob">
                Date of Birth
              </label>
              <IsoDatePicker
                id="staff-dob"
                value={formData.dateOfBirth}
                onChange={(iso) =>
                  setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                }
                className="mt-2 h-10"
                disabled={isLoading}
                ariaLabel="Date of Birth"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="staff-country-code">
                Country Code
              </label>
              <Input
                id="staff-country-code"
                name="countryCode"
                placeholder="+234"
                value={formData.countryCode}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="staff-phone">
                Phone
              </label>
              <Input
                id="staff-phone"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="staff-gender">
                Gender
              </label>
              <select
                id="staff-gender"
                title="Gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm mt-2"
                disabled={isLoading}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="staff-role">
                Role
              </label>
              <Input
                id="staff-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled
              />
            </div>
          </div>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 mt-8 w-full"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
