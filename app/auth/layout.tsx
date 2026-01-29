"use client";

import type React from "react";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary cursor-pointer" />
          </div>
          <span className="font-heading font-bold text-2xl">EstateHub</span>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-4 text-balance">
              Manage Your Estate with Confidence
            </h1>
            <p className="text-lg opacity-90">
              Join thousands of estate managers and residents using EstateHub to
              streamline operations and improve community living.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Real-time bill tracking and payments",
              "Centralized resident management",
              "Secure transaction handling",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-75">
          © 2025 EstateHub. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
