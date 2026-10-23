"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import Tab from "@/components/tabs/page";
import RequestManagementView from "@/components/request-mgt/RequestManagementView";
import RequestWorkflowConfigPanel from "@/components/request-mgt/RequestWorkflowConfigPanel";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import type { AppDispatch } from "@/redux/store";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "../asset/lib/estate";

type EstateSelectOption = { label: string; value: string };

const COMPANY_REQUEST_TABS = ["Requests", "Workflow"];

export default function CompanyRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const [companyName, setCompanyName] = useState("Company");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

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
        setCompanyId(company.id);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch (err: unknown) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateId = selectedEstate?.value ?? null;

  return (
    <div className="relative space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D0DFF280]">
                <ClipboardList className="w-5 h-5 text-[#0150AC]" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
                Request Management
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 leading-snug">
              Review requests or configure the approval workflow for{" "}
              {/* <span className="font-bold uppercase underline text-foreground">
                {companyName}
              </span> */}
              .
            </p>
          </div>
        </div>

      <Tab
        titles={COMPANY_REQUEST_TABS}
        renderContent={(tab) => (
          <motion.div
            key={tab}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", bounce: 0, duration: 0.35 }
            }
          >
            {tab === "Workflow" ? (
              <RequestWorkflowConfigPanel
                estateId={estateId}
                companyId={companyId}
                estateOptions={estateOptions}
                selectedEstate={selectedEstate}
                onEstateChange={setSelectedEstate}
                estatesLoading={estatesLoading}
                enabled={!estatesLoading && Boolean(estateId)}
                estateLabel={selectedEstate?.label}
              />
            ) : (
              <RequestManagementView
                scope="company"
                description={
                  <span>
                    Review, approve, or cancel estate requests for{" "}
                    <span className="font-bold uppercase underline text-foreground">
                      {companyName}
                    </span>
                    .
                  </span>
                }
                estateId={estateId}
                estateOptions={estateOptions}
                selectedEstate={selectedEstate}
                onEstateChange={setSelectedEstate}
                estatesLoading={estatesLoading}
                emptyHint="No requests found for this estate."
                hideHeading
                embedded
              />
            )}
          </motion.div>
        )}
      />
    </div>
  );
}
