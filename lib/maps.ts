import type { Place, PlaceDetails, PlacesSearchResponse } from "@/types/maps";

type GoogleLatLng = { lat: number; lng: number };

type GooglePhoto = { photo_reference?: string };

type GooglePlaceBase = {
  place_id: string;
  name?: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location?: GoogleLatLng };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  icon?: string;
  photos?: GooglePhoto[];
};

type GooglePlacesSearchResponse = {
  status?: string;
  error_message?: string;
  results?: GooglePlaceBase[];
  next_page_token?: string;
};

type GooglePlaceDetailsResponse = {
  status?: string;
  error_message?: string;
  result?: GooglePlaceBase & {
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    opening_hours?: { weekday_text?: string[]; open_now?: boolean };
  };
};

export function getServerPlacesKey(): string | null {
  // Prefer server-only key.
  const key =
    process.env.GOOGLE_MAPS_KEY ||
    // Back-compat with existing env naming in this project.
    process.env.NEXT_PUBLIC_PLACE_API ||
    process.env.NEXT_PUBLIC_MAPS_JAVASCRIPT_API ||
    "";
  return key.trim() ? key.trim() : null;
}

export function assertGoogleOk(status: string | undefined, error: string | undefined) {
  if (status === "OK" || status === "ZERO_RESULTS") return;
  const msg = error?.trim() || `Google Places API error: ${status || "UNKNOWN"}`;
  throw new Error(msg);
}

function firstPhotoRef(p: GooglePlaceBase): string | undefined {
  return p.photos?.[0]?.photo_reference;
}

export function googlePhotoUrl(photoRef: string, apiKey: string, maxWidth = 640) {
  const u = new URL("https://maps.googleapis.com/maps/api/place/photo");
  u.searchParams.set("photo_reference", photoRef);
  u.searchParams.set("maxwidth", String(maxWidth));
  u.searchParams.set("key", apiKey);
  return u.toString();
}

export function normalizePlace(p: GooglePlaceBase, apiKey?: string): Place {
  const loc = p.geometry?.location;
  const photoRef = firstPhotoRef(p);
  const photoUrl = apiKey && photoRef ? googlePhotoUrl(photoRef, apiKey) : undefined;

  return {
    placeId: p.place_id,
    name: p.name ?? "—",
    lat: typeof loc?.lat === "number" ? loc.lat : 0,
    lng: typeof loc?.lng === "number" ? loc.lng : 0,
    address: p.vicinity ?? p.formatted_address,
    types: p.types,
    rating: p.rating,
    userRatingsTotal: p.user_ratings_total,
    openNow: p.opening_hours?.open_now,
    icon: p.icon,
    photoUrl,
  };
}

export function normalizeSearchResponse(
  raw: GooglePlacesSearchResponse,
  apiKey?: string,
): PlacesSearchResponse {
  assertGoogleOk(raw.status, raw.error_message);
  const results = Array.isArray(raw.results) ? raw.results : [];
  return {
    places: results.map((p) => normalizePlace(p, apiKey)),
    nextPageToken: raw.next_page_token,
  };
}

export function normalizePlaceDetailsResponse(
  raw: GooglePlaceDetailsResponse,
  apiKey?: string,
): PlaceDetails {
  assertGoogleOk(raw.status, raw.error_message);
  const r = raw.result;
  if (!r) throw new Error("Place details not found.");

  const base = normalizePlace(r, apiKey);
  return {
    ...base,
    phoneNumber: r.formatted_phone_number ?? r.international_phone_number,
    website: r.website,
    url: r.url,
    openingHours: r.opening_hours
      ? { weekdayText: r.opening_hours.weekday_text, openNow: r.opening_hours.open_now }
      : undefined,
  };
}

