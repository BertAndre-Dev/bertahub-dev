"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Search, ExternalLink, Store, Tag } from "lucide-react";
import {
  getResidentMarketplaceList,
  type ResidentMarketplaceItem,
} from "@/redux/slice/resident/marketplace/marketplace";
import type { RootState, AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import Pagination from "@/components/pagination/page";

const PAGE_SIZE = 10;

const CATEGORIES = [
  "All",
  "Fashion",
  "Automobile",
  "Furniture",
  "Carpentry",
  "Insurance",
  "Food & Drinks",
  "Services",
];

export default function ResidentMarketplacePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [bootstrapping, setBootstrapping] = useState(true);

  const { list, pagination, getListStatus } = useSelector((state: RootState) => {
    const s = (state as RootState).residentMarketplace;
    return {
      list: s?.list ?? null,
      pagination: s?.pagination ?? null,
      getListStatus: s?.getListStatus ?? "idle",
    };
  });

  const listings = list ?? [];

  const filteredListings = useMemo(() => {
    const isActive = (item: ResidentMarketplaceItem) => {
      if (item.isSuspended === true) return false;
      const s = (item.status ?? "").toLowerCase();
      return s !== "suspended";
    };
    let result = listings.filter(isActive);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const company = (item.companyName ?? "").toLowerCase();
        const product = (item.productName ?? "").toLowerCase();
        const category = (item.productCategory ?? "").toLowerCase();
        const desc = (item.productDescription ?? "").toLowerCase();
        return (
          company.includes(q) ||
          product.includes(q) ||
          category.includes(q) ||
          desc.includes(q)
        );
      });
    }
    return result;
  }, [listings, search]);

  useEffect(() => {
    dispatch(
      getResidentMarketplaceList({
        page,
        limit: PAGE_SIZE,
        status: "ACTIVE",
        category: categoryFilter !== "All" ? categoryFilter : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      })
      .finally(() => setBootstrapping(false));
  }, [dispatch, page, categoryFilter]);

  const pageLoading = bootstrapping || isPending(getListStatus);

  const paginationInfo = {
    total: pagination?.total ?? filteredListings.length,
    current: pagination?.page ?? page,
    pageSize: pagination?.limit ?? PAGE_SIZE,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading marketplace..." />}

      <div
        className={[
          "space-y-6 sm:space-y-8 pb-8",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0150AC] to-[#0A387E] text-white p-6 sm:p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/20">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">
                Marketplace
              </h1>
            </div>
            <p className="text-white/90 text-sm sm:text-base max-w-xl">
              Discover businesses and services recommended for your estate. Browse
              by category or search for what you need.
            </p>
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"
            aria-hidden
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search companies, products, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-border rounded-lg bg-background"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${
                    categoryFilter === cat
                      ? "bg-[#0150AC] text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {cat === "All" ? <Tag className="w-4 h-4" /> : null}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredListings.length === 0 && isSettled(getListStatus) ? (
          <Card className="p-12 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search.trim() || categoryFilter !== "All"
                ? "No businesses match your filters."
                : "No businesses in the marketplace yet. Check back later."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item: ResidentMarketplaceItem) => (
              <Card
                key={item.id}
                className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[16/10] bg-muted/50 relative">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Store className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
                    {item.productCategory ?? "—"}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.companyName ?? "—"}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {item.productName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">
                    {item.productDescription ?? "—"}
                  </p>
                  {item.link ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-[#0150AC] hover:text-[#01408A] mt-4 w-full rounded-lg border-[#0150AC] hover:bg-[#0150AC]/10"
                    >
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2"
                      >
                        Visit
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  ) : (
                    <div className="mt-4 h-9" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          disabled={pageLoading}
          itemLabel="businesses"
        />
      </div>
    </div>
  );
}
