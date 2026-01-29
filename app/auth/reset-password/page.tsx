"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch } from "@/redux/store";

interface FormState {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState<FormState>({
    email: "",
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Prefill email from query param if present
  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setFormData((prev) => ({ ...prev, email: emailFromQuery }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { email, resetToken, newPassword, confirmPassword } = formData;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await dispatch(
        resetPassword({ email, resetToken, newPassword }),
      ).unwrap();

      toast.success(res?.message || "Password reset successfully");
      // After successful reset, send user back to login
      router.push("/auth/login");
    } catch (err: any) {
      const message =
        err?.message ||
        err?.payload ||
        "Failed to reset password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Create New Password</h1>
        <p className="text-muted-foreground">
          Enter the code sent to your email and choose a new password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="reset-email">
            Email Address
          </label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            placeholder="admin@estate.com"
            value={formData.email}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
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
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="new-password">
            New Password
          </label>
          <div className="relative">
            <Input
              id="new-password"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={handleChange}
              className="h-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 cursor-pointer" />
              ) : (
                <Eye className="h-4 w-4 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="h-11 pr-12"
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
                <EyeOff className="h-4 w-4 cursor-pointer" />
              ) : (
                <Eye className="h-4 w-4 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 group cursor-pointer"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
          {!loading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </form>

      <Link href="/auth/login">
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-transparent cursor-pointer"
        >
          Back to Sign In
        </Button>
      </Link>
    </div>
  );
}
