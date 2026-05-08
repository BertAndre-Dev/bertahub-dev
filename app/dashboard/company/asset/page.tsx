"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import Tab from "@/components/tabs/page";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import AssetCategoriesTab from "./components/AssetCategoriesTab";
import AssetsTab from "./components/AssetsTab";
import AssetStatsCards from "./components/AssetStatsCards";

export default function CompanyAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const companyFromId =
          (data?.companyId as { name?: string } | undefined)?.name ?? "";
        const companyFromObj =
          (data?.company as { name?: string } | undefined)?.name ?? "";
        const fallback = (data?.companyName as string) ?? "";
        setCompanyName(companyFromId || companyFromObj || fallback || "Company");
      } catch {
        // keep default
      }
    })();
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="font-heading text-3xl font-bold">Assets</h1>
        <p className="text-muted-foreground mt-1">
          Manage assets for{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {companyName}
          </span>
          {"."}
        </p>
      </div>

      <AssetStatsCards />

      <Card className="p-4">
        <Tab
          titles={["Assets", "Asset Categories"]}
          renderContent={(activeTab) => {
            switch (activeTab) {
              case "Assets":
                return <AssetsTab />;
              case "Asset Categories":
                return <AssetCategoriesTab />;
              default:
                return null;
            }
          }}
        />
      </Card>
    </div>
  );
}

