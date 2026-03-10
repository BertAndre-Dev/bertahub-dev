"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Tab from "@/components/tabs/page";
import { Card } from "@/components/ui/card";
import AddressField from "@/components/admin/address/field/page";
import FieldEntry from "@/components/admin/address/entry/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch } from "@/redux/store";

const AddressPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);

        // Support different API shapes for estate name
        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";

        const name = estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);
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
          Welcome back! Here's is an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          .
        </p>
      </div>
      <Card className="p-4">
        <Tab
          titles={["Entries Fields", "Address Fields"]}
          renderContent={(activeTab) => {
            switch (activeTab) {
              case "Entries Fields":
                return <FieldEntry />;
              case "Address Fields":
                return <AddressField />;
              default:
                return null;
            }
          }}
        />
      </Card>
    </div>
  );
};

export default AddressPage;
