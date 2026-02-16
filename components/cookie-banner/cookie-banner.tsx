"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";
import { Cookie } from "lucide-react";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const status = getCookieConsent();
    setShow(status === null);

    const handler = () => setShow(false);
    window.addEventListener("cookie-consent-change", handler);
    return () => window.removeEventListener("cookie-consent-change", handler);
  }, [mounted]);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setShow(false);
  };

  const handleDecline = () => {
    setCookieConsent("declined");
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <aside
      role="region"
      aria-live="polite"
      aria-label="Cookie consent banner"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999]",
        "animate-in slide-in-from-bottom-full duration-300",
        "safe-area-pb"
      )}
    >
      <div
        className={cn(
          "mx-4 mb-4 rounded-xl border border-border bg-card shadow-lg",
          "sm:mx-6 lg:mx-8",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-card/95"
        )}
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Cookie className="size-5 shrink-0" aria-hidden />
              <span className="text-sm font-semibold text-foreground">
                We use cookies
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              We use cookies to give you a better and more inclusive customer
              experience. We only use your information in accordance with NDPA
              and other applicable regulations, as explained in our{" "}
              <Link
                href="/cookie-policy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cookie Notice & Policy
              </Link>
              . By clicking &quot;Accept all&quot;, you consent to our use of
              cookies.{" "}
              <Link
                href="/privacy-notice"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Notice
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="order-2 sm:order-1"
            >
              Reject all
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
              className="order-1 sm:order-2"
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
