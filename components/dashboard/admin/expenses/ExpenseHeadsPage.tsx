"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { ExpensesHeader } from "@/components/dashboard/admin/expenses/ExpensesHeader";
import { ExpensesFiltersBar } from "@/components/dashboard/admin/expenses/ExpensesFiltersBar";
import { ExpenseHeadCard } from "@/components/dashboard/admin/expenses/ExpenseHeadCard";
import {
  ExpenseHeadModal,
  type ExpenseHeadModalValues,
} from "@/components/dashboard/admin/expenses/ExpenseHeadModal";
import { ViewExpenseHeadModal } from "@/components/dashboard/admin/expenses/ViewExpenseHeadModal";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createExpenseHead,
  deleteExpenseHead,
  fetchExpenseHeads,
  fetchExpenseHeadById,
  updateExpenseHead,
  type ExpenseHead,
} from "@/redux/slice/admin/expense-head/expense-head";
import {
  selectExpenseHeads,
  selectExpenseHeadsError,
  selectExpenseHeadsLoading,
  selectExpenseHeadsPagination,
} from "@/redux/slice/admin/expense-head/expense-head-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { Card } from "@/components/ui/card";

function normalizeEstate(user: any): { estateId: string; estateName: string } {
  const rawEstateId = user?.estateId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const estateId =
    typeof rawEstateId === "string"
      ? rawEstateId
      : rawEstateId?._id || rawEstateId?.id || "";

  const estateFromId = (rawEstateId as { name?: string } | undefined)?.name ?? "";
  const estateFromObj = (user?.estate as { name?: string } | undefined)?.name ?? "";
  const fallbackEstateName = (user?.estateName as string) ?? "";
  const estateName = estateFromId || estateFromObj || fallbackEstateName || "Estate";

  return { estateId, estateName };
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function getId(item: ExpenseHead): string | undefined {
  return item.id ?? item._id;
}

export default function ExpenseHeadsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectExpenseHeads(s));
  const loading = useSelector((s: RootState) => selectExpenseHeadsLoading(s));
  const error = useSelector((s: RootState) => selectExpenseHeadsError(s));
  const pagination = useSelector((s: RootState) => selectExpenseHeadsPagination(s));

  const [estateId, setEstateId] = useState<string>("");
  const [estateName, setEstateName] = useState("Estate");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseHead | null>(null);
  const [modalValues, setModalValues] = useState<ExpenseHeadModalValues>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<ExpenseHead | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data ?? userRes;
        const { estateId, estateName } = normalizeEstate(user);
        setEstateId(estateId);
        setEstateName(estateName);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      fetchExpenseHeads({
        estateId,
        page: 1,
        limit: 100,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch expense heads."));
  }, [dispatch, estateId, startDate, endDate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return (items ?? []).filter((h) =>
      String(h.name ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const openAdd = () => {
    setEditing(null);
    setModalValues({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (item: ExpenseHead) => {
    setEditing(item);
    setModalValues({
      name: item.name ?? "",
      description: item.description ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = (item: ExpenseHead) => {
    const id = getId(item);
    if (!id) return;
    confirmDeleteToast({
      name: item.name,
      onConfirm: async () => {
        await dispatch(deleteExpenseHead(id)).unwrap();
        toast.success("Expense head deleted.");
      },
    });
  };

  const handleView = async (item: ExpenseHead) => {
    const id = getId(item);
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewItem(null);
    try {
      const payload: any = await dispatch(fetchExpenseHeadById(id)).unwrap();
      setViewItem(payload?.data ?? payload ?? null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load expense head.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!estateId) {
      toast.warning("No estate found for this user.");
      return;
    }
    const name = modalValues.name.trim();
    const description = modalValues.description.trim() || undefined;
    if (!name) return;

    setSaving(true);
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) return;
        await dispatch(updateExpenseHead({ id, name, description })).unwrap();
        toast.success("Expense head updated.");
      } else {
        await dispatch(createExpenseHead({ estateId, name, description })).unwrap();
        toast.success("Expense head created.");
      }
      setModalOpen(false);
      setEditing(null);
      setModalValues({ name: "", description: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save expense head.");
    } finally {
      setSaving(false);
    }
  };

  const total = pagination?.total ?? items.length ?? 0;

  const content = useMemo(() => {
    if (loading) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3">
          Loading expense heads...
        </p>
      );
    }
    if (filtered.length === 0) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-muted/20">
          No expense heads found.
        </p>
      );
    }
    return filtered.map((item) => (
      <ExpenseHeadCard
        key={getId(item) ?? item.name}
        item={item}
        onView={handleView}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    ));
  }, [filtered, handleDelete, handleView, loading]);

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="font-heading text-2xl font-bold">{total}</p>
        </Card>
      </div>
      <ExpensesHeader
        title="Expenses"
        estateName={estateName}
        onAddExpense={openAdd}
        actionLabel="Add Expense Head"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {content}
      </div>

      <ExpenseHeadModal
        open={modalOpen}
        saving={saving}
        title={editing ? "Edit Expense Head" : "Add Expense Head"}
        submitLabel={editing ? "Update" : "Add"}
        values={modalValues}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditing(null);
            setModalValues({ name: "", description: "" });
          }
        }}
        onChange={setModalValues}
        onSubmit={handleSubmit}
      />

      <ViewExpenseHeadModal
        open={viewOpen}
        loading={viewLoading}
        item={viewItem}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewItem(null);
            setViewLoading(false);
          }
        }}
      />
    </div>
  );
}

