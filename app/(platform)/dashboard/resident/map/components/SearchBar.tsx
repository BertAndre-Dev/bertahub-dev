"use client";

import { useDispatch, useSelector } from "react-redux";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { AppDispatch, RootState } from "@/redux/store";
import { setSearchQuery } from "@/redux/slice/maps/maps-slice";

export default function SearchBar() {
  const dispatch = useDispatch<AppDispatch>();
  const q = useSelector((s: RootState) => s.maps.searchQuery);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative bg-background/90 backdrop-blur border border-border shadow-sm rounded-2xl px-3 py-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search nearby (restaurants, hospitals, malls, estates)..."
          className="pl-10 h-11 border-0 shadow-none focus-visible:ring-0 bg-transparent"
          aria-label="Search places"
        />
      </div>
    </div>
  );
}

