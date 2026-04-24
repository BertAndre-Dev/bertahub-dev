import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { ApiResponse, PlaceDetails, PlacesSearchResponse } from "@/types/maps";

type NearbyArgs = {
  lat: number;
  lng: number;
  keyword?: string;
  radius?: number;
  type?: string;
  openNow?: boolean;
  minRating?: number;
};

type TextSearchArgs = {
  query: string;
  lat?: number;
  lng?: number;
};

export const mapsApi = createApi({
  reducerPath: "mapsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/maps",
  }),
  tagTypes: ["Places", "PlaceDetails"],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getNearbyPlaces: builder.query<ApiResponse<PlacesSearchResponse>, NearbyArgs>({
      query: ({ lat, lng, keyword, radius = 5000, type, openNow, minRating }) => ({
        url: "nearby",
        params: {
          lat,
          lng,
          keyword,
          radius,
          type,
          openNow: typeof openNow === "boolean" ? String(openNow) : undefined,
          minRating: typeof minRating === "number" ? String(minRating) : undefined,
        },
      }),
      providesTags: (result) => {
        if (!result?.success)
          return [{ type: "Places" as const, id: "LIST" }];
        return [
          { type: "Places" as const, id: "LIST" },
          ...result.data.places.map((p) => ({ type: "Places" as const, id: p.placeId })),
        ];
      },
    }),

    textSearch: builder.query<ApiResponse<PlacesSearchResponse>, TextSearchArgs>({
      query: ({ query, lat, lng }) => ({
        url: "search",
        params: { q: query, lat, lng },
      }),
      providesTags: (result) => {
        if (!result?.success)
          return [{ type: "Places" as const, id: "LIST" }];
        return [
          { type: "Places" as const, id: "LIST" },
          ...result.data.places.map((p) => ({ type: "Places" as const, id: p.placeId })),
        ];
      },
    }),

    getPlaceDetails: builder.query<ApiResponse<PlaceDetails>, { placeId: string }>({
      query: ({ placeId }) => `place/${encodeURIComponent(placeId)}`,
      providesTags: (_res, _err, arg) => [{ type: "PlaceDetails", id: arg.placeId }],
    }),
  }),
});

export const {
  useGetNearbyPlacesQuery,
  useLazyGetNearbyPlacesQuery,
  useTextSearchQuery,
  useLazyTextSearchQuery,
  useGetPlaceDetailsQuery,
} = mapsApi;

