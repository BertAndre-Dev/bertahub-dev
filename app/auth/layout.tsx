"use client";

import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Branding (Figma: solid dark blue #0A387E) */}
      <div
        className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12 text-white"
        style={{ backgroundColor: "#0150AC" }}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Berta Hub"
            width={140}
            height={48}
            className="h-10 w-auto brightness-0 invert"
          />
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-balance">
              Manage Your Estate With Confidence
            </h1>
            <p className="text-lg opacity-90">
              Join thousands of estate managers and residents using Berta hub to
              streamline operations and improve community living.
            </p>
          </div>

          <ul className="space-y-4 list-none">
            {[
              "Real-time bill tracking and payments",
              "Centralized resident management",
              "Secure transaction handling",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm opacity-75">
          2025 Berta Hub. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Form (white background) */}
      <div className="w-full lg:w-[60%] flex flex-col lg:items-center lg:justify-center p-6 bg-white">
        <Link href="/" className="mb-6 lg:hidden flex justify-center">
          <Image
            src="/logo.svg"
            alt="Berta Hub"
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
