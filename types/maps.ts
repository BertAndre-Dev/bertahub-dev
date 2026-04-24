export type LatLng = { lat: number; lng: number };

export type PlaceCategory =
  | "restaurant"
  | "hospital"
  | "shopping_mall"
  | "estate"
  | "poi"
  | "all";

export interface Place {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  icon?: string;
  photoUrl?: string;
}

export interface PlacesSearchResponse {
  places: Place[];
  nextPageToken?: string;
}

export interface PlaceDetails extends Place {
  phoneNumber?: string;
  website?: string;
  url?: string;
  openingHours?: { weekdayText?: string[]; openNow?: boolean };
}

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; message: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

