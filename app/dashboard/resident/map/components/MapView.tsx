"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";

import type { LatLng, Place } from "@/types/maps";

type Props = {
  center: LatLng | null;
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (p: Place | null) => void;
  onMapIdle: (c: LatLng) => void;
};

const containerStyle = { width: "100%", height: "100%" };

function DirectionsLink({ place }: Readonly<{ place: Place }>) {
  return (
    <a
      className="inline-block mt-3 text-xs font-semibold text-primary hover:underline"
      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${place.lat},${place.lng}`,
      )}&destination_place_id=${encodeURIComponent(place.placeId)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Get directions
    </a>
  );
}

function PlaceInfoContent({ place }: Readonly<{ place: Place }>) {
  return (
    <div className="min-w-[180px]">
      <p className="font-semibold">{place.name}</p>
      {place.address ? (
        <p className="text-xs text-muted-foreground mt-1">{place.address}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span>
          Rating:{" "}
          {typeof place.rating === "number" ? place.rating.toFixed(1) : "—"}
        </span>
        {typeof place.openNow === "boolean" ? (
          <span className={place.openNow ? "text-green-600" : "text-amber-600"}>
            {place.openNow ? "Open" : "Closed"}
          </span>
        ) : null}
      </div>
      <DirectionsLink place={place} />
    </div>
  );
}

function MapStatus({
  message,
  variant = "muted",
}: Readonly<{ message: string; variant?: "muted" | "error" }>) {
  return (
    <div
      className={`h-full w-full flex items-center justify-center text-sm ${
        variant === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {message}
    </div>
  );
}

function MapViewInner({
  center,
  places,
  selectedPlace,
  onSelectPlace,
  onMapIdle,
}: Readonly<Props>) {
  const key = (process.env.NEXT_PUBLIC_MAPS_JAVASCRIPT_API ?? "").trim();
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: key,
    libraries: ["places"],
  });

  const mapCenter = useMemo(() => {
    if (!center) return { lat: 6.5244, lng: 3.3792 };
    return { lat: center.lat, lng: center.lng };
  }, [center]);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleIdle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    if (!c) return;
    onMapIdle({ lat: c.lat(), lng: c.lng() });
  }, [onMapIdle]);

  if (!key) return <MapStatus message="Missing `NEXT_PUBLIC_MAPS_JAVASCRIPT_API` key." />;
  if (loadError) return <MapStatus message="Failed to load Google Maps." variant="error" />;
  if (!isLoaded) return <MapStatus message="Loading map..." />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={14}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        clickableIcons: false,
      }}
      onLoad={handleLoad}
      onIdle={handleIdle}
    >
      {places.map((p) => (
        <MarkerF
          key={p.placeId}
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => onSelectPlace(p)}
        />
      ))}

      {selectedPlace ? (
        <InfoWindowF
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          onCloseClick={() => onSelectPlace(null)}
        >
          <PlaceInfoContent place={selectedPlace} />
        </InfoWindowF>
      ) : null}
    </GoogleMap>
  );
}

export default memo(MapViewInner);

