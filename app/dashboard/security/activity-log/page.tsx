"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { SecurityVisitorItem } from "@/redux/slice/security/visitor/visitor-slice";
import {
  setSecurityEstateId,
  setSecurityVerificationContext,
} from "@/redux/slice/security/visitor/visitor-slice";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Eye } from "lucide-react";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getVerificationFlags,
  resolveVisitorVerificationDescription,
  resolveVisitorVerificationMode,
} from "@/lib/visitor-verification-mode";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { readStoredAuth } from "@/utils/auth-storage";
import { VisitorActivityDetailsModal } from "@/components/security/VisitorActivityDetailsModal";

const DATE_RANGE_PLACEHOLDERS = getDateRangePlaceholders();
const PAGE_LIMIT = 10;

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

function personName(
  person?: { firstName?: string; lastName?: string } | null,
) {
  if (!person) return "N/A";
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || "N/A";
}

export default function ActivityLogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [viewingVisitor, setViewingVisitor] =
    useState<SecurityVisitorItem | null>(null);

  const authUser = useSelector((state: RootState) => state.auth.user);

  const { allVisitors, listPending, estateId, visitorVerificationMode } =
    useSelector((state: RootState) => {
      const v = state.securityVisitor;
      return {
        allVisitors: v?.allVisitors ?? null,
        listPending: isPending(v?.getAllVisitorsStatus),
        estateId: v?.estateId ?? null,
        visitorVerificationMode:
          v?.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      };
    });
  const loading = bootstrapping || (Boolean(estateId) && listPending);

  const verificationFlags = useMemo(
    () => getVerificationFlags(visitorVerificationMode),
    [visitorVerificationMode],
  );

  const list = useMemo(() => allVisitors?.data ?? [], [allVisitors?.data]);
  const rawPagination = allVisitors?.pagination;
  const pagination = useMemo(() => {
    if (!rawPagination) return undefined;
    const total = rawPagination.total ?? list.length;
    const limit = rawPagination.limit ?? PAGE_LIMIT;
    const page = rawPagination.page ?? 1;
    const totalPages =
      (rawPagination as { totalPages?: number }).totalPages ??
      Math.ceil(Math.max(total, 1) / limit);
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

  const fetchVisitors = useCallback(
    async (page = 1) => {
      if (!estateId) return;
      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getAllVisitors({
          estateId,
          page,
          limit: PAGE_LIMIT,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, startDate, endDate],
  );

  useEffect(() => {
    (async () => {
      try {
        const priorUser = (authUser ??
          readStoredAuth()?.user) as Record<string, unknown> | null;
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const rawEstateId = data?.estateId ?? data?.estate ?? null;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              "";

        const mode =
          resolveVisitorVerificationMode(data) ??
          resolveVisitorVerificationMode(priorUser) ??
          VisitorVerificationMode.VIEW_AND_VERIFY;

        dispatch(
          setSecurityVerificationContext({
            mode,
            description:
              resolveVisitorVerificationDescription(data) ??
              resolveVisitorVerificationDescription(priorUser),
            ready: true,
          }),
        );

        if (!foundEstateId) return;

        dispatch(setSecurityEstateId(foundEstateId));
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    fetchVisitors(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [estateId, fetchVisitors]);

  const onPageChange = (page: number) => {
    fetchVisitors(page).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  };

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
        render: (row: SecurityVisitorItem) =>
          row.visitorCode ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">
                {row.visitorCode}
              </span>
              <CopyButton value={row.visitorCode} title="Copy visitor code" />
            </div>
          ) : (
            "N/A"
          ),
      },
      ...(verificationFlags.showViewedBy
        ? [
            {
              key: "viewedBy",
              header: "Viewed By",
              render: (row: SecurityVisitorItem) => personName(row.viewedBy),
            },
          ]
        : []),
      ...(verificationFlags.showVerifiedBy
        ? [
            {
              key: "verifiedBy",
              header: "Verified By",
              render: (row: SecurityVisitorItem) => personName(row.verifiedBy),
            },
          ]
        : []),
      {
        key: "status",
        header: "Status",
        render: (row: SecurityVisitorItem) => {
          if (verificationFlags.viewOnly) {
            const viewed = Boolean(row.viewedBy);
            return (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  viewed
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {viewed ? "Viewed" : "Not viewed"}
              </span>
            );
          }

          const verified = Boolean(row.isVerified || row.verifiedBy);
          return (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                verified
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {verified ? "Verified" : "Not verified"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        exportable: false as const,
        render: (row: SecurityVisitorItem) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            title="View more"
            onClick={() => setViewingVisitor(row)}
          >
            <Eye className="h-4 w-4 text-[#0150AC]" />
          </Button>
        ),
      },
    ],
    [verificationFlags],
  );

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading visitors..." />}

      <div
        className={`space-y-6${loading ? " pointer-events-none select-none" : ""}`}
      >
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table<SecurityVisitorItem>
              columns={columns}
              data={filtered}
              emptyMessage="No visitors found."
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={startDate}
              endDate={endDate}
              startDatePlaceholder={DATE_RANGE_PLACEHOLDERS.start}
              endDatePlaceholder={DATE_RANGE_PLACEHOLDERS.end}
              onDateRangeChange={({
                startDate: nextStart,
                endDate: nextEnd,
              }) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
              }}
              showPagination={
                !!pagination &&
                (pagination.total > pagination.limit ||
                  (pagination.totalPages ?? 1) > 1)
              }
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

      <VisitorActivityDetailsModal
        open={Boolean(viewingVisitor)}
        item={viewingVisitor}
        onClose={() => setViewingVisitor(null)}
      />
    </div>
  );
}
