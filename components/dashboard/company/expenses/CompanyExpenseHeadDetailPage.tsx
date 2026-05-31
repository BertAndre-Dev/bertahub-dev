"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  fetchCompanyExpenseHeads,
  type CompanyExpenseHead,
} from "@/redux/slice/company/expense-head/company-expense-head";
import {
  selectCompanyExpenseHeads,
  selectCompanyExpenseHeadsLoading,
} from "@/redux/slice/company/expense-head/company-expense-head-slice";
import {
  createCompanyExpenseEntries,
  deleteCompanyExpenseEntry,
  fetchCompanyExpenseEntries,
  updateCompanyExpenseEntry,
  type CompanyExpenseEntry,
} from "@/redux/slice/company/expense-entry/company-expense-entry";
import {
  selectCompanyExpenseEntries,
  selectCompanyExpenseEntriesLoading,
  selectCompanyExpenseEntriesPagination,
} from "@/redux/slice/company/expense-entry/company-expense-entry-slice";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import { slugify } from "@/lib/slug";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

import { ExpensesHeader } from "@/components/dashboard/admin/expenses/ExpensesHeader";
import { ExpensesFiltersBar } from "@/components/dashboard/admin/expenses/ExpensesFiltersBar";
import { TotalExpensesCard } from "@/components/dashboard/admin/expenses/TotalExpensesCard";
import { ExpenseEntriesTable } from "@/components/dashboard/admin/expenses/ExpenseEntriesTable";
import {
  AddExpenseModal,
  type AddExpenseDraftEntry,
} from "@/components/dashboard/admin/expenses/AddExpenseModal";
import { EditExpenseModal } from "@/components/dashboard/admin/expenses/EditExpenseModal";
import { ViewExpenseEntryModal } from "@/components/dashboard/admin/expenses/ViewExpenseEntryModal";
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

export default function CompanyExpenseHeadDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ expenseName: string }>();
  const searchParams = useSearchParams();
  const expenseName = params?.expenseName ?? "";

  const heads = useSelector((s: RootState) =>
    selectCompanyExpenseHeads(s),
  ) as CompanyExpenseHead[];
  const headsLoading = useSelector((s: RootState) =>
    selectCompanyExpenseHeadsLoading(s),
  );
  const entries = useSelector((s: RootState) =>
    selectCompanyExpenseEntries(s),
  ) as CompanyExpenseEntry[];
  const entriesLoading = useSelector((s: RootState) =>
    selectCompanyExpenseEntriesLoading(s),
  );
  const pagination = useSelector((s: RootState) =>
    selectCompanyExpenseEntriesPagination(s),
  );

  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<AddExpenseDraftEntry[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyExpenseEntry | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDocumentNumber, setFormDocumentNumber] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<CompanyExpenseEntry | null>(null);

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";

  const resolvedHead = useMemo(() => {
    const key = String(expenseName || "").trim();
    if (!key) return null;
    const byId = heads.find((h) => getId(h) === key) ?? null;
    if (byId) return byId;

    return heads.find((h) => slugify(h.name ?? "") === key) ?? null;
  }, [heads, expenseName]);

  const headId = getId(resolvedHead);
  const headName = resolvedHead?.name ?? expenseName;

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
        } catch {
          toast.error("Failed to fetch company estates.");
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
      } catch {
        toast.error("Failed to load company information.");
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
    dispatch(fetchCompanyExpenseHeads({ estateId, page: 1, limit: 500 }))
      .unwrap()
      .catch(() => toast.error("Failed to load expense heads."));
  }, [dispatch, estateId]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, estateId]);

  useEffect(() => {
    if (!headId) return;
    dispatch(
      fetchCompanyExpenseEntries({
        headId,
        page,
        limit,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch expense entries."));
  }, [dispatch, headId, page, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return (entries ?? []).filter((e) => {
      const doc = (e.documentNumber ?? "").toLowerCase();
      const desc = (e.description ?? "").toLowerCase();
      return doc.includes(q) || desc.includes(q);
    });
  }, [entries, search]);

  const totalExpenses = useMemo(() => {
    return (filteredEntries ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [filteredEntries]);

  const createDraftEntry = (): AddExpenseDraftEntry => ({
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
    if (!headId) return toast.error("Expense head not resolved.");
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
        createCompanyExpenseEntries({ entries: entriesPayload }),
      ).unwrap();
      toast.success("Expense entries created.");
      closeAdd();
      setPage(1);
      await dispatch(
        fetchCompanyExpenseEntries({
          headId,
          page: 1,
          limit,
          startDate: toIsoIfPresent(startDate),
          endDate: toIsoIfPresent(endDate),
        }),
      ).unwrap();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to create entries.");
      setSaving(false);
    }
  };

  const handleView = async (item: CompanyExpenseEntry) => {
    setViewOpen(true);
    setViewItem(item);
  };

  const handleEdit = (item: CompanyExpenseEntry) => {
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
    if (!headId) return toast.error("Expense head not resolved.");
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
        updateCompanyExpenseEntry({
          id,
          headId,
          description: formDescription.trim(),
          documentNumber: formDocumentNumber.trim(),
          amount,
        }),
      ).unwrap();
      toast.success("Expense entry updated.");
      closeEdit();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to update entry.");
      setSaving(false);
    }
  };

  const handleDelete = (item: CompanyExpenseEntry) => {
    const id = getId(item);
    if (!id) return;
    confirmDeleteToast({
      name: item.documentNumber,
      onConfirm: async () => {
        await dispatch(deleteCompanyExpenseEntry(id)).unwrap();
        toast.success("Expense entry deleted.");
      },
    });
  };

  const pageLoading = estatesLoading || headsLoading || entriesLoading;

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader
            label={
              headsLoading && !headId
                ? "Loading expense details..."
                : "Loading expenses..."
            }
          />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          pageLoading
            ? "blur-sm opacity-60 pointer-events-none select-none"
            : "",
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

        <ExpensesHeader
          showImage
          title={`Expenses Head - ${headName}`}
          estateName={estateName}
          onAddExpense={openAdd}
          actionLabel="Add Expense Entry"
        />

        <ExpensesFiltersBar
          startDate={startDate}
          endDate={endDate}
          search={search}
          onStartDateChange={(v) => setStartDate(v)}
          onEndDateChange={(v) => setEndDate(v)}
          onResetDates={() => {
            setStartDate("");
            setEndDate("");
          }}
          onSearchChange={setSearch}
        />

        <TotalExpensesCard total={totalExpenses} />

        <ExpenseEntriesTable
          headName={headName}
          items={filteredEntries}
          loading={pageLoading ? false : entriesLoading}
          total={pagination?.total ?? filteredEntries.length ?? 0}
          currentPage={pagination?.currentPage ?? page}
          pageSize={pagination?.pageSize ?? limit}
          onPageChange={setPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddExpenseModal
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

        <EditExpenseModal
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

        <ViewExpenseEntryModal
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
    </div>
  );
}
