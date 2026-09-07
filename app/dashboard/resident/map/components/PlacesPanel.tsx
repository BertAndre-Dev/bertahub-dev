"use client";

import { useDispatch } from "react-redux";
import { Star, Navigation, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AppDispatch } from "@/redux/store";
import { setSelectedPlace } from "@/redux/slice/maps/maps-slice";
import type { Place } from "@/types/maps";
import Loader from "@/components/ui/Loader";

type Props = {
  places: Place[];
  loading: boolean;
  error: string | null;
  selectedPlaceId: string | null;
  onSelect: (p: Place) => void;
};

function PlaceSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-blue-200/30 bg-gradient-to-r from-blue-500/10 to-teal-500/10 animate-pulse">
      <div className="h-4 w-2/3 bg-blue-300/30 rounded" />
      <div className="mt-2 h-3 w-1/2 bg-teal-300/20 rounded" />
      <div className="mt-3 h-3 w-1/3 bg-blue-300/20 rounded" />
    </div>
  );
}

export default function PlacesPanel({
  places,
  loading,
  error,
  selectedPlaceId,
  onSelect,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  let content: "loading" | "error" | "empty" | "list" = "list";
  if (loading) content = "loading";
  else if (error) content = "error";
  else if (places.length === 0) content = "empty";

  return (
    <Card className="p-3 h-[400px] md:p-4 rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-teal-950 border border-blue-400/20 backdrop-blur overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_2px_rgba(45,212,191,0.6)]" />
            <p className="text-sm font-bold text-white tracking-wide">
              Nearby Places
            </p>
          </div>
          <p className="text-xs text-blue-300/70 mt-0.5 pl-4">
            Tap a place to see details
          </p>
        </div>
        {loading && (
          <span className="text-xs text-teal-400 animate-pulse font-medium">
            Searching...
          </span>
        )}
      </div>

      {(() => {
        if (content === "loading") {
          return (
            <div className="space-y-3">
              <div className="hidden md:block">
                <Loader label="Loading places..." />
              </div>
              <PlaceSkeleton />
              <PlaceSkeleton />
              <PlaceSkeleton />
            </div>
          );
        }
        if (content === "error") {
          return (
            <div className="py-10 text-center text-sm text-red-400 font-medium">
              {error}
            </div>
          );
        }
        if (content === "empty") {
          return (
            <div className="py-10 text-center">
              <MapPin className="w-8 h-8 text-blue-400/50 mx-auto mb-2" />
              <p className="text-sm text-blue-300/60">
                No results. Try a different search.
              </p>
            </div>
          );
        }
        return (
          <div className="max-h-[45vh] md:max-h-[62vh] overflow-auto space-y-2 pr-1">
            {places.map((p) => {
              const active = p.placeId === selectedPlaceId;
              const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${p.lat},${p.lng}`,
              )}&destination_place_id=${encodeURIComponent(p.placeId)}`;
              return (
                <div
                  key={p.placeId}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 ${
                    active
                      ? "border-teal-400/60 bg-gradient-to-r from-teal-500/20 to-blue-500/20 shadow-[0_0_12px_2px_rgba(45,212,191,0.15)]"
                      : "border-blue-400/15 bg-white/5 hover:bg-white/10 hover:border-blue-400/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setSelectedPlace(p));
                          onSelect(p);
                        }}
                        className="w-full text-left"
                        aria-label={`Select ${p.name}`}
                      >
                      <p className="font-semibold text-white truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-blue-300/70 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{p.address ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-medium">
                            {typeof p.rating === "number"
                              ? p.rating.toFixed(1)
                              : "—"}
                          </span>
                        </div>
                        {typeof p.userRatingsTotal === "number" ? (
                          <span className="text-blue-300/50">
                            ({p.userRatingsTotal})
                          </span>
                        ) : null}
                        {typeof p.openNow === "boolean" ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.openNow
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {p.openNow ? "● Open" : "● Closed"}
                          </span>
                        ) : null}
                      </div>
                      </button>
                    </div>
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md border border-teal-400/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 hover:border-teal-400/50 transition-colors"
                      aria-label="Get directions"
                      title="Get directions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </Card>
  );
}
