"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Tab from "@/components/tabs/page";
import Loader from "@/components/ui/Loader";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseAdminEstate } from "../asset/lib/estate";
import OperationsReportingTypesTab from "./components/OperationsReportingTypesTab";
import OperationsReportingReportsTab from "./components/OperationsReportingReportsTab";

export default function AdminOperationsReportingPage() {
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
      } catch {
        toast.error("Failed to load estate information.");
      } finally {
        setEstateLoading(false);
      }
    })();
  }, [dispatch]);

  return (
    <div className="relative space-y-6">
      {estateLoading && (
        <div className="absolute inset-0 z-50 flex min-h-[200px] items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading..." />
        </div>
      )}

      <div
        className={
          estateLoading ? "pointer-events-none select-none blur-sm opacity-60" : ""
        }
      >
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Operations Reporting</h1>
          <p className="mt-1 text-muted-foreground">
            Configure report types and review submitted operations reports for{" "}
            <span className="font-bold uppercase text-black">{estateName}</span>.
          </p>
        </div>

        {!estateId ? (
          <p className="text-sm text-muted-foreground py-4">
            Loading estate information…
          </p>
        ) : (
          <Tab
            titles={["Reports", "Configure Report Type"]}
            renderContent={(opsTab) => {
              switch (opsTab) {
                case "Reports":
                  return <OperationsReportingReportsTab estateId={estateId} />;
                case "Configure Report Type":
                  return <OperationsReportingTypesTab estateId={estateId} />;
                default:
                  return null;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
