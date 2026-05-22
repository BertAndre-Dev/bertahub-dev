"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Package, Tags } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  getAssetCategories,
  getAssets,
} from "@/redux/slice/admin/asset-mgt/admin-asset";

const STAT_LIMIT = 1;

function getTotal(pagination: unknown, fallbackLength: number) {
  const p = pagination as Record<string, unknown> | null | undefined;
  const raw =
    p?.total ?? (p?.pagination as Record<string, unknown> | undefined)?.total ?? p?.count;
  const total = raw != null ? Number(raw) : Number.NaN;
  return Number.isFinite(total) ? total : fallbackLength;
}

type Props = {
  estateId: string;
};

export default function AssetStatsCards({ estateId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();

  const { assetsLen, categoriesLen, assetsPagination, categoriesPagination } =
    useSelector((state: RootState) => {
      const s = state.adminAsset;
      return {
        assetsLen: s?.assets?.length ?? 0,
        categoriesLen: s?.categories?.length ?? 0,
        assetsPagination: s?.assetsPagination ?? null,
        categoriesPagination: s?.categoriesPagination ?? null,
      };
    });

  useEffect(() => {
    if (!estateId) return;
    dispatch(getAssets({ estateId, page: 1, limit: STAT_LIMIT, search: "" })).catch(
      () => {},
    );
    dispatch(
      getAssetCategories({ estateId, page: 1, limit: STAT_LIMIT, search: "" }),
    ).catch(() => {});
  }, [dispatch, estateId]);

  const stats = useMemo(() => {
    const totalAssets = getTotal(assetsPagination, assetsLen);
    const totalCategories = getTotal(categoriesPagination, categoriesLen);
    return [
      {
        key: "total-assets",
        label: "Total Assets",
        value: String(totalAssets),
        icon: Package,
      },
      {
        key: "total-categories",
        label: "Asset Categories",
        value: String(totalCategories),
        icon: Tags,
      },
    ];
  }, [assetsLen, assetsPagination, categoriesLen, categoriesPagination]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.key} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-heading text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#D0DFF280]">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
