"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Tab from "@/components/tabs/page";
import { Card } from "@/components/ui/card";
import EnergyProviderAddressField from "@/components/energy-provider/address/field/page";
import EnergyProviderFieldEntry from "@/components/energy-provider/address/entry/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { extractEstateNameFromUser } from "@/lib/user-id";
import type { AppDispatch } from "@/redux/store";

const EnergyProviderAddressPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        setEstateName(extractEstateNameFromUser(data) ?? "Estate");
      } catch {
        // keep default "Estate" if user cannot be loaded
      }
    })();
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Address Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage and update property addresses within{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          .
        </p>
      </div>
      <Card className="p-4">
        <Tab
          titles={["Address Fields", "Entries Fields"]}
          renderContent={(activeTab) => {
            switch (activeTab) {
              case "Address Fields":
                return <EnergyProviderAddressField />;
              case "Entries Fields":
                return <EnergyProviderFieldEntry />;
              default:
                return null;
            }
          }}
        />
      </Card>
    </div>
  );
};

export default EnergyProviderAddressPage;
