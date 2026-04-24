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
    const lat = num(searchParams.get("lat"));
    const lng = num(searchParams.get("lng"));
    const radiusRaw = num(searchParams.get("radius"));
    const keyword = searchParams.get("keyword")?.trim() || undefined;
    const type = searchParams.get("type")?.trim() || undefined;
    const openNow = searchParams.get("openNow")?.trim();
    const minRatingRaw = num(searchParams.get("minRating"));

    if (lat == null || lng == null) {
      return NextResponse.json(
        { success: false, message: "lat and lng are required." } satisfies ApiResponse<PlacesSearchResponse>,
        { status: 400 },
      );
    }

    const radius = radiusRaw && radiusRaw > 0 ? Math.min(radiusRaw, 50000) : 5000;

    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    googleUrl.searchParams.set("location", `${lat},${lng}`);
    googleUrl.searchParams.set("radius", String(radius));
    if (keyword) googleUrl.searchParams.set("keyword", keyword);
    if (type && type !== "all") googleUrl.searchParams.set("type", type);
    if (openNow === "true") googleUrl.searchParams.set("opennow", "true");
    googleUrl.searchParams.set("key", apiKey);

    const res = await fetch(googleUrl.toString(), { method: "GET" });
    const raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch nearby places.",
        } satisfies ApiResponse<PlacesSearchResponse>,
        { status: 502 },
      );
    }

    let normalized = normalizeSearchResponse(raw as any, apiKey);
    if (typeof minRatingRaw === "number") {
      normalized = {
        ...normalized,
        places: normalized.places.filter((p) => (p.rating ?? 0) >= minRatingRaw),
      };
    }

    return NextResponse.json({ success: true, data: normalized } satisfies ApiResponse<PlacesSearchResponse>);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: (e as { message?: string })?.message ?? "Nearby search failed.",
      } satisfies ApiResponse<PlacesSearchResponse>,
      { status: 500 },
    );
  }
}

