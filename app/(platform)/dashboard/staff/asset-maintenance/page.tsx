"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseAdminEstate } from "../asset/lib/estate";
import AssetMaintenanceTab from "./components/AssetMaintenanceTab";

export default function StaffAssetMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [estateLoading, setEstateLoading] = useState(true);

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
        setEstateLoading(false);
      }
    })();
  }, [dispatch]);

  return (
    <div className="relative space-y-6">
      {estateLoading && <Loader fullScreen label="Loading..." />}

      <div
        className={
          estateLoading ? "pointer-events-none select-none" : ""
        }
      >
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Maintenance</h1>
          <p className="mt-1 text-muted-foreground">
            Manage maintenance schedules for{" "}
            <span className="font-bold uppercase text-black">{estateName}</span>.
          </p>
        </div>

        <AssetMaintenanceTab estateId={estateId} estateName={estateName} />
      </div>
    </div>
  );
}
