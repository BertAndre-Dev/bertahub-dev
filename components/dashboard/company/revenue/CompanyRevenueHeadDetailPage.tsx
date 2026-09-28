"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import Select from "react-select";

import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  fetchCompanyRevenueHeads,
  type CompanyRevenueHead,
} from "@/redux/slice/company/revenue-head/company-revenue-head";
import {
  selectCompanyRevenueHeads,
  selectCompanyRevenueHeadsLoading,
} from "@/redux/slice/company/revenue-head/company-revenue-head-slice";
import {
  createCompanyRevenueEntries,
  deleteCompanyRevenueEntry,
  fetchCompanyRevenueEntries,
  updateCompanyRevenueEntry,
  type CompanyRevenueEntry,
} from "@/redux/slice/company/revenue-entry/company-revenue-entry";
import {
  selectCompanyRevenueEntries,
  selectCompanyRevenueEntriesLoading,
  selectCompanyRevenueEntriesPagination,
} from "@/redux/slice/company/revenue-entry/company-revenue-entry-slice";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import { slugify } from "@/lib/slug";
import { getApiErrorMessage } from "@/lib/api-error";

import { RevenueHeader } from "@/components/dashboard/admin/revenue/RevenueHeader";
import { RevenueFiltersBar } from "@/components/dashboard/admin/revenue/RevenueFiltersBar";
import { TotalRevenueCard } from "@/components/dashboard/admin/revenue/TotalRevenueCard";
import { RevenueEntriesTable } from "@/components/dashboard/admin/revenue/RevenueEntriesTable";
import {
  AddRevenueModal,
  type AddRevenueDraftEntry,
} from "@/components/dashboard/admin/revenue/AddRevenueModal";
import { EditRevenueModal } from "@/components/dashboard/admin/revenue/EditRevenueModal";
import { ViewRevenueEntryModal } from "@/components/dashboard/admin/revenue/ViewRevenueEntryModal";
import Loader from "@/components/ui/Loader";

type EstateSelectOption = { label: string; value: string };

