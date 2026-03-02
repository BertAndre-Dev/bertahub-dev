"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { SecurityVisitorItem } from "@/redux/slice/security/visitor/visitor-slice";
import Table from "@/components/tables/list/page";

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAddressDisplay(addressId: SecurityVisitorItem["addressId"]) {
  if (!addressId?.data) return "—";
  const parts = Object.values(addressId.data).filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function ActivityLogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { allVisitors, loading } = useSelector((state: RootState) => {
    const v = state.securityVisitor;
    return {
      allVisitors: v?.allVisitors ?? null,
      loading: v?.getAllVisitorsStatus === "isLoading",
    };
  });

  const list = useMemo(() => allVisitors?.data ?? [], [allVisitors?.data]);
  const rawPagination = allVisitors?.pagination;
  const pagination = useMemo(() => {
    if (!rawPagination) return undefined;
    const total = rawPagination.total ?? list.length;
    const limit = rawPagination.limit ?? 10;
    const page = rawPagination.page ?? 1;
    const totalPages = (rawPagination as { totalPages?: number }).totalPages ?? Math.ceil(Math.max(total, 1) / limit);
    return { ...rawPagination, total, limit, page, totalPages };
  }, [rawPagination, list.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((row: SecurityVisitorItem) => {
      const resident = row.residentId
        ? `${row.residentId.firstName} ${row.residentId.lastName}`.toLowerCase()
        : "";
      const visitor = `${row.firstName} ${row.lastName}`.toLowerCase();
      const purpose = (row.purpose ?? "").toLowerCase();
      const address = getAddressDisplay(row.addressId).toLowerCase();
      return [resident, visitor, purpose, address].some((s) => s.includes(q));
    });
  }, [list, search]);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const foundEstateId =
          userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";

        if (!foundEstateId) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(foundEstateId);
        await dispatch(
          getAllVisitors({ estateId: foundEstateId, page: 1, limit: 10 }),
        ).unwrap();
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load visitors");
      }
    })();
  }, [dispatch]);

  const onPageChange = (page: number) => {
    if (!estateId) return;
    dispatch(
      getAllVisitors({ estateId, page, limit: pagination?.limit ?? 10 }),
    ).catch((err: any) => toast.error(err?.message ?? "Failed to load page"));
  };

  let cardDescription = "Loading...";
  if (pagination) {
    cardDescription = search.trim()
      ? `${filtered.length} matching on this page`
      : `${pagination.total} total entries`;
  }

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Date",
        render: (row: SecurityVisitorItem) => formatDate(row.createdAt),
      },
      {
        key: "visitorName",
        header: "Visitor Name",
        render: (row: SecurityVisitorItem) =>
          `${row.firstName} ${row.lastName}`,
      },
      {
        key: "residentName",
        header: "Resident Name",
        render: (row: SecurityVisitorItem) =>
          row.residentId
            ? `${row.residentId.firstName} ${row.residentId.lastName}`
            : "—",
      },
      {
        key: "phone",
        header: "Phone",
        render: (row: SecurityVisitorItem) => row.phone ?? "N/A",
      },
      {
        key: "address",
        header: "Address",
        render: (row: SecurityVisitorItem) => getAddressDisplay(row.addressId),
      },
      {
        key: "purpose",
        header: "Purpose",
        render: (row: SecurityVisitorItem) => row.purpose ?? "N/A",
      },
      {
        key: "visitorCode",
        header: "Visitor Code",
        render: (row: SecurityVisitorItem) => row.visitorCode ?? "N/A",
      },
      {
        key: "viewedBy",
        header: "Viewed By",
        render: (row: SecurityVisitorItem) => row.viewedBy?.firstName ?? "N/A",
      },
      {
        key: "verifiedBy",
        header: "Verified By",
        render: (row: SecurityVisitorItem) => row.verifiedBy?.firstName ?? "N/A",
      },
      {
        key: "isVerified",
        header: "Status",
        render: (row: SecurityVisitorItem) => (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              row.isVerified
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {row.isVerified ? "Verified" : "Not verified"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Welcome back! View all visitors and activity for your estate.
        </p>
      </div>

      <Card className="p-4">
        <input
          type="text"
          placeholder="Search resident, visitor, purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)} // ✅ search fixed
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Visitor records</CardTitle>
          <CardDescription className="text-sm">
            {cardDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table<SecurityVisitorItem>
            columns={columns}
            data={filtered}
            emptyMessage={
              loading ? "Loading visitors..." : "No visitors found."
            }
            showPagination={!!pagination && (pagination.total > pagination.limit || (pagination.totalPages ?? 1) > 1)}
            paginationInfo={
              pagination
                ? {
                    total: pagination.total,
                    current: pagination.page,
                    pageSize: pagination.limit,
                  }
                : undefined
            }
            onPageChange={onPageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
