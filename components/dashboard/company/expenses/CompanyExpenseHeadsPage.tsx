"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

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
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  createCompanyExpenseHead,
  deleteCompanyExpenseHead,
  fetchCompanyExpenseHeads,
  fetchCompanyExpenseHeadById,
  updateCompanyExpenseHead,
  type CompanyExpenseHead,
} from "@/redux/slice/company/expense-head/company-expense-head";
import {
  selectCompanyExpenseHeads,
  selectCompanyExpenseHeadsError,
  selectCompanyExpenseHeadsLoading,
  selectCompanyExpenseHeadsPagination,
  setCompanyExpenseHeadEstate,
} from "@/redux/slice/company/expense-head/company-expense-head-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/pagination/page";

const PAGE_SIZE = 12;

type EstateSelectOption = { label: string; value: string };

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function getId(item: CompanyExpenseHead): string | undefined {
  return item.id ?? item._id;
}

export default function CompanyExpenseHeadsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectCompanyExpenseHeads(s));
  const loading = useSelector((s: RootState) =>
    selectCompanyExpenseHeadsLoading(s),
  );
  const error = useSelector((s: RootState) => selectCompanyExpenseHeadsError(s));
  const pagination = useSelector((s: RootState) =>
    selectCompanyExpenseHeadsPagination(s),
  );

  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyExpenseHead | null>(null);
  const [modalValues, setModalValues] = useState<ExpenseHeadModalValues>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<CompanyExpenseHead | null>(null);

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
        } catch {
          toast.error("Failed to fetch company estates.");
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    setPage(1);
  }, [estateId, startDate, endDate]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(setCompanyExpenseHeadEstate(estateId));
    dispatch(
      fetchCompanyExpenseHeads({
        estateId,
        page,
        limit: PAGE_SIZE,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch expense heads."));
  }, [dispatch, estateId, startDate, endDate, page]);

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

  const openEdit = (item: CompanyExpenseHead) => {
    setEditing(item);
    setModalValues({
      name: item.name ?? "",
      description: item.description ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = (item: CompanyExpenseHead) => {
    const id = getId(item);
    if (!id) return;
    confirmDeleteToast({
      name: item.name,
      onConfirm: async () => {
        await dispatch(deleteCompanyExpenseHead(id)).unwrap();
        toast.success("Expense head deleted.");
      },
    });
  };

  const handleView = async (item: CompanyExpenseHead) => {
    const id = getId(item);
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewItem(null);
    try {
      const payload = await dispatch(fetchCompanyExpenseHeadById(id)).unwrap();
      setViewItem(payload?.data ?? payload ?? null);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to load expense head.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!estateId) {
      toast.warning("Select an estate first.");
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
        await dispatch(
          updateCompanyExpenseHead({ id, name, description }),
        ).unwrap();
        toast.success("Expense head updated.");
      } else {
        await dispatch(
          createCompanyExpenseHead({ estateId, name, description }),
        ).unwrap();
        toast.success("Expense head created.");
      }
      setModalOpen(false);
      setEditing(null);
      setModalValues({ name: "", description: "" });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to save expense head.");
    } finally {
      setSaving(false);
    }
  };

  const total = pagination?.total ?? items.length ?? 0;

  const paginationInfo = {
    total: pagination?.total ?? items.length ?? 0,
    current: pagination?.currentPage ?? page,
    pageSize: pagination?.pageSize ?? PAGE_SIZE,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageLoading = estatesLoading || loading;

  const content = useMemo(() => {
    if (!estateId) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-muted/20">
          Select an estate to view expense heads.
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
        detailBasePath="/dashboard/company/expenses"
        estateId={estateId}
      />
    ));
  }, [filtered, estateId, handleDelete, handleView]);

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading expenses..." />
        </div>
      )}

      <div
        className={`space-y-6${pageLoading ? " blur-sm opacity-60 pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">
              Manage expense heads across estates under{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span>
              .
            </p>
          </div>

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

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1">
              <ExpensesHeader
                showImage={false}
                title="Expenses Heads"
                estateName={estateName}
                onAddExpense={openAdd}
                actionLabel="Add Expense Head"
              />
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="font-heading text-2xl font-bold">{total}</p>
              </Card>
            </div>

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

            <Pagination
              paginationInfo={paginationInfo}
              onPageChange={handlePageChange}
              disabled={loading}
              itemLabel="expense heads"
            />
          </>
        )}

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
    </div>
  );
}
