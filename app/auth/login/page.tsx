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

        // ✅ Save user + token to localStorage
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        toast.success(res.message || "Signed in successfully");

        // ✅ Redirect based on role
        const role = user.role?.toLowerCase();
        if (role === "super admin") {
          router.push("/dashboard/super-admin/user");
        } else if (role === "admin") {
          router.push("/dashboard/admin/dashboard");
        } else if (role === "security") {
          router.push("/dashboard/security/view-visitor");
        } else if (role === "estate admin") {
          router.push("/dashboard/estate-admin/transactions");
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
        <h1 className="font-heading text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to your BertaHub account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            name="email"
            type="email"
            placeholder="admin@estate.com"
            value={formData.email}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="w-4 h-4 rounded border-border" />
            Remember me
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
        <Link
          href="/privacy-notice"
          className="hover:text-foreground hover:underline"
        >
          Privacy Notice
        </Link>
        {" · "}
        <Link
          href="/cookie-policy"
          className="hover:text-foreground hover:underline"
        >
          Cookie Policy
        </Link>
      </p>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 group"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
          {!loading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">
            Don't have an account?
          </span>
        </div>
      </div>

      <Link href="/auth/signup">
        <Button variant="outline" size="lg" className="w-full bg-transparent">
          Create Account
        </Button>
      </Link>

      
    </div>
  );
}
