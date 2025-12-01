"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email) {
      setError("Please enter your email address")
      setLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email")
      setLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
    }, 1000)
  }

  if (submitted) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold">Check Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p>The link will expire in 24 hours. If you don't see the email:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Try requesting a new link</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button onClick={() => setSubmitted(false)} variant="outline" size="lg" className="w-full">
            Try Another Email
          </Button>
          <Link href="/auth/login">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            type="email"
            placeholder="admin@estate.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 group" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
          {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </form>

      <Link href="/auth/login">
        <Button variant="outline" size="lg" className="w-full bg-transparent">
          Back to Sign In
        </Button>
      </Link>
    </div>
  )
}
