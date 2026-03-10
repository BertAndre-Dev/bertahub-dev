// app/admin/maintenance/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getComplaintsByEstate } from "@/redux/slice/admin/maintenance/complaints";
import type { ComplaintItem } from "@/redux/slice/admin/maintenance/complaints-slice";
import type { SignedInUser } from "@/types/user";
import {
  StatusTabs,
  FilterBar,
  MaintenanceRequestCard,
  type MaintenanceStatusValue,
} from "@/components/admin/maintenance";
import { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("");
  const [statusTab, setStatusTab] = useState<MaintenanceStatusValue>("all");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { complaints, loading, pagination } = useSelector(
    (state: RootState) => {
      const c = state.complaints as {
        complaintsByEstate?: {
          data: ComplaintItem[];
          pagination?: {
            total: number;
            page: number;
            limit: number;
            pages?: number;
          };
        } | null;
        getComplaintsByEstateStatus?: string;
      };
      return {
        complaints: c?.complaintsByEstate?.data ?? [],
        loading: c?.getComplaintsByEstateStatus === "isLoading",
        pagination: c?.complaintsByEstate?.pagination ?? null,
      };
    },
  );

  const list = useMemo(
    () => (Array.isArray(complaints) ? complaints : []),
    [complaints],
  );

  const filtered = useMemo(() => {
    return list.filter((item: ComplaintItem) => {
      const statusMatch =
        statusTab === "all" ||
        (item.status || "").toLowerCase() === statusTab.toLowerCase();
      const priorityMatch =
        !priority ||
        (item.priority || "").toLowerCase() === priority.toLowerCase();
      const categoryMatch =
        !category ||
        (item.category || "").toLowerCase().includes(category.toLowerCase());
      const searchMatch =
        !search.trim() ||
        (item.ticketNumber || String(item.id ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      return statusMatch && priorityMatch && categoryMatch && searchMatch;
    });
  }, [list, statusTab, priority, category, search]);

  // Fetch signed-in user and extract estate info
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as SignedInUser | undefined;
        const estate = user?.estateId;

        if (!estate?.id) {
          toast.warning("No estate found for this user.");
          return;
        }

        setEstateId(estate.id);
        setEstateName(estate.name ?? "Estate");
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message ?? "Failed to load user.",
        );
      }
    })();
  }, [dispatch]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchDebounced, statusTab, priority, category]);

  // Fetch complaints whenever estate or page changes
  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getComplaintsByEstate({
        estateId,
        page,
        limit: PAGE_SIZE,
        search: searchDebounced.trim() || undefined,
      }),
    ).catch((err: unknown) =>
      toast.error(
        (err as { message?: string })?.message ?? "Failed to load complaints.",
      ),
    );
  }, [estateId, dispatch, page, searchDebounced]);

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Maintenance Request</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName || "..."}
          </span>
          .
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Maintenance Requests
              </p>
              <p className="font-heading text-2xl font-bold mt-2">{total}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#D0DFF280]">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white mb-4 p-4 rounded-lg">
        <StatusTabs value={statusTab} onChange={setStatusTab} />
      </div>

      <FilterBar
        category={category}
        search={search}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
      />

      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground py-8 text-center">
            Loading maintenance requests...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center rounded-lg border border-border bg-muted/20">
            No maintenance requests found.
          </p>
        ) : (
          filtered.map((complaint: ComplaintItem) => (
            <MaintenanceRequestCard
              key={complaint.id}
              complaint={complaint}
              estateName={estateName}
              isSelected={selectedId === complaint.id}
              onSelect={() =>
                setSelectedId((prev) =>
                  prev === complaint.id ? null : complaint.id,
                )
              }
            />
          ))
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
