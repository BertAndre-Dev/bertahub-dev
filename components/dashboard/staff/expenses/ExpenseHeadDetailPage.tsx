"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import DeleteModal from "@/components/resident/delete-modal/page";

import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  fetchExpenseHeads,
  type ExpenseHead,
} from "@/redux/slice/staff/expense-head/expense-head";
import {
  selectExpenseHeads,
  selectExpenseHeadsLoading,
} from "@/redux/slice/staff/expense-head/expense-head-slice";
import {
  createExpenseEntries,
  deleteExpenseEntry,
  fetchExpenseEntries,
  updateExpenseEntry,
  type ExpenseEntry,
} from "@/redux/slice/staff/expense-entry/expense-entry";
import {
  selectExpenseEntries,
  selectExpenseEntriesLoading,
  selectExpenseEntriesPagination,
} from "@/redux/slice/staff/expense-entry/expense-entry-slice";
import { slugify } from "@/lib/slug";

import { ExpensesHeader } from "@/components/dashboard/admin/expenses/ExpensesHeader";
import { ExpensesFiltersBar } from "@/components/dashboard/admin/expenses/ExpensesFiltersBar";
import { TotalExpensesCard } from "@/components/dashboard/admin/expenses/TotalExpensesCard";
import { ExpenseEntriesTable } from "@/components/dashboard/admin/expenses/ExpenseEntriesTable";
import {
  AddExpenseModal,
  type AddExpenseDraftEntry,
} from "@/components/dashboard/admin/expenses/AddExpenseModal";
import { toDraftAttachments } from "@/components/dashboard/admin/expenses/ExpenseAttachmentsPicker";
import { EditExpenseModal } from "@/components/dashboard/admin/expenses/EditExpenseModal";
import { ViewExpenseEntryModal } from "@/components/dashboard/admin/expenses/ViewExpenseEntryModal";
import Loader from "@/components/ui/Loader";

function getId(item: { id?: string; _id?: string } | null | undefined): string {
  return item?.id || item?._id || "";
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function normalizeEstate(user: any): { estateId: string; estateName: string } {
  const rawEstateId = user?.estateId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const estateId =
    typeof rawEstateId === "string"
      ? rawEstateId
      : rawEstateId?._id || rawEstateId?.id || "";

  const estateFromId =
    (rawEstateId as { name?: string } | undefined)?.name ?? "";
  const estateFromObj =
    (user?.estate as { name?: string } | undefined)?.name ?? "";
  const fallbackEstateName = (user?.estateName as string) ?? "";
  const estateName =
    estateFromId || estateFromObj || fallbackEstateName || "Estate";
  return { estateId, estateName };
}

export default function ExpenseHeadDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ expenseName: string }>();
  const expenseName = params?.expenseName ?? "";

  const heads = useSelector((s: RootState) =>
    selectExpenseHeads(s),
  ) as ExpenseHead[];
  const headsLoading = useSelector((s: RootState) =>
    selectExpenseHeadsLoading(s),
  );
  const entries = useSelector((s: RootState) =>
    selectExpenseEntries(s),
  ) as ExpenseEntry[];
  const entriesLoading = useSelector((s: RootState) =>
    selectExpenseEntriesLoading(s),
  );
  const pagination = useSelector((s: RootState) =>
    selectExpenseEntriesPagination(s),
  );

  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<AddExpenseDraftEntry[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExpenseEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDocumentNumber, setFormDocumentNumber] = useState("");
  const [formAttachments, setFormAttachments] = useState<
    AddExpenseDraftEntry["attachments"]
  >([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ExpenseEntry | null>(null);

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
        const user = userRes?.data ?? userRes;
        const { estateId, estateName } = normalizeEstate(user);
        setEstateId(estateId);
        setEstateName(estateName);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(fetchExpenseHeads({ estateId, page: 1, limit: 500 }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!headId) return;
    dispatch(
      fetchExpenseEntries({
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
    attachments: [],
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
    setFormAttachments([]);
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
  const onAttachmentsChange = (
    id: string,
    attachments: AddExpenseDraftEntry["attachments"],
  ) => {
    setDrafts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attachments } : p)),
    );
  };

  const submitCreate = async () => {
    if (!headId) return toast.error("Expense head not resolved.");
    if (!drafts.length) return toast.warning("Add at least one entry.");

    const entriesPayload = drafts.map((d) => ({
      headId,
      description: d.description.trim(),
      documentNumber: d.documentNumber.trim(),
      amount: Number(d.amount),
      attachments: d.attachments.map((file) => file.url),
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
        createExpenseEntries({ entries: entriesPayload }),
      ).unwrap();
      toast.success("Expense entries created.");
      closeAdd();
      setPage(1);
      await dispatch(
        fetchExpenseEntries({
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

  const handleView = async (item: ExpenseEntry) => {
    setViewOpen(true);
    setViewItem(item);
  };

  const handleEdit = (item: ExpenseEntry) => {
    setEditing(item);
    setFormDescription(item.description ?? "");
    setFormAmount(String(item.amount ?? ""));
    setFormDocumentNumber(item.documentNumber ?? "");
    setFormAttachments(toDraftAttachments(item.attachments));
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
        updateExpenseEntry({
          id,
          headId,
          description: formDescription.trim(),
          documentNumber: formDocumentNumber.trim(),
          amount,
          attachments: formAttachments.map((file) => file.url),
        }),
      ).unwrap();
      toast.success("Expense entry updated.");
      closeEdit();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setSaving(false);
    }
  };

  const handleDelete = (item: ExpenseEntry) => {
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
      await dispatch(deleteExpenseEntry(id)).unwrap();
      toast.success("Expense entry deleted.");
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const pageLoading = headsLoading || entriesLoading;

  return (
    <div className="relative">
      {pageLoading && (
        <Loader
          fullScreen
          label={
            headsLoading && !headId
              ? "Loading expense details..."
              : "Loading expenses..."
          }
        />
      )}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
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
          defaultDateRangeDays={0}
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

        <AddExpenseModal
          open={addOpen}
          saving={saving}
          headName={headName}
          drafts={drafts}
          onOpenChange={(open) => (open ? setAddOpen(true) : closeAdd())}
          onDraftChange={onDraftChange}
          onAttachmentsChange={onAttachmentsChange}
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
          attachments={formAttachments}
          onOpenChange={(open) => (open ? setEditOpen(true) : closeEdit())}
          onDescriptionChange={setFormDescription}
          onAmountChange={setFormAmount}
          onDocumentNumberChange={setFormDocumentNumber}
          onAttachmentsChange={setFormAttachments}
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
    
        <DeleteModal
          visible={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          itemName={itemToDelete?.documentNumber ?? "this entry"}
          title="Delete expense entry"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
    </div>
  );
}
