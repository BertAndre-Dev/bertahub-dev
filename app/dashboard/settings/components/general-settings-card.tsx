"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getUserProfile,
  updateUserProfile,
} from "@/redux/slice/resident/user-profile/user-profile";
import { resetUserProfileState } from "@/redux/slice/resident/user-profile/user-profile-slice";

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  role: string;
};

export function GeneralSettingsCard() {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => {
    const rawId = state.auth.user?.id || state.auth.user?._id || "";
    const trimmed = typeof rawId === "string" ? rawId.trim() : "";
    return trimmed.length > 0 ? trimmed : "";
  });
  const { user, getStatus, updateStatus, error } = useSelector(
    (state: RootState) => state.userProfile,
  );
  const [formData, setFormData] = useState<UserFormState>({
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
    dispatch(resetUserProfileState());
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      dispatch(getUserProfile(userId));
    }
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!userId) {
      setFormError("No signed-in user found");
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
        updateUserProfile({
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

  return (
    <div className="space-y-6">
      <Card className="p-6 w-full md:w-3/4 lg:w-2/3 mx-auto">
        <h2 className="font-heading text-xl font-bold text-center">
          Profile Information
        </h2>
        <p className="text-sm text-gray-500 text-center">
          This is your profile information. You can update your profile here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || error) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {formError || error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="first-name">
                First Name
              </label>
              <Input
                id="first-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="last-name">
                Last Name
              </label>
              <Input
                id="last-name"
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
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="date-of-birth">
                Date of Birth
              </label>
              <Input
                id="date-of-birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="country-code">
                Country Code
              </label>
              <Input
                id="country-code"
                name="countryCode"
                placeholder="+234"
                value={formData.countryCode}
                onChange={handleChange}
                className="mt-2 h-10"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="phone-number">
                Phone
              </label>
              <Input
                id="phone-number"
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
              <label className="text-sm font-medium" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                title="Gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
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
              <label className="text-sm font-medium" htmlFor="role">
                Role
              </label>
              <Input
                id="role"
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
            className="bg-primary hover:bg-primary/90 w-full"
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
