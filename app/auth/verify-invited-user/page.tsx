"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { jwtDecode } from "jwt-decode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { verifyInivitedUser } from "@/redux/slice/auth-mgt/auth-mgt"
import type { AppDispatch, RootState } from "@/redux/store"

interface FormState {
  email: string
  tempPassword: string
  newPassword: string
}

interface DecodedToken {
  email?: string
  userId?: string
  tempPassword?: string
  exp?: number
  iat?: number
}

export default function VerifyInvitedUserPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { signInStatus } = useSelector((state: RootState) => state.auth)
  const loading = signInStatus === "isLoading"

  const [formData, setFormData] = useState<FormState>({
    email: "",
    tempPassword: "",
    newPassword: "",
  });

  const [showTempPassword, setShowTempPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [error, setError] = useState("");

  const passwordChecks = (password: string) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  });

  // 🔹 Decode the token from URL and autofill email/tempPassword
  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token)
        if (decoded?.email) {
          setFormData((prev) => ({
            ...prev,
            email: decoded.email!,
          }))
        }
        if (decoded?.tempPassword) {
          setFormData((prev) => ({
            ...prev,
            tempPassword: decoded.tempPassword!,
          }))
        }
      } catch (err) {
        console.error("Invalid token:", err)
        toast.error("Invalid or expired invite link.")
      }
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const { email, tempPassword, newPassword } = formData

    if (!email || !tempPassword || !newPassword) {
      setError("Please fill in all fields.")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    try {
      const res = await dispatch(verifyInivitedUser(formData)).unwrap()
      toast.success(res.message || "Account verified successfully.")
      router.push("/") // redirect to login or dashboard
    } catch (err: any) {
      const message = err.res?.data?.message;
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-8 py-10">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold">Welcome</h1>
        <p className="text-muted-foreground">
          Verify your BertaHub account to complete setup
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            name="email"
            type="email"
            placeholder="admin@estate.com"
            value={formData.email}
            onChange={handleChange}
            className="h-11"
            readOnly
          />
        </div>

        {/* Temporary Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Temporary Password</label>
          <div className="relative">
            <Input
              name="tempPassword"
              type={showTempPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.tempPassword}
              onChange={handleChange}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowTempPassword(!showTempPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showTempPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <div className="relative">
            <Input
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={handleChange}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password checker */}
          <ul className="mt-2 text-sm space-y-1">
            {Object.entries(passwordChecks(formData.newPassword)).map(([key, valid]) => (
              <li
                key={key}
                className={`flex items-center gap-2 ${
                  valid ? "text-green-600" : "text-gray-500"
                }`}
              >
                <span className="font-bold">{valid ? "✔" : "✖"}</span>
                <span>
                  {key === "length" && "At least 8 characters"}
                  {key === "uppercase" && "Contains uppercase letter"}
                  {key === "lowercase" && "Contains lowercase letter"}
                  {key === "number" && "Contains a number"}
                  {key === "special" && "Contains a special character"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 group"
          disabled={loading}
        >
          {loading ? "Verifying Account..." : "Verify Account"}
          {!loading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </form>
    </div>
  )
}
