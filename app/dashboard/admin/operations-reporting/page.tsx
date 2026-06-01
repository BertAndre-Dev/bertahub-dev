"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseAdminEstate } from "../asset/lib/estate";
import {
  createOperationsReportingType,
  deleteOperationsReportingType,
  getOperationsReportingTypes,
  updateOperationsReportingType,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import OperationsReportingTypesTab from "./components/OperationsReportingTypesTab";
import OperationsReportingReportsTab from "./components/OperationsReportingReportsTab";
import OperationsReportingTypeFormModal from "./components/OperationsReportingTypeFormModal";
import { useSelector } from "react-redux";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";

const TABS = ["Configure Report", "Fill Report"] as const;
type TabTitle = (typeof TABS)[number];

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function AdminOperationsReportingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState("");
  const [estateLoading, setEstateLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabTitle>("Configure Report");
  const [configureNonce, setConfigureNonce] = useState(0);
  const [fillReportNonce, setFillReportNonce] = useState(0);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<OperationsReportingType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<OperationsReportingType | null>(null);

  const { createTypeStatus, updateTypeStatus, deleteTypeStatus } = useSelector(
    selectAdminOperationsReporting,
  );

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

  const handleEditType = useCallback((type: OperationsReportingType) => {
    setEditingType(type);
    setTypeModalOpen(true);
  }, []);

  const handleDeleteType = useCallback((type: OperationsReportingType) => {
    setTypeToDelete(type);
  }, []);

  const handleTypeSubmit = async (payload: { name: string; description: string }) => {
    if (!estateId) return;
    try {
      if (editingType) {
        const id = getId(editingType);
        if (!id) return;
        await dispatch(
          updateOperationsReportingType({
            typeId: id,
            name: payload.name,
            description: payload.description,
          }),
        ).unwrap();
        toast.success("Reporting type updated.");
      } else {
        await dispatch(
          createOperationsReportingType({
            estateId,
            name: payload.name,
            description: payload.description,
          }),
        ).unwrap();
        toast.success("Reporting type created.");
      }
      setTypeModalOpen(false);
      setEditingType(null);
      await dispatch(getOperationsReportingTypes(estateId)).unwrap();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save reporting type.",
      );
    }
  };

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="mt-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                Create Weekly Operations Report
              </h1>
              <p className="mt-1 text-muted-foreground">
                Customize the sections, fields and requirements for the weekly report
                submitted by your staff for{" "}
                <span className="font-bold uppercase text-black">{estateName}</span>.
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setEditingType(null);
              setTypeModalOpen(true);
            }}
            className="shrink-0 text-white"
            style={{ backgroundColor: "#0150AC" }}
          >
            + Create Type
          </Button>
        </div>

        {!estateId ? (
          <p className="py-4 text-sm text-muted-foreground">
            Loading estate information…
          </p>
        ) : (
          <>
            <div className="space-y-3 border-b border-border pb-4">
              <div className="flex space-x-4">
                {TABS.map((title) => (
                  <button
                    key={title}
                    type="button"
                    className={`cursor-pointer px-4 py-2 ${
                      activeTab === title
                        ? "border-b-2 border-primary font-bold text-primary"
                        : "font-medium text-sidebar-foreground/60"
                    }`}
                    onClick={() => setActiveTab(title)}
                  >
                    {title}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                {activeTab === "Configure Report" ? (
                  <Button
                    onClick={() => setConfigureNonce((n) => n + 1)}
                    className="shrink-0 text-white"
                    style={{ backgroundColor: "#0150AC" }}
                  >
                    Configure
                  </Button>
                ) : (
                  <Button
                    onClick={() => setFillReportNonce((n) => n + 1)}
                    className="shrink-0 text-white"
                    style={{ backgroundColor: "#0150AC" }}
                  >
                    Fill report
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-2">
              {activeTab === "Configure Report" ? (
                <OperationsReportingTypesTab
                  estateId={estateId}
                  configureNonce={configureNonce}
                  onEditType={handleEditType}
                  onDeleteType={handleDeleteType}
                />
              ) : (
                <OperationsReportingReportsTab
                  estateId={estateId}
                  fillReportNonce={fillReportNonce}
                  onEditType={handleEditType}
                  onDeleteType={handleDeleteType}
                />
              )}
            </div>
          </>
        )}
      </div>

      <OperationsReportingTypeFormModal
        visible={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setEditingType(null);
        }}
        initial={editingType}
        loading={createTypeStatus === "isLoading" || updateTypeStatus === "isLoading"}
        onSubmit={handleTypeSubmit}
      />

      <DeleteModal
        visible={!!typeToDelete}
        onClose={() => setTypeToDelete(null)}
        itemName={typeToDelete?.name ?? "this type"}
        title="Delete reporting type"
        loading={deleteTypeStatus === "isLoading"}
        onConfirm={async () => {
          const id = getId(typeToDelete ?? undefined);
          if (!id || !estateId) return;
          await dispatch(deleteOperationsReportingType(id)).unwrap();
          toast.success("Reporting type deleted.");
          setTypeToDelete(null);
          await dispatch(getOperationsReportingTypes(estateId)).unwrap();
        }}
      />
    </div>
  );
}
