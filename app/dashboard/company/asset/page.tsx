"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import Tab from "@/components/tabs/page";
import Loader from "@/components/ui/Loader";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "./lib/estate";
import AssetCategoriesTab from "./components/AssetCategoriesTab";
import AssetsTab from "./components/AssetsTab";
import AssetStatsCards from "./components/AssetStatsCards";

export default function CompanyAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstateId, setSelectedEstateId] = useState("");
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [activeAssetTab, setActiveAssetTab] = useState("Assets");

  const { assetsLoading, categoriesLoading } = useSelector(
    (state: RootState) => {
      const s = (state as unknown as { companyAsset?: Record<string, unknown> })
        .companyAsset;
      return {
        assetsLoading: s?.getAssetsStatus === "isLoading",
        categoriesLoading: s?.getCategoriesStatus === "isLoading",
      };
    },
  );

  const pageLoading =
    estatesLoading ||
    (activeAssetTab === "Assets"
      ? Boolean(assetsLoading || categoriesLoading)
      : Boolean(categoriesLoading));

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch {
          toast.error("Failed to fetch company estates.");
        }

        if (!options.length) {
          options = parseCompanyEstates(data);
        }

        setEstates(options);
        setSelectedEstateId(options[0]?.id ?? "");
        if (!options.length) {
          toast.warning("No estates found for your company.");
        }
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader
            label={
              estatesLoading
                ? "Loading estates..."
                : activeAssetTab === "Assets"
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
              {companyName}
            </span>
            .
          </p>
        </div>

        <AssetStatsCards estateId={selectedEstateId} />

        <Card className="p-4">
          <Tab
            titles={["Assets", "Asset Categories"]}
            onTabChange={(_index, title) => setActiveAssetTab(title)}
            renderContent={(activeTab) => {
              switch (activeTab) {
                case "Assets":
                  return (
                    <AssetsTab
                      estates={estates}
                      selectedEstateId={selectedEstateId}
                      onEstateChange={setSelectedEstateId}
                    />
                  );
                case "Asset Categories":
                  return <AssetCategoriesTab estateId={selectedEstateId} />;
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
