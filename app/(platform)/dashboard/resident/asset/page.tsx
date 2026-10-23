"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import Tab from "@/components/tabs/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseResidentEstate } from "./lib/estate";
import { getApiErrorMessage } from "@/lib/api-error";
import AssetCategoriesTab from "./components/AssetCategoriesTab";
import AssetsTab from "./components/AssetsTab";
import AssetStatsCards from "./components/AssetStatsCards";

export default function ResidentAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeAssetTab, setActiveAssetTab] = useState("Asset Categories");

  const { assetsStatus, categoriesStatus } = useSelector(
    (state: RootState) => {
      const s = state.residentAsset;
      return {
        assetsStatus: s?.getAssetsStatus as string | undefined,
        categoriesStatus: s?.getCategoriesStatus as string | undefined,
      };
    },
  );

  const pageLoading =
    bootstrapping ||
    (Boolean(estateId) &&
      (activeAssetTab === "Assets"
        ? isPending(assetsStatus) || isPending(categoriesStatus)
        : isPending(categoriesStatus)));

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
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  if (bootstrapping) {
    return (
      <div className="relative">
        <Loader fullScreen label="Loading assets..." />
      </div>
    );
  }

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
        <Loader
          fullScreen
          label={
            activeAssetTab === "Assets"
              ? "Loading assets..."
              : "Loading categories..."
          }
        />
      )}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
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
            titles={["Asset Categories", "Assets"]}
            onTabChange={(_index, title) => setActiveAssetTab(title)}
            renderContent={(activeTab) => {
              switch (activeTab) {
                case "Asset Categories":
                  return <AssetCategoriesTab estateId={estateId} />;
                case "Assets":
                  return <AssetsTab estateId={estateId} estateName={estateName} />;
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
