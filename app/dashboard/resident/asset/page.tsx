"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import Tab from "@/components/tabs/page";
import Loader from "@/components/ui/Loader";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseResidentEstate } from "./lib/estate";
import AssetCategoriesTab from "./components/AssetCategoriesTab";
import AssetsTab from "./components/AssetsTab";
import AssetStatsCards from "./components/AssetStatsCards";

export default function ResidentAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [activeAssetTab, setActiveAssetTab] = useState("Assets");

  const { assetsLoading, categoriesLoading } = useSelector(
    (state: RootState) => {
      const s = state.residentAsset;
      return {
        assetsLoading: s?.getAssetsStatus === "isLoading",
        categoriesLoading: s?.getCategoriesStatus === "isLoading",
      };
    },
  );

  const pageLoading =
    activeAssetTab === "Assets"
      ? Boolean(assetsLoading || categoriesLoading)
      : Boolean(categoriesLoading);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const estate = parseResidentEstate(data);
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

  if (!estateId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">
            No estate is linked to your account. Contact your estate admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader
            label={
              activeAssetTab === "Assets"
                ? "Loading assets..."
                : "Loading categories..."
            }
          />
        </div>
      )}

      <div
        className={`space-y-6${pageLoading ? " blur-sm opacity-60 pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Manage assets for{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>

        <AssetStatsCards estateId={estateId} />

        <Card className="p-4">
          <Tab
            titles={["Assets", "Asset Categories"]}
            onTabChange={(_index, title) => setActiveAssetTab(title)}
            renderContent={(activeTab) => {
              switch (activeTab) {
                case "Assets":
                  return <AssetsTab estateId={estateId} estateName={estateName} />;
                case "Asset Categories":
                  return <AssetCategoriesTab estateId={estateId} />;
                default:
                  return null;
              }
            }}
          />
        </Card>
      </div>
    </div>
  );
}
