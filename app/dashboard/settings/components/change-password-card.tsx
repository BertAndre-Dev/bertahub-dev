"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, resetPassword } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch, RootState } from "@/redux/store";


type ResetFormState = {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordCard() {
  const dispatch = useDispatch<AppDispatch>();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [formData, setFormData] = useState<ResetFormState>({
    email: "",
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [resetError, setResetError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false); // New state

  useEffect(() => {
    if (userEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail, formData.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!formData.email) {
      setForgotError("Please enter your email address");
      return;
    }

    if (!formData.email.includes("@")) {
      setForgotError("Please enter a valid email");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await dispatch(
        forgotPassword({ email: formData.email }),
      ).unwrap();
      toast.success(res?.message || "Reset code sent to your email");
      setCodeSent(true); // Show reset password section
    } catch (err: any) {
      const message =
        err?.message ||
        err?.payload ||
        "Failed to send reset code. Please try again.";
      setForgotError(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    const { email, resetToken, newPassword, confirmPassword } = formData;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      setResetError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setResetError("Please enter a valid email");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);
    try {
      const res = await dispatch(
        resetPassword({ email, resetToken, newPassword }),
      ).unwrap();
      toast.success(res?.message || "Password reset successfully");
      setFormData({
        email: "",
        resetToken: "",
        newPassword: "",
        confirmPassword: "",
      });
      setCodeSent(false); // Hide reset section after successful reset
    } catch (err: any) {
      const message =
        err?.message ||
        err?.payload ||
        "Failed to reset password. Please try again.";
      setResetError(message);
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 w-full md:w-3/4 lg:w-1/2 mx-auto">
        <h2 className="font-heading text-xl font-bold text-center mb-6">
         Change Password
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold">Request Reset Code</h3>
            <p className="text-xs text-muted-foreground mt-1">
              We'll send a one-time code to your email.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3 mt-4">
              {forgotError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {forgotError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium" htmlFor="forgot-email">
                  Email Address
                </label>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="admin@estate.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 h-10"
                  disabled={codeSent}
                  readOnly
                />
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                disabled={forgotLoading || codeSent}
              >
                {forgotLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          </div>

          {codeSent && (
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold">Reset Password</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the code from your email and choose a new password.
              </p>
              <form onSubmit={handleResetSubmit} className="space-y-3 mt-4">
                {resetError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium" htmlFor="reset-code">
                    Reset Code
                  </label>
                  <Input
                    id="reset-code"
                    name="resetToken"
                    type="text"
                    placeholder="Enter the 6-digit code"
                    value={formData.resetToken}
                    onChange={handleChange}
                    className="mt-2 h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <Input
                      id="new-password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    className="text-sm font-medium"
                    htmlFor="confirm-password"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative mt-2">
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                  disabled={resetLoading}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}