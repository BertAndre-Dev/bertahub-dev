"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Analytics calls useSearchParams(), which makes Next bail the
 * surrounding render out to the client. Mount it only after hydration so
 * public HTML stays server-rendered.
 */
export function DeferredVercelAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;
  return <Analytics />;
}
