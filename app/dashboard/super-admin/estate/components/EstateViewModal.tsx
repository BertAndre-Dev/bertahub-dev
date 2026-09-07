"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { formatDateTime } from "@/lib/format-date";
import {
  labelForEstateModule,
  parseEstateModulesResponse,
} from "@/lib/estate-module-labels";
import type { AppDispatch } from "@/redux/store";
import {
  fetchEstateModules,
  getEstate,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { EstateRatesTab } from "./EstateRatesTab";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVendAmount, labelForPlan } from "@/lib/plans";

type EstateViewData = {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  modules?: string[];
  plan?: string;
  minVendAmount?: number;
  maxVendAmount?: number;
  visitorVerificationMode?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
};

type EstateViewTab = "details" | "rates";

type Props = Readonly<{
  open: boolean;
  estateId: string | null;
  fallback?: EstateViewData | null;
  onClose: () => void;
}>;

function formatDateValue(value?: string | number | Date | null) {
  if (value == null || value === "") return "—";
  if (value instanceof Date) return formatDateTime(value.toISOString());
  return formatDateTime(String(value));
}

function formatVerificationMode(mode?: string | null) {
  if (mode === "VIEW_AND_VERIFY") return "View and verify";
  if (mode === "VERIFY_ONLY") return "Verify only";
  if (mode === "VIEW_ONLY") return "View only";
  return mode?.trim() || "—";
}

function modulesFromEstate(estate?: EstateViewData | null): string[] {
  const modules = estate?.modules;
  return Array.isArray(modules) ? modules : [];
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5 wrap-break-word">{value}</div>
    </div>
  );
}

const TABS: { id: EstateViewTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "rates", label: "Rates" },
];

export function EstateViewModal({
  open,
  estateId,
  fallback = null,
  onClose,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<EstateViewTab>("details");
  const [estate, setEstate] = useState<EstateViewData | null>(fallback);
  const [modules, setModules] = useState<string[]>(() =>
    modulesFromEstate(fallback),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveTab("details");
      return;
    }
    if (!estateId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setEstate(fallback);
    setModules(modulesFromEstate(fallback));

    (async () => {
      try {
        const [estateRes, modulesRes] = await Promise.all([
          dispatch(getEstate(estateId)).unwrap(),
          dispatch(fetchEstateModules(estateId)).unwrap(),
        ]);

        if (cancelled) return;

        const details = (estateRes?.data ?? estateRes) as EstateViewData | null;
        if (!details) {
          setEstate(null);
        } else {
          const min = Number(details.minVendAmount);
          const max = Number(details.maxVendAmount);
          setEstate({
            ...details,
            minVendAmount: Number.isFinite(min) ? min : details.minVendAmount,
            maxVendAmount: Number.isFinite(max) ? max : details.maxVendAmount,
          });
        }
        const fromApi = parseEstateModulesResponse(
          modulesRes?.data ?? modulesRes,
        );
        setModules(fromApi.length > 0 ? fromApi : modulesFromEstate(details));
      } catch (err: unknown) {
        if (cancelled) return;
        const message = getApiErrorMessage(err);
        setError(message ?? null);
        if (fallback) setEstate(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, estateId, dispatch, fallback]);

  const display = estate ?? fallback;

  return (
    <Modal visible={open} onClose={onClose} contentClassName="max-w-2xl">
      <div className="pr-8 relative min-h-[160px]">
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">
          Estate details
        </h2>
        {display?.name ? (
          <p className="text-sm text-muted-foreground mb-3">{display.name}</p>
        ) : (
          <div className="mb-3" />
        )}

        <div className="flex gap-1 overflow-x-auto border-b border-border mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <>
            {loading && <Loader label="Loading estate..." />}

            {!loading && error && !display ? (
              <div className="py-8 text-center text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && display ? (
              <div className="space-y-4">
                {error ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                    Could not refresh full details. Showing available estate
                    info.
                  </p>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow label="Estate name" value={display.name || "—"} />
                  <DetailRow
                    label="Status"
                    value={
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          display.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {display.isActive ? "Active" : "Inactive"}
                      </span>
                    }
                  />
                  <DetailRow label="Address" value={display.address || "—"} />
                  <DetailRow label="City" value={display.city || "—"} />
                  <DetailRow label="State" value={display.state || "—"} />
                  <DetailRow label="Country" value={display.country || "—"} />
                  <DetailRow label="Plan" value={labelForPlan(display.plan)} />
                  <DetailRow
                    label="Min vend amount"
                    value={formatVendAmount(display.minVendAmount)}
                  />
                  <DetailRow
                    label="Max vend amount"
                    value={formatVendAmount(display.maxVendAmount)}
                  />
                  <DetailRow
                    label="Visitor verification"
                    value={formatVerificationMode(
                      display.visitorVerificationMode,
                    )}
                  />
                  <DetailRow
                    label="Created at"
                    value={formatDateValue(display.createdAt)}
                  />
                  <DetailRow
                    label="Updated at"
                    value={formatDateValue(display.updatedAt)}
                  />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Modules</p>
                  {modules.length === 0 ? (
                    <p className="text-sm">—</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {modules.map((mod) => (
                        <span
                          key={mod}
                          className="inline-flex items-center rounded-md bg-[#D0DFF280] px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {labelForEstateModule(mod)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : estateId ? (
          <EstateRatesTab estateId={estateId} />
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Estate ID is required to load rates.
          </p>
        )}

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
