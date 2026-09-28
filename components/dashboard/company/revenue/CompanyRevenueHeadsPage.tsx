"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import Select from "react-select";

import { RevenueHeader } from "@/components/dashboard/admin/revenue/RevenueHeader";
import { RevenueFiltersBar } from "@/components/dashboard/admin/revenue/RevenueFiltersBar";
import { RevenueHeadCard } from "@/components/dashboard/admin/revenue/RevenueHeadCard";
import {
  RevenueHeadModal,
  type RevenueHeadModalValues,
} from "@/components/dashboard/admin/revenue/RevenueHeadModal";
import { ViewRevenueHeadModal } from "@/components/dashboard/admin/revenue/ViewRevenueHeadModal";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  createCompanyRevenueHead,
  deleteCompanyRevenueHead,
  fetchCompanyRevenueHeads,
  fetchCompanyRevenueHeadById,
  updateCompanyRevenueHead,
  type CompanyRevenueHead,
} from "@/redux/slice/company/revenue-head/company-revenue-head";
import {
  selectCompanyRevenueHeads,
  selectCompanyRevenueHeadsError,
  selectCompanyRevenueHeadsPagination,
  setCompanyRevenueHeadEstate,
} from "@/redux/slice/company/revenue-head/company-revenue-head-slice";
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
import { isBusy, isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";

const PAGE_SIZE = 12;

type EstateSelectOption = { label: string; value: string };

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function getId(item: CompanyRevenueHead): string | undefined {
  return item.id ?? item._id;
}

export default function CompanyRevenueHeadsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectCompanyRevenueHeads(s));
  const listState = useSelector(
    (s: RootState) =>
      (s.companyRevenueHead as { listState?: string } | undefined)?.listState,
  );
  const error = useSelector((s: RootState) => selectCompanyRevenueHeadsError(s));
  const pagination = useSelector((s: RootState) =>
    selectCompanyRevenueHeadsPagination(s),
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
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRevenueHead | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CompanyRevenueHead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalValues, setModalValues] = useState<RevenueHeadModalValues>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<CompanyRevenueHead | null>(null);

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";
  const listPending = Boolean(estateId) && isPending(listState);
  const listBusy = isBusy(listState);

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
          setSelectedEstate({ label: options[0].name, value: options[0].id });
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

  useEffect(() => {
    setPage(1);
  }, [estateId, startDate, endDate]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(setCompanyRevenueHeadEstate(estateId));
    dispatch(
      fetchCompanyRevenueHeads({
        estateId,
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
  }, [dispatch, estateId, startDate, endDate, page, pageSize]);

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

  const openEdit = (item: CompanyRevenueHead) => {
    setEditing(item);
    setModalValues({
      name: item.name ?? "",
      description: item.description ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = (item: CompanyRevenueHead) => {
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
      await dispatch(deleteCompanyRevenueHead(id)).unwrap();
      toast.success("Revenue head deleted.");
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (item: CompanyRevenueHead) => {
    const id = getId(item);
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewItem(null);
    try {
      const payload = await dispatch(fetchCompanyRevenueHeadById(id)).unwrap();
      setViewItem(payload?.data ?? payload ?? null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
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
          updateCompanyRevenueHead({ id, name, description }),
        ).unwrap();
        toast.success("Revenue head updated.");
      } else {
        await dispatch(
          createCompanyRevenueHead({ estateId, name, description }),
        ).unwrap();
        toast.success("Revenue head created.");
      }
      setModalOpen(false);
      setEditing(null);
      setModalValues({ name: "", description: "" });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const total = pagination?.total ?? items.length ?? 0;

  const paginationInfo = {
    total: pagination?.total ?? items.length ?? 0,
    current: pagination?.currentPage ?? page,
    pageSize,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageLoading = estatesLoading || listPending;

  const content = useMemo(() => {
    if (!estateId) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-muted/20">
          Select an estate to view revenue heads.
        </p>
      );
    }
    if (!isSettled(listState)) {
      return null;
    }
    if (filtered.length === 0) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-muted/20">
          No revenue heads found.
        </p>
      );
    }
    return filtered.map((item) => (
      <RevenueHeadCard
        key={getId(item) ?? item.name}
        item={item}
        onView={handleView}
        onEdit={openEdit}
        onDelete={handleDelete}
        detailBasePath="/dashboard/company/revenue"
        estateId={estateId}
      />
    ));
  }, [filtered, estateId, handleDelete, handleView, listState]);

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading revenue..." />}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Revenue</h1>
            <p className="text-muted-foreground mt-1">
              Manage revenue heads across estates under{" "}
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
              <RevenueHeader
                showImage={false}
                title="Revenue Heads"
                estateName={estateName}
                onAddRevenue={openAdd}
                actionLabel="Add Revenue Head"
              />
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="font-heading text-2xl font-bold">{total}</p>
              </Card>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {content}
            </div>

            <Pagination
              paginationInfo={paginationInfo}
              onPageChange={handlePageChange}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              disabled={listBusy}
              itemLabel="revenue heads"
            />
          </>
        )}

        <RevenueHeadModal
          open={modalOpen}
          saving={saving}
          title={editing ? "Edit Revenue Head" : "Add Revenue Head"}
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

        <ViewRevenueHeadModal
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
    
        <DeleteModal
          visible={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          itemName={itemToDelete?.name ?? "this item"}
          title="Delete revenue head"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
    </div>
  );
}
