"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getComplaintsByEstate } from "@/redux/slice/admin/maintenance/complaints";
import type { ComplaintItem } from "@/redux/slice/admin/maintenance/complaints-slice";
import {
  StatusTabs,
  FilterBar,
  MaintenanceRequestCard,
  type MaintenanceStatusValue,
} from "@/components/admin/maintenance";

import { RootState, AppDispatch } from "@/redux/store";

export default function MaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("");
  const [statusTab, setStatusTab] = useState<MaintenanceStatusValue>("all");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { complaints, loading } = useSelector((state: RootState) => {
    const c = state.complaints as any;
    return {
      complaints: c?.complaints ?? null,
      loading: c?.getComplaintsByEstateStatus === "isLoading",
    };
  });

  const list = useMemo(() => complaints?.data ?? [], [complaints?.data]);

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
        (item.ticketNumber || item.id || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      return statusMatch && priorityMatch && categoryMatch && searchMatch;
    });
  }, [list, statusTab, priority, category, search]);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
        const name =
          userRes?.data?.estate?.name ?? userRes?.data?.estateName ?? "Estate";
        if (!id) {
          toast.warning("No estate found for this user.");
          return;
        }
        setEstateId(id);
        setEstateName(name);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getComplaintsByEstate({
        estateId,
        page: 1,
        limit: 20,
        search: search.trim() || undefined,
      }),
    ).catch((err: any) => toast.error(err?.message ?? "Failed to load."));
  }, [search, estateId, dispatch]);

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

      <StatusTabs value={statusTab} onChange={setStatusTab} />

      <FilterBar
        priority={priority}
        category={category}
        search={search}
        onPriorityChange={setPriority}
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
    </div>
  );
}
