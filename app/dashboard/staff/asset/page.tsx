"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Briefcase } from "lucide-react";
import Select from "react-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import { isPending } from "@/lib/async-status";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createAssetCategory,
  getAssetCategories,
  getAssets,
} from "@/redux/slice/staff/asset-mgt/staff-asset";
import { parseAdminEstate } from "./lib/estate";
import AssetCategoryFormModal from "./components/AssetCategoryFormModal";
import AssetCategoryCard from "./components/AssetCategoryCard";

const CATEGORY_LIMIT = 200;
const ASSETS_LIMIT = 500;
const ALL_TAB = "__all__";

type CategoryFilterOption = { label: string; value: string };

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function StaffAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    categories,
    categoriesPagination,
    categoriesStatus,
    assetsStatus,
    totalAssets,
    assets,
  } = useSelector((state: RootState) => {
    const s = state.staffAsset;
    return {
      categories: s?.categories ?? [],
      categoriesPagination: s?.categoriesPagination ?? null,
      categoriesStatus: s?.getCategoriesStatus as string | undefined,
      assetsStatus: s?.getAssetsStatus as string | undefined,
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
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getAssetCategories({
        estateId,
        page: 1,
        limit: CATEGORY_LIMIT,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getAssets({ estateId, page: 1, limit: ASSETS_LIMIT })).catch(
      () => {},
    );
  }, [dispatch, estateId]);

  useEffect(() => {
    if (activeTab === ALL_TAB) return;
    const stillVisible = categories.some((c) => getId(c) === activeTab);
    if (!stillVisible) setActiveTab(ALL_TAB);
  }, [categories, activeTab]);

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

  const totalCategories = Number(
    categoriesPagination?.total ?? categories.length ?? 0,
  );

  const categoryFilterOptions = useMemo<CategoryFilterOption[]>(
    () => [
      {
        label: `All categories (${totalCategories})`,
        value: ALL_TAB,
      },
      ...categories.map((c) => {
        const id = getId(c);
        const count = assetsByCategory.get(id) ?? 0;
        return {
          label: `${c.name} (${count})`,
          value: id,
        };
      }),
    ],
    [categories, totalCategories, assetsByCategory],
  );

  const selectedCategoryFilter = useMemo(
    () =>
      categoryFilterOptions.find((o) => o.value === activeTab) ??
      categoryFilterOptions[0] ??
      null,
    [categoryFilterOptions, activeTab],
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
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const pageLoading =
    bootstrapping ||
    (Boolean(estateId) &&
      (isPending(categoriesStatus) || isPending(assetsStatus)));

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading asset categories..." />}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
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
          <div className="flex items-center gap-4">
            <Select<CategoryFilterOption>
              options={categoryFilterOptions}
              value={selectedCategoryFilter}
              onChange={(option) => setActiveTab(option?.value ?? ALL_TAB)}
              isSearchable
              placeholder="Filter by category"
              noOptionsMessage={() => "No categories found"}
              styles={{
                control: (base) => ({
                  ...base,
                  cursor: "pointer",
                  minHeight: 44,
                }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
              }}
            />
            <Button
              onClick={() => setModalOpen(true)}
              className="shrink-0 text-white"
              style={{ backgroundColor: "#0150AC" }}
            >
              + Create Asset Category
            </Button>
          </div>
        </div>

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

        {visibleCategories.length === 0 ? (
          <Card className="p-10 mt-0 text-center">
            <p className="text-muted-foreground">
              No asset categories yet. Create one to get started.
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