function getId(item: { id?: string; _id?: string } | null | undefined): string {
  return item?.id || item?._id || "";
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function CompanyRevenueHeadDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ revenueName: string }>();
  const searchParams = useSearchParams();
  const revenueName = params?.revenueName ?? "";

  const heads = useSelector((s: RootState) =>
    selectCompanyRevenueHeads(s),
  ) as CompanyRevenueHead[];
  const headsLoading = useSelector((s: RootState) =>
    selectCompanyRevenueHeadsLoading(s),
  );
  const entries = useSelector((s: RootState) =>
    selectCompanyRevenueEntries(s),
  ) as CompanyRevenueEntry[];
  const entriesLoading = useSelector((s: RootState) =>
    selectCompanyRevenueEntriesLoading(s),
  );
  const pagination = useSelector((s: RootState) =>
    selectCompanyRevenueEntriesPagination(s),
  );

  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<AddRevenueDraftEntry[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRevenueEntry | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CompanyRevenueEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDocumentNumber, setFormDocumentNumber] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<CompanyRevenueEntry | null>(null);

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";

  const resolvedHead = useMemo(() => {
    const key = String(revenueName || "").trim();
    if (!key) return null;
    const byId = heads.find((h) => getId(h) === key) ?? null;
    if (byId) return byId;

    return heads.find((h) => slugify(h.name ?? "") === key) ?? null;
  }, [heads, revenueName]);

  const headId = getId(resolvedHead);
  const headName = resolvedHead?.name ?? revenueName;

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

        const fromQuery = searchParams.get("estateId") ?? "";
        const match = options.find((e) => e.id === fromQuery);
        if (match) {
          setSelectedEstate({ label: match.name, value: match.id });
        } else if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch, searchParams]);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    if (!estateId) return;
    dispatch(fetchCompanyRevenueHeads({ estateId, page: 1, limit: 500 }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, estateId]);

  useEffect(() => {
    if (!headId) return;
    dispatch(
      fetchCompanyRevenueEntries({
        headId,
        page,
        limit: pageSize,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, headId, page, pageSize, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return (entries ?? []).filter((e) => {
      const doc = (e.documentNumber ?? "").toLowerCase();
      const desc = (e.description ?? "").toLowerCase();
      return doc.includes(q) || desc.includes(q);
    });
  }, [entries, search]);

  const totalRevenue = useMemo(() => {
    return (filteredEntries ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [filteredEntries]);

  const createDraftEntry = (): AddRevenueDraftEntry => ({
    id:
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    amount: "",
    documentNumber: "",
  });

  const openAdd = () => {
    setDrafts([createDraftEntry()]);
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setDrafts([]);
    setSaving(false);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setFormDescription("");
    setFormAmount("");
    setFormDocumentNumber("");
    setSaving(false);
  };

  const onDraftChange = (
    id: string,
    field: "description" | "amount" | "documentNumber",
    value: string,
  ) => {
    setDrafts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const addDraft = () => setDrafts((prev) => [...prev, createDraftEntry()]);
  const removeDraft = (id: string) =>
    setDrafts((prev) => prev.filter((p) => p.id !== id));

  const submitCreate = async () => {
    if (!headId) return toast.error("Revenue head not resolved.");
    if (!drafts.length) return toast.warning("Add at least one entry.");

    const entriesPayload = drafts.map((d) => ({
      headId,
      description: d.description.trim(),
      documentNumber: d.documentNumber.trim(),
      amount: Number(d.amount),
    }));

    for (const [idx, e] of entriesPayload.entries()) {
      if (!e.description)
        return toast.warning(`Description is required for entry ${idx + 1}.`);
      if (!e.documentNumber)
        return toast.warning(
          `Reference number is required for entry ${idx + 1}.`,
        );
      if (!e.amount || Number.isNaN(e.amount))
        return toast.warning(`Amount is required for entry ${idx + 1}.`);
    }

    setSaving(true);
    try {
      await dispatch(
        createCompanyRevenueEntries({ entries: entriesPayload }),
      ).unwrap();
      toast.success("Revenue entries created.");
      closeAdd();
      setPage(1);
      await dispatch(
        fetchCompanyRevenueEntries({
          headId,
          page: 1,
          limit: pageSize,
          startDate: toIsoIfPresent(startDate),
          endDate: toIsoIfPresent(endDate),
        }),
      ).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setSaving(false);
    }
  };

  const handleView = async (item: CompanyRevenueEntry) => {
    setViewOpen(true);
    setViewItem(item);
  };

  const handleEdit = (item: CompanyRevenueEntry) => {
    setEditing(item);
    setFormDescription(item.description ?? "");
    setFormAmount(String(item.amount ?? ""));
    setFormDocumentNumber(item.documentNumber ?? "");
    setEditOpen(true);
  };

  const submitUpdate = async () => {
    if (!editing) return;
    const id = getId(editing);
    if (!id) return;
    if (!headId) return toast.error("Revenue head not resolved.");
    if (!formDescription.trim())
      return toast.warning("Description is required.");
    const amount = Number(formAmount);
    if (!formAmount || Number.isNaN(amount))
      return toast.warning("Amount is required.");
    if (!formDocumentNumber.trim())
      return toast.warning("Reference number is required.");

    setSaving(true);
    try {
      await dispatch(
        updateCompanyRevenueEntry({
          id,
          headId,
          description: formDescription.trim(),
          documentNumber: formDocumentNumber.trim(),
          amount,
        }),
      ).unwrap();
      toast.success("Revenue entry updated.");
      closeEdit();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setSaving(false);
    }
  };

  const handleDelete = (item: CompanyRevenueEntry) => {
    const id = getId(item);
    if (!id) return;
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = getId(itemToDelete);
    if (!id) return;
    setDeleting(true);
    try {
      await dispatch(deleteCompanyRevenueEntry(id)).unwrap();
      toast.success("Revenue entry deleted.");
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const pageLoading = estatesLoading || headsLoading || entriesLoading;

  return (
    <div className="relative">
      {pageLoading && (
        <Loader
          fullScreen
          label={
            headsLoading && !headId
              ? "Loading revenue details..."
              : "Loading revenue..."
          }
        />
      )}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4">
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

        <RevenueHeader
          showImage
          title={`Revenue Head - ${headName}`}
          estateName={estateName}
          onAddRevenue={openAdd}
          actionLabel="Add Revenue Entry"
        />

        <RevenueFiltersBar
          startDate={startDate}
          endDate={endDate}
          search={search}
          defaultDateRangeDays={0}
          onStartDateChange={(v) => setStartDate(v)}
          onEndDateChange={(v) => setEndDate(v)}
          onResetDates={() => {
            setStartDate("");
            setEndDate("");
          }}
          onSearchChange={setSearch}
        />

        <TotalRevenueCard total={totalRevenue} />

        <RevenueEntriesTable
          headName={headName}
          items={filteredEntries}
          loading={pageLoading ? false : entriesLoading}
          total={pagination?.total ?? filteredEntries.length ?? 0}
          currentPage={pagination?.currentPage ?? page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddRevenueModal
          open={addOpen}
          saving={saving}
          headName={headName}
          drafts={drafts}
          onOpenChange={(open) => (open ? setAddOpen(true) : closeAdd())}
          onDraftChange={onDraftChange}
          onAddDraft={addDraft}
          onRemoveDraft={removeDraft}
          onSubmit={submitCreate}
          showDateAndUpload={false}
        />

        <EditRevenueModal
          open={editOpen}
          saving={saving}
          headName={headName}
          description={formDescription}
          amount={formAmount}
          documentNumber={formDocumentNumber}
          onOpenChange={(open) => (open ? setEditOpen(true) : closeEdit())}
          onDescriptionChange={setFormDescription}
          onAmountChange={setFormAmount}
          onDocumentNumberChange={setFormDocumentNumber}
          onSubmit={submitUpdate}
        />

        <ViewRevenueEntryModal
          open={viewOpen}
          loading={false}
          item={viewItem}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) {
              setViewItem(null);
            }
          }}
        />
      </div>
    
        <DeleteModal
          visible={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          itemName={itemToDelete?.documentNumber ?? "this entry"}
          title="Delete revenue entry"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
    </div>
  );
}
