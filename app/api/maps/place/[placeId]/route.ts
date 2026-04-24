import { NextResponse } from "next/server";

import { getServerPlacesKey, normalizePlaceDetailsResponse } from "@/lib/maps";
import type { ApiResponse, PlaceDetails } from "@/types/maps";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const apiKey = getServerPlacesKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Google Places API key is not configured on the server.",
      } satisfies ApiResponse<PlaceDetails>,
      { status: 500 },
    );
  }

  try {
    const { placeId } = await params;
    const id = (placeId ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "placeId is required." } satisfies ApiResponse<PlaceDetails>,
        { status: 400 },
      );
    }

    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    googleUrl.searchParams.set("place_id", id);
    googleUrl.searchParams.set(
      "fields",
      [
        "place_id",
        "name",
        "geometry",
        "formatted_address",
        "vicinity",
        "types",
        "rating",
        "user_ratings_total",
        "opening_hours",
        "formatted_phone_number",
        "international_phone_number",
        "website",
        "url",
        "photos",
      ].join(","),
    );
    googleUrl.searchParams.set("key", apiKey);

    const res = await fetch(googleUrl.toString(), { method: "GET" });
    const raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch place details.",
        } satisfies ApiResponse<PlaceDetails>,
        { status: 502 },
      );
    }

    const normalized = normalizePlaceDetailsResponse(raw as any, apiKey);
    return NextResponse.json({ success: true, data: normalized } satisfies ApiResponse<PlaceDetails>);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: (e as { message?: string })?.message ?? "Place details failed.",
      } satisfies ApiResponse<PlaceDetails>,
      { status: 500 },
    );
  }
}

