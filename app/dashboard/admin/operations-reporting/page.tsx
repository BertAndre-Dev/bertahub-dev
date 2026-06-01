"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseAdminEstate } from "../asset/lib/estate";
import {
  createOperationsReportingField,
  deleteOperationsReportingType,
  getOperationsReportingTypes,
  updateOperationsReportingType,
  createOperationsReportingType,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import OperationsReportingTypesTab from "./components/OperationsReportingTypesTab";
import OperationsReportingReportsTab from "./components/OperationsReportingReportsTab";
import OperationsReportingTypeFormModal from "./components/OperationsReportingTypeFormModal";
import OperationsReportingConfigureFieldsModal from "./components/OperationsReportingConfigureFieldsModal";

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
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [createFlowActive, setCreateFlowActive] = useState(false);
  const [flowType, setFlowType] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [editingType, setEditingType] = useState<OperationsReportingType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<OperationsReportingType | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [fillReportTabNonce, setFillReportTabNonce] = useState(0);

  const {
    createTypeStatus,
    updateTypeStatus,
    deleteTypeStatus,
    createFieldStatus,
  } = useSelector(selectAdminOperationsReporting);

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

  const refreshLists = useCallback(async () => {
    if (!estateId) return;
    await dispatch(getOperationsReportingTypes(estateId)).unwrap();
    setListRefreshKey((k) => k + 1);
  }, [dispatch, estateId]);

  const closeCreateFlow = useCallback(() => {
    setCreateFlowActive(false);
    setTypeModalOpen(false);
    setConfigureModalOpen(false);
    setFlowType(null);
  }, []);

  const handleEditType = useCallback((type: OperationsReportingType) => {
    setCreateFlowActive(false);
    setFlowType(null);
    setEditingType(type);
    setTypeModalOpen(true);
  }, []);

  const handleDeleteType = useCallback((type: OperationsReportingType) => {
    setTypeToDelete(type);
  }, []);

  const startCreateFlow = () => {
    setEditingType(null);
    setCreateFlowActive(true);
    setFlowType(null);
    setTypeModalOpen(true);
  };

  const handleTypeSubmit = async (payload: { name: string; description: string }) => {
    if (!estateId) return;

    if (editingType && !createFlowActive) {
      try {
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
        setTypeModalOpen(false);
        setEditingType(null);
        await refreshLists();
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message ?? "Failed to save reporting type.",
        );
      }
      return;
    }

    if (!createFlowActive) return;

    try {
      const created = await dispatch(
        createOperationsReportingType({
          estateId,
          name: payload.name,
          description: payload.description,
        }),
      ).unwrap();
      const typeId = getId(created?.data);
      if (!typeId) {
        toast.error("Type was created but no id was returned.");
        return;
      }
      setFlowType({
        id: typeId,
        name: payload.name,
        description: payload.description,
      });
      setTypeModalOpen(false);
      setConfigureModalOpen(true);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to create reporting type.",
      );
    }
  };

  const handleConfigureFieldsSave = async (
    fields: { label: string; key: string }[],
  ) => {
    const typeId = flowType?.id;
    if (!estateId || !typeId) return;

    try {
      for (const field of fields) {
        await dispatch(
          createOperationsReportingField({
            estateId,
            typeId,
            label: field.label,
            key: field.key,
          }),
        ).unwrap();
      }
      toast.success(
        fields.length === 1
          ? "Report type and field saved."
          : `Report type saved with ${fields.length} fields.`,
      );
      closeCreateFlow();
      await refreshLists();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report fields.",
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
            onClick={startCreateFlow}
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

              {activeTab === "Fill Report" ? (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setFillReportTabNonce((n) => n + 1)}
                    className="shrink-0 text-white"
                    style={{ backgroundColor: "#0150AC" }}
                  >
                    Fill report
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="mt-2">
              {activeTab === "Configure Report" ? (
                <OperationsReportingTypesTab
                  key={`configure-${listRefreshKey}`}
                  estateId={estateId}
                  onEditType={handleEditType}
                  onDeleteType={handleDeleteType}
                />
              ) : (
                <OperationsReportingReportsTab
                  key={`fill-${listRefreshKey}`}
                  estateId={estateId}
                  fillReportTabNonce={fillReportTabNonce}
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
          if (createFlowActive) {
            closeCreateFlow();
          } else {
            setTypeModalOpen(false);
            setEditingType(null);
          }
        }}
        initial={editingType}
        loading={createTypeStatus === "isLoading" || updateTypeStatus === "isLoading"}
        submitLabel={createFlowActive ? "Next" : "Save"}
        onSubmit={handleTypeSubmit}
      />

      <OperationsReportingConfigureFieldsModal
        visible={configureModalOpen && !!flowType}
        onClose={closeCreateFlow}
        typeName={flowType?.name ?? ""}
        typeDescription={flowType?.description}
        loading={createFieldStatus === "isLoading"}
        submitLabel="Save"
        onSubmit={handleConfigureFieldsSave}
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
          await refreshLists();
        }}
      />
    </div>
  );
}
