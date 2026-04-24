import { NextResponse } from "next/server";

import { getServerPlacesKey, normalizeSearchResponse } from "@/lib/maps";
import type { ApiResponse, PlacesSearchResponse } from "@/types/maps";

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const apiKey = getServerPlacesKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Google Places API key is not configured on the server.",
      } satisfies ApiResponse<PlacesSearchResponse>,
      { status: 500 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const lat = num(searchParams.get("lat"));
    const lng = num(searchParams.get("lng"));

    if (!q) {
      return NextResponse.json(
        { success: false, message: "q is required." } satisfies ApiResponse<PlacesSearchResponse>,
        { status: 400 },
      );
    }

    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    googleUrl.searchParams.set("query", q);
    // Bias results around the user/map center when provided
    if (lat != null && lng != null) {
      googleUrl.searchParams.set("location", `${lat},${lng}`);
      googleUrl.searchParams.set("radius", "5000");
    }
    googleUrl.searchParams.set("key", apiKey);

    const res = await fetch(googleUrl.toString(), { method: "GET" });
    const raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to search places.",
        } satisfies ApiResponse<PlacesSearchResponse>,
        { status: 502 },
      );
    }

    const normalized = normalizeSearchResponse(raw as any, apiKey);
    return NextResponse.json({ success: true, data: normalized } satisfies ApiResponse<PlacesSearchResponse>);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: (e as { message?: string })?.message ?? "Search failed.",
      } satisfies ApiResponse<PlacesSearchResponse>,
      { status: 500 },
    );
  }
}

