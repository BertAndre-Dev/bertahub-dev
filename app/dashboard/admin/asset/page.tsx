"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CiSearch } from "react-icons/ci";
import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createAssetCategory,
  getAssetCategories,
  getAssets,
} from "@/redux/slice/admin/asset-mgt/admin-asset";
import { parseAdminEstate } from "./lib/estate";
import AssetCategoryFormModal from "./components/AssetCategoryFormModal";
import AssetCategoryCard from "./components/AssetCategoryCard";

const CATEGORY_LIMIT = 200;
const ASSETS_LIMIT = 500;
const TOP_TABS_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 350;
const ALL_TAB = "__all__";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function AdminAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    categories,
    categoriesPagination,
    categoriesLoading,
    assetsLoading,
    totalAssets,
    assets,
  } = useSelector((state: RootState) => {
    const s = state.adminAsset;
    return {
      categories: s?.categories ?? [],
      categoriesPagination: s?.categoriesPagination ?? null,
      categoriesLoading: s?.getCategoriesStatus === "isLoading",
      assetsLoading: s?.getAssetsStatus === "isLoading",
      totalAssets:
        Number(s?.assetsPagination?.total ?? s?.assets?.length ?? 0) || 0,
      assets: s?.assets ?? [],
    };
  });

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const estate = parseAdminEstate(data);
        if (!estate) {
          toast.warning("No estate linked to your account.");
          return;
        }
        setEstateId(estate.id);
        setEstateName(estate.name);
      } catch {
        toast.error("Failed to load estate information.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getAssetCategories({
        estateId,
        page: 1,
        limit: CATEGORY_LIMIT,
        search: debouncedSearch.trim() || undefined,
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to load asset categories."));
  }, [dispatch, estateId, debouncedSearch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getAssets({ estateId, page: 1, limit: ASSETS_LIMIT }),
    ).catch(() => {});
  }, [dispatch, estateId]);

  const assetsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets) {
      const catId =
        typeof a.assetCategoryId === "string"
          ? a.assetCategoryId
          : getId(a.assetCategoryId);
      if (!catId) continue;
      map.set(catId, (map.get(catId) ?? 0) + 1);
    }
    return map;
  }, [assets]);

  const visibleCategories = useMemo(() => {
    if (activeTab === ALL_TAB) return categories;
    return categories.filter((c) => getId(c) === activeTab);
  }, [categories, activeTab]);

  const topTabs = useMemo(
    () => categories.slice(0, TOP_TABS_LIMIT),
    [categories],
  );

  const totalCategories = Number(
    categoriesPagination?.total ?? categories.length ?? 0,
  );

  const activeCategoryName = useMemo(() => {
    if (activeTab === ALL_TAB) return null;
    const match = categories.find((c) => getId(c) === activeTab);
    return match?.name ?? null;
  }, [activeTab, categories]);

  const statValue =
    activeTab === ALL_TAB
      ? totalAssets
      : (assetsByCategory.get(activeTab) ?? 0);

  const statLabel =
    activeTab === ALL_TAB
      ? "Total Assets"
      : `Total Assets in ${activeCategoryName ?? "Category"}`;

  const handleCreateCategory = async (payload: { name: string }) => {
    if (!estateId) {
      toast.warning("No estate linked to your account.");
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        createAssetCategory({ name: payload.name, estateId }),
      ).unwrap();
      toast.success("Asset category created.");
      setModalOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Failed to create category.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  
  const pageLoading = categoriesLoading || assetsLoading;

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading asset categories..." />
        </div>
      )}

      <div
        className={`space-y-6${pageLoading ? " blur-sm opacity-60 pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Asset Category</h1>
            <p className="text-muted-foreground mt-1">
              Organize and categorize your facility assets for{" "}
              <span className="text-[16px] font-bold underline uppercase text-black">
                {estateName}
              </span>
              .
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="shrink-0 text-white"
            style={{ backgroundColor: "#0150AC" }}
          >
            + Create Asset Category
          </Button>
        </div>

        <Card className="p-4 mt-0">
          <div className="relative">
            <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by asset category name"
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-6 mt-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{statLabel}</p>
              <p className="font-heading text-3xl font-bold mt-1">
                {statValue}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCategories}{" "}
                {totalCategories === 1 ? "category" : "categories"}
              </p>
            </div>
            <div className="p-3 rounded-full bg-[#D0DFF280]">
              <Briefcase className="w-5 h-5 text-[#0150AC]" />
            </div>
          </div>
        </Card>

        <div className="border-b border-border">
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
            <button
              type="button"
              className={`py-2 px-3 text-sm whitespace-nowrap cursor-pointer ${
                activeTab === ALL_TAB
                  ? "text-primary border-b-2 border-primary font-semibold"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab(ALL_TAB)}
            >
              All Asset categories ({totalCategories})
            </button>
            {topTabs.map((c) => {
              const id = getId(c);
              const count = assetsByCategory.get(id) ?? 0;
              return (
                <button
                  type="button"
                  key={id}
                  className={`py-2 px-3 text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === id
                      ? "text-primary border-b-2 border-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab(id)}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {visibleCategories.length === 0 ? (
          <Card className="p-10 mt-0 text-center">
            <p className="text-muted-foreground">
              {debouncedSearch.trim()
                ? "No categories match your search."
                : "No asset categories yet. Create one to get started."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleCategories.map((c) => (
              <AssetCategoryCard
                key={getId(c)}
                category={c}
                count={assetsByCategory.get(getId(c)) ?? 0}
              />
            ))}
          </div>
        )}

        <AssetCategoryFormModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          loading={saving}
          onSubmit={handleCreateCategory}
        />
      </div>
    </div>
  );
}
