"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = {
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasMinLength: formData.password.length >= 8,
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name) newErrors.name = "Name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.email.includes("@")) newErrors.email = "Please enter a valid email"
    if (!formData.password) newErrors.password = "Password is required"
    if (!isPasswordStrong) newErrors.password = "Password does not meet requirements"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: "resident",
        }),
      )
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-600">Join Berta Hub and start managing your estate</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Full Name</label>
          <Input
            type="text"
            name="name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={handleChange}
            className={`h-11 border-gray-300 ${errors.name ? "border-destructive" : ""}`}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Email Address</label>
          <Input
            type="email"
            name="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
            className={`h-11 border-gray-300 ${errors.email ? "border-destructive" : ""}`}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className={`h-11 pr-10 border-gray-300 ${errors.password ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}

          {formData.password && (
            <div className="space-y-2 pt-2">
              <div className="space-y-1">
                {[
                  { label: "At least 8 characters", check: passwordStrength.hasMinLength },
                  { label: "Uppercase letter", check: passwordStrength.hasUpperCase },
                  { label: "Lowercase letter", check: passwordStrength.hasLowerCase },
                  { label: "Number", check: passwordStrength.hasNumber },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        req.check ? "bg-green-500/20" : "bg-gray-200"
                      }`}
                    >
                      {req.check && <Check className="w-3 h-3 text-green-600" />}
                    </div>
                    <span className={req.check ? "text-gray-900" : ""}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Confirm Password</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`h-11 pr-10 border-gray-300 ${errors.confirmPassword ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0150AC]" required />
          <span>
            I have read and accept the{" "}
            <Link href="/terms-and-conditions" className="text-[#0150AC] font-medium hover:underline">
              Terms and Conditions
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0150AC]" required />
          <span>
            I have read and accept the{" "}
            <Link href="/privacy-notice" className="text-[#0150AC] font-medium hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full text-white rounded-lg group"
          style={{ backgroundColor: "#0150AC" }}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
          {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>

        <p className="text-center text-sm text-gray-600">Already have an account?</p>

        <Link href="/auth/login">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-lg border-2 group"
            style={{ borderColor: "#0150AC", color: "#0150AC" }}
          >
            Sign in
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </form>
    </div>
  )
}
