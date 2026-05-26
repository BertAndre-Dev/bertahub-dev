"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "../asset/lib/estate";
import EstateTabs from "../asset-mgt/components/EstateTabs";
import CompanyOperationsReportsTable from "./components/CompanyOperationsReportsTable";

export default function CompanyOperationsReportingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstateId, setSelectedEstateId] = useState("");
  const [estatesLoading, setEstatesLoading] = useState(true);

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
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        setSelectedEstateId(options[0]?.id ?? "");
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const selectedEstateName =
    estates.find((e) => e.id === selectedEstateId)?.name ?? "";

  return (
    <div className="relative space-y-6">
      {estatesLoading && (
        <div className="absolute inset-0 z-50 flex min-h-[200px] items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading..." />
        </div>
      )}

      <div
        className={
          estatesLoading ? "pointer-events-none select-none blur-sm opacity-60" : ""
        }
      >
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold">Operations Reporting</h1>
          <p className="mt-1 text-muted-foreground">
            Review operations reports submitted across estates under{" "}
            <span className="font-bold uppercase text-black">{companyName}</span>.
            {selectedEstateName ? (
              <>
                {" "}
                Currently viewing{" "}
                <span className="font-semibold text-black">{selectedEstateName}</span>
                .
              </>
            ) : null}
          </p>
        </div>

        <EstateTabs
          estates={estates}
          selectedEstateId={selectedEstateId}
          onEstateChange={setSelectedEstateId}
        />

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground py-4">
            No estates linked to your company yet.
          </p>
        ) : selectedEstateId ? (
          <CompanyOperationsReportsTable
            key={selectedEstateId}
            estateId={selectedEstateId}
          />
        ) : null}
      </div>
    </div>
  );
}
