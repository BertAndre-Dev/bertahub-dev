import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { LatLng, Place, PlaceCategory } from "@/types/maps";

export type MapsFilters = {
  openNow: boolean;
  minRating: number | null;
  category: PlaceCategory;
};

export interface MapsState {
  selectedPlace: Place | null;
  userLocation: LatLng | null;
  searchQuery: string;
  activeFilters: MapsFilters;
  mapCenter: LatLng | null;
  locationError: string | null;
}

const initialState: MapsState = {
  selectedPlace: null,
  userLocation: null,
  searchQuery: "",
  activeFilters: { openNow: false, minRating: null, category: "all" },
  mapCenter: null,
  locationError: null,
};

const mapsSlice = createSlice({
  name: "maps",
  initialState,
  reducers: {
    setSelectedPlace: (state, action: PayloadAction<Place | null>) => {
      state.selectedPlace = action.payload;
    },
    setUserLocation: (state, action: PayloadAction<LatLng | null>) => {
      state.userLocation = action.payload;
      if (action.payload) {
        state.mapCenter = action.payload;
        state.locationError = null;
      }
    },
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.locationError = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setActiveFilters: (state, action: PayloadAction<Partial<MapsFilters>>) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    setMapCenter: (state, action: PayloadAction<LatLng | null>) => {
      state.mapCenter = action.payload;
    },
    resetMapsUi: () => initialState,
  },
});

export const {
  setSelectedPlace,
  setUserLocation,
  setLocationError,
  setSearchQuery,
  setActiveFilters,
  setMapCenter,
  resetMapsUi,
} = mapsSlice.actions;

export default mapsSlice.reducer;

