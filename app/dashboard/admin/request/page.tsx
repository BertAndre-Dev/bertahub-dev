"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import Loader from "@/components/ui/Loader";
import Tab from "@/components/tabs/page";
import RequestSubmitView from "@/components/request-mgt/RequestSubmitView";
import RequestWorkflowConfigPanel from "@/components/request-mgt/RequestWorkflowConfigPanel";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch } from "@/redux/store";

const ADMIN_REQUEST_TABS = ["Requests", "Workflow"];

export default function AdminRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [hasCompanyId, setHasCompanyId] = useState<boolean | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const eId = extractEstateIdFromUser(data);
        const eName = extractEstateNameFromUser(data) ?? "Estate";
        const company = parseCompanyFromUser(data);
        setEstateId(eId);
        setEstateName(eName);
        setHasCompanyId(Boolean(company?.id));
        if (!eId) {
          toast.error("Unable to resolve your estate. Please sign in again.");
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setHasCompanyId(false);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  if (bootstrapping || hasCompanyId === null) {
    return (
      <div className="relative min-h-[40vh]">
        <Loader fullScreen label="Loading request management..." />
      </div>
    );
  }

  if (hasCompanyId) {
    return (
      <RequestSubmitView
        estateId={estateId}
        estateName={estateName}
        bootstrapping={false}
        title="Request Management"
        description={
          <span>
            Create and track approval requests for{" "}
            <span className="font-bold uppercase underline text-foreground">
              {estateName}
            </span>
            .
          </span>
        }
      />
    );
  }

  return (
    <div className="relative space-y-6">
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
          Submit requests or configure the approval workflow for{" "}
          <span className="font-semibold uppercase underline text-foreground">
            {estateName}
          </span>
          .
        </p>
      </div>

      <Tab
        titles={ADMIN_REQUEST_TABS}
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
                enabled={Boolean(estateId)}
                estateLabel={estateName}
              />
            ) : (
              <RequestSubmitView
                estateId={estateId}
                estateName={estateName}
                bootstrapping={false}
                embedded
                hideHeading
              />
            )}
          </motion.div>
        )}
      />
    </div>
  );
}
