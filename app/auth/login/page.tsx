"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { signIn } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch, RootState } from "@/redux/store";

interface FormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { signInStatus } = useSelector((state: RootState) => state.auth);
  const loading = signInStatus === "isLoading";

  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    try {
      const res = await dispatch(signIn(formData)).unwrap();

      // ✅ Login success
      if (res?.accessToken && res?.data) {
        const user = res.data;
        const token = res.accessToken;

        // ✅ Keep user in localStorage so getStoredUserEmail() can read it
        // even before redux-persist has finished rehydrating on a hard reload.
        localStorage.setItem("user", JSON.stringify(user));

        toast.success(res.message || "Signed in successfully");

        // ✅ Redirect based on role
        const role = user.role?.toLowerCase();
        if (role === "super admin") {
          router.push("/dashboard/super-admin/dashboard");
        } else if (role === "admin") {
          router.push("/dashboard/admin/overview");
        } else if (role === "security") {
          router.push("/dashboard/security/dashboard");
        } else if (role === "estate admin") {
          router.push("/dashboard/estate-admin/dashboard");
        } else if (role === "resident") {
          router.push("/dashboard/resident/dashboard");
        } else {
          router.push("/dashboard/resident/bills");
        }
      } else {
        toast.error(res?.message || "Login failed. Please try again.");
        setError(res?.message || "Login failed. Please try again.");
      }
    } catch (err: any) {
      const message =
        (err && typeof err === "object" && err.message) ||
        (typeof err === "string" ? err : null) ||
        "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your Berta Hub Account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Email Address</label>
          <Input
            name="email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
            className="h-11 border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Password</label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="h-11 pr-10 border-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0150AC]" />
            Remember me
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-[#0150AC] hover:underline"
          >
            Forgot Password
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full group text-white rounded-lg"
          style={{ backgroundColor: "#0150AC" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?
        </p>

        <Link href="/auth/signup">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-lg border-2 group"
            style={{ borderColor: "#0150AC", color: "#0150AC" }}
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </form>

      <p className="text-right text-xs">
        <Link
          href="/privacy-notice"
          className="text-[#0150AC] hover:underline"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
