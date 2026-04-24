"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import type { AppDispatch, RootState } from "@/redux/store";
import {
  setLocationError,
  setMapCenter,
  setSelectedPlace,
  setUserLocation,
} from "@/redux/slice/maps/maps-slice";
import {
  useGetNearbyPlacesQuery,
  useLazyTextSearchQuery,
} from "@/redux/api/mapsApi";

import MapView from "./components/MapView";
import PlacesPanel from "./components/PlacesPanel";
import SearchBar from "./components/SearchBar";

export default function ResidentMapPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { userLocation, mapCenter, searchQuery, activeFilters, selectedPlace, locationError } =
    useSelector((s: RootState) => s.maps);

  // Get user location once
  useEffect(() => {
    if (userLocation) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      dispatch(setLocationError("Geolocation is not supported on this device."));
      dispatch(setUserLocation({ lat: 6.5244, lng: 3.3792 })); // Lagos fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        dispatch(setUserLocation(loc));
        dispatch(setMapCenter(loc));
      },
      () => {
        dispatch(setLocationError("Location permission denied. Showing default location."));
        dispatch(setUserLocation({ lat: 6.5244, lng: 3.3792 }));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [dispatch, userLocation]);

  useEffect(() => {
    if (locationError) toast.info(locationError);
  }, [locationError]);

  const center = mapCenter ?? userLocation;

  const nearbyArgs = useMemo(() => {
    if (!center) return null;
    return {
      lat: center.lat,
      lng: center.lng,
      radius: 5000,
      type: activeFilters.category === "all" ? undefined : activeFilters.category,
      openNow: activeFilters.openNow,
      minRating: activeFilters.minRating ?? undefined,
    };
  }, [center, activeFilters.category, activeFilters.openNow, activeFilters.minRating]);

  const shouldUseTextSearch = Boolean(searchQuery.trim());

  const nearby = useGetNearbyPlacesQuery(
    nearbyArgs ?? { lat: 0, lng: 0 },
    {
    skip: !nearbyArgs || shouldUseTextSearch,
    },
  );

  const [triggerTextSearch, textSearch] = useLazyTextSearchQuery();

  // Debounced text search (300ms)
  useEffect(() => {
    if (!shouldUseTextSearch) return;
    if (!center) return;
    const t = globalThis.setTimeout(() => {
      triggerTextSearch({ query: searchQuery.trim(), lat: center.lat, lng: center.lng });
    }, 300);
    return () => globalThis.clearTimeout(t);
  }, [triggerTextSearch, searchQuery, shouldUseTextSearch, center]);

  const data = shouldUseTextSearch ? textSearch.data : nearby.data;
  const isLoading = shouldUseTextSearch ? textSearch.isFetching : nearby.isFetching;
  const isError = shouldUseTextSearch ? textSearch.isError : nearby.isError;
  const error = shouldUseTextSearch ? textSearch.error : nearby.error;

  const places = data?.success ? data.data.places : [];

  return (
    <div className="relative h-[calc(100vh-120px)] md:h-[calc(100vh-140px)]">
      <div className="absolute inset-0">
        <MapView
          center={center}
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => dispatch(setSelectedPlace(p))}
          onMapIdle={(c) => dispatch(setMapCenter(c))}
        />
      </div>

      <div className="absolute top-4 left-4 right-4 z-20">
        <SearchBar />
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[420px] z-20">
        <PlacesPanel
          places={places}
          loading={isLoading}
          error={isError ? String((error as any)?.status ?? "Failed to load places") : null}
          selectedPlaceId={selectedPlace?.placeId ?? null}
          onSelect={(p) => dispatch(setSelectedPlace(p))}
        />
      </div>
    </div>
  );
}

