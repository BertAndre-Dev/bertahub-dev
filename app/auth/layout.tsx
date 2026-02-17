"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary to-primary/80 text-primary-foreground flex-col justify-between p-12">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="BertAndre"
            width={140}
            height={48}
            className="h-10 w-auto brightness-0 invert"
          />
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
      <div className="w-full lg:w-1/2 flex flex-col lg:items-center lg:justify-center p-6 bg-background">
        <Link href="/" className="mb-6 lg:hidden flex justify-center">
          <Image
            src="/logo.svg"
            alt="BertAndre"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex-1 lg:flex-none flex items-center w-full max-w-md">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
