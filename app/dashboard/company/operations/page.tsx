"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";
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
import CompanyOperationsReportsTable from "./components/CompanyOperationsReportsTable";

type EstateSelectOption = { label: string; value: string };

export default function CompanyOperationsReportingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
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
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  const selectedEstateId = selectedEstate?.value ?? "";

  return (
    <div className="relative">
      {estatesLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading estates..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          estatesLoading
            ? "pointer-events-none select-none blur-sm opacity-60"
            : "",
        ].join(" ")}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Operations Reporting
            </h1>
            <p className="text-muted-foreground mt-1">
              Review operations reports submitted across estates under{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-48 min-w-[12rem]">
              <Select
                options={estateOptions}
                placeholder="Filter by estate"
                value={selectedEstate}
                onChange={(option) =>
                  setSelectedEstate(option as EstateSelectOption | null)
                }
                isSearchable
                isDisabled={!estateOptions.length}
                styles={{
                  control: (base) => ({ ...base, cursor: "pointer" }),
                  option: (base) => ({ ...base, cursor: "pointer" }),
                  dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                  clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
                }}
              />
            </div>
          </div>
        </div>

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : selectedEstateId ? (
          <CompanyOperationsReportsTable
            key={selectedEstateId}
            estateId={selectedEstateId}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Select an estate to view operations reports.
          </p>
        )}
      </div>
    </div>
  );
}
