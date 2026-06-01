"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

import { Card } from "@/components/ui/card";
import OperationsReportingFillReportPanel from "@/app/dashboard/admin/operations-reporting/components/OperationsReportingFillReportPanel";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import type { AppDispatch } from "@/redux/store";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import Loader from "@/components/ui/Loader";

type EstateSelectOption = { label: string; value: string };

const estateSelectStyles = {
  control: (base: object) => ({ ...base, cursor: "pointer", minHeight: 40 }),
  option: (base: object) => ({ ...base, cursor: "pointer" }),
  dropdownIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
  clearIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
};

export default function CompanyOperationsReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";

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

  const estateOptions: EstateSelectOption[] = estates.map((e) => ({
    label: e.name,
    value: e.id,
  }));

  return (
    <div className="relative space-y-6">
      {estatesLoading ? (
        <div className="absolute inset-0 z-50 flex min-h-[200px] items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading operations reports..." />
        </div>
      ) : null}

      <div
        className={
          estatesLoading ? "pointer-events-none select-none blur-sm opacity-60" : ""
        }
      >
        <div>
          <h1 className="font-heading text-3xl font-bold">Operations Reporting</h1>
          <p className="mt-1 text-muted-foreground">
            Review operations reports submitted across estates under{" "}
            <span className="text-[18px] font-bold uppercase text-black underline">
              {companyName}
            </span>
            .
          </p>
        </div>

        <Card className="p-4">
          <div className="space-y-1">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="company-ops-estate"
            >
              Filter by estate
            </label>
            <div className="max-w-md">
              <Select
                inputId="company-ops-estate"
                options={estateOptions}
                placeholder={
                  estatesLoading ? "Loading estates..." : "Select estate"
                }
                value={selectedEstate}
                onChange={(option) => {
                  setSelectedEstate(option as EstateSelectOption | null);
                }}
                isSearchable
                isDisabled={estatesLoading || !estateOptions.length}
                styles={estateSelectStyles}
              />
            </div>
          </div>
        </Card>

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : !estateId ? (
          <p className="rounded-xl border border-border bg-muted/20 py-10 text-center text-muted-foreground">
            Select an estate to view operations reports.
          </p>
        ) : (
          <OperationsReportingFillReportPanel
            key={estateId}
            estateId={estateId}
            variant="company"
            readOnly
            emptyTypesMessage={`No reporting types configured for ${estateName}.`}
          />
        )}
      </div>
    </div>
  );
}
