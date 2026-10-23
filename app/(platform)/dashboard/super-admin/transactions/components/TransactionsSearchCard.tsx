"use client";

import React, { useRef } from "react";
import { Search, X } from "lucide-react";

export type TransactionsSearchCardProps = {
  placeholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onCommitSearch: () => void;
  onClearSearch: () => void;
};

export function TransactionsSearchCard({
  placeholder,
  searchInput,
  onSearchInputChange,
  onCommitSearch,
  onClearSearch,
}: Readonly<TransactionsSearchCardProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClearSearch();
    inputRef.current?.focus();
  };

  const hasValue = searchInput.trim().length > 0;

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="relative w-full max-w-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none cursor-pointer" />
          <input
            ref={inputRef}
            placeholder={placeholder}
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hasValue) onCommitSearch();
              if (e.key === "Escape") handleClear();
            }}
            className="w-full pl-9 pr-8 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {hasValue && (
          <button
            type="button"
            onClick={onCommitSearch}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition"
          >
            Search
          </button>
        )}
      </div>
    </div>
  );
}