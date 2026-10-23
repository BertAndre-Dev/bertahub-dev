"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

import OperationsReportingFillReportPanel from "@/app/(platform)/dashboard/admin/operations-reporting/components/OperationsReportingFillReportPanel";
import OperationsReportingTypesTab from "@/app/(platform)/dashboard/admin/operations-reporting/components/OperationsReportingTypesTab";
import OperationsReportingTypeFormModal from "@/app/(platform)/dashboard/admin/operations-reporting/components/OperationsReportingTypeFormModal";
import OperationsReportingConfigureFieldsModal from "@/app/(platform)/dashboard/admin/operations-reporting/components/OperationsReportingConfigureFieldsModal";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  createCompanyOperationsReportingField,
  createCompanyOperationsReportingType,
  deleteCompanyOperationsReportingType,
  fetchCompanyOperationsReportingTypes,
  updateCompanyOperationsReportingType,
  type CompanyOperationsReportingType,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting";
import {
  selectCompanyOperationsReporting,
  setCompanyOperationsReportingEstate,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting-slice";
import type { AppDispatch } from "@/redux/store";
import { parseCompanyFromUser } from "@/app/(platform)/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/(platform)/dashboard/company/asset/lib/estate";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";

type EstateSelectOption = { label: string; value: string };

const TABS = ["Configure Report", "Reports"] as const;
type TabTitle = (typeof TABS)[number];

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function CompanyOperationsReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabTitle>("Configure Report");
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [createFlowActive, setCreateFlowActive] = useState(false);
  const [flowType, setFlowType] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [editingType, setEditingType] =
    useState<CompanyOperationsReportingType | null>(null);
  const [typeToDelete, setTypeToDelete] =
    useState<CompanyOperationsReportingType | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const {
    createTypeStatus,
    updateTypeStatus,
    deleteTypeStatus,
    createFieldStatus,
  } = useSelector(selectCompanyOperationsReporting);

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
        } catch (err: unknown) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          const first = { label: options[0].name, value: options[0].id };
          setSelectedEstate(first);
          dispatch(setCompanyOperationsReportingEstate(first.value));
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  const closeCreateFlow = useCallback(() => {
    setCreateFlowActive(false);
    setTypeModalOpen(false);
    setConfigureModalOpen(false);
    setFlowType(null);
  }, []);

  const handleEstateChange = (option: EstateSelectOption | null) => {
    setSelectedEstate(option);
    closeCreateFlow();
    setEditingType(null);
    setTypeToDelete(null);
    if (option?.value) {
      dispatch(setCompanyOperationsReportingEstate(option.value));
    }
  };

  const refreshLists = useCallback(async () => {
    if (!estateId) return;
    await dispatch(
      fetchCompanyOperationsReportingTypes({ estateId, page: 1, limit: 10 }),
    ).unwrap();
    setListRefreshKey((k) => k + 1);
  }, [dispatch, estateId]);

  const handleEditType = useCallback((type: CompanyOperationsReportingType) => {
    setCreateFlowActive(false);
    setFlowType(null);
    setEditingType(type);
    setTypeModalOpen(true);
  }, []);

  const handleDeleteType = useCallback((type: CompanyOperationsReportingType) => {
    setTypeToDelete(type);
  }, []);

  const startCreateFlow = () => {
    if (!estateId) {
      toast.info("Select an estate first.");
      return;
    }
    setEditingType(null);
    setCreateFlowActive(true);
    setFlowType(null);
    setTypeModalOpen(true);
  };

  const handleTypeSubmit = async (payload: {
    name: string;
    description: string;
  }) => {
    if (!estateId) return;

    if (editingType && !createFlowActive) {
      try {
        const id = getId(editingType);
        if (!id) return;
        await dispatch(
          updateCompanyOperationsReportingType({
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
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
      return;
    }

    if (!createFlowActive) return;

    try {
      const created = await dispatch(
        createCompanyOperationsReportingType({
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
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
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
          createCompanyOperationsReportingField({
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
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const noEstates = !estatesLoading && !estates.length;

  return (
    <div className="relative space-y-6">
      {estatesLoading && <Loader fullScreen label="Loading operations reports..." />}

      <div
        className={
          estatesLoading ? "pointer-events-none select-none" : ""
        }
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Operations Reporting</h1>
            <p className="mt-1 text-muted-foreground">
              Configure report types and review submissions across estates under{" "}
              <span className="text-[18px] font-bold uppercase text-black underline">
                {companyName}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48 min-w-[12rem]">
              <Select
                options={estateOptions}
                placeholder="Filter by estate"
                value={selectedEstate}
                onChange={(option) =>
                  handleEstateChange(option as EstateSelectOption | null)
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
            {activeTab === "Configure Report" ? (
              <Button
                onClick={startCreateFlow}
                className="shrink-0 text-white"
                style={{ backgroundColor: "#0150AC" }}
                disabled={!estateId}
              >
                + Create Type
              </Button>
            ) : null}
          </div>
        </div>

        {noEstates ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : null}

        {!noEstates && !estateId ? (
          <p className="rounded-xl border border-border bg-muted/20 py-10 text-center text-muted-foreground">
            Select an estate to configure operations reports.
          </p>
        ) : null}

        {estateId ? (
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
            </div>

            <div className="mt-2">
              {activeTab === "Configure Report" ? (
                <OperationsReportingTypesTab
                  key={`configure-${estateId}-${listRefreshKey}`}
                  estateId={estateId}
                  variant="company"
                  onEditType={handleEditType}
                  onDeleteType={handleDeleteType}
                />
              ) : (
                <OperationsReportingFillReportPanel
                  key={`reports-${estateId}-${listRefreshKey}`}
                  estateId={estateId}
                  variant="company"
                  readOnly
                  emptyTypesMessage={`No reporting types configured for ${estateName}.`}
                />
              )}
            </div>
          </>
        ) : null}
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
        loading={
          createTypeStatus === "isLoading" || updateTypeStatus === "isLoading"
        }
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
          await dispatch(deleteCompanyOperationsReportingType(id)).unwrap();
          toast.success("Reporting type deleted.");
          setTypeToDelete(null);
          await refreshLists();
        }}
      />
    </div>
  );
}
