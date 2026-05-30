"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  fetchStaffMaintenanceStats,
  getStaffAssignedComplaints,
  updateStaffComplaintStatus,
} from "@/redux/slice/staff/maintenance/staff-maintenance";
import type { StaffComplaintItem } from "@/redux/slice/staff/maintenance/staff-maintenance-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import StaffMaintenanceViewModal from "./components/StaffMaintenanceViewModal";
import {
  STAFF_CATEGORY_FILTER_OPTIONS,
  STAFF_STATUS_FILTER_OPTIONS,
  STAFF_STATUS_OPTIONS,
  formatAssignedOn,
  formatCategoryLabel,
  getAddressDisplay,
  getGreetingName,
  getInitials,
  getResidentImage,
  getResidentName,
  getStatusStyle,
  getTicketDisplay,
} from "./lib/format";

const PAGE_SIZE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function matchesSearch(item: StaffComplaintItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const ticket = getTicketDisplay(item).toLowerCase();
  const title = (item.title ?? "").toLowerCase();
  const requester = getResidentName(item).toLowerCase();
  return ticket.includes(q) || title.includes(q) || requester.includes(q);
}

function matchesCategory(item: StaffComplaintItem, category: string) {
  if (!category) return true;
  return (item.category ?? "").trim().toLowerCase() === category.toLowerCase();
}

export default function StaffMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [firstName, setFirstName] = useState("");
  const [estateName, setEstateName] = useState("Estate");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewComplaintId, setViewComplaintId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const searchDebounced = useDebounce(search, 400);

  const { complaints, pagination, stats, loading, updatingStatus } =
    useSelector((state: RootState) => {
      const maintenance = state.staffMaintenance;
      return {
        complaints: maintenance.assignedComplaints?.data ?? [],
        pagination: maintenance.assignedComplaints?.pagination ?? null,
        stats: maintenance.stats,
        loading: maintenance.getComplaintsByStaffStatus === "isLoading",
        updatingStatus:
          maintenance.updateComplaintStatusStatus === "isLoading",
      };
    });

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;

        const rawEstate = data.estateId ?? data.estate;
        let estateLabel = "Estate";
        if (typeof rawEstate === "object" && rawEstate) {
          estateLabel =
            (rawEstate as { name?: string }).name ??
            (data.estateName as string) ??
            "Estate";
        } else if (typeof data.estateName === "string") {
          estateLabel = data.estateName;
        }

        setFirstName(String(data.firstName ?? ""));
        setEstateName(estateLabel);
      } catch {
        toast.error("Failed to load your profile.");
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchStaffMaintenanceStats()).unwrap().catch(() => null),
      dispatch(
        getStaffAssignedComplaints({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
        }),
      ).unwrap(),
    ]).catch((err: unknown) =>
      toast.error(
        (err as { message?: string })?.message ??
          "Failed to load maintenance requests.",
      ),
    );
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, statusFilter, categoryFilter]);

  useEffect(() => {
    if (bootstrapping) return;
    refreshData().catch(() => {});
  }, [bootstrapping, refreshData]);

  const handleStatusChange = async (
    complaint: StaffComplaintItem,
    newStatus: string,
  ) => {
    if (newStatus === complaint.status) return;
    try {
      await dispatch(
        updateStaffComplaintStatus({ id: complaint.id, status: newStatus }),
      ).unwrap();
      toast.success("Status updated");
      dispatch(fetchStaffMaintenanceStats()).catch(() => {});
      await refreshData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to update status",
      );
    }
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter(
        (item) =>
          matchesSearch(item, searchDebounced) &&
          matchesCategory(item, categoryFilter),
      ),
    [complaints, searchDebounced, categoryFilter],
  );

  const statCards = useMemo(
    () => [
      {
        label: "Assigned to me",
        value: stats.assigned,
        iconClass: "bg-[#D0DFF280] text-[#2563EB]",
      },
      {
        label: "In Progress",
        value: stats.inProgress,
        iconClass: "bg-[#FFEDD580] text-[#EA580C]",
      },
      {
        label: "Completed",
        value: stats.completed,
        iconClass: "bg-[#DCFCE780] text-[#16A34A]",
      },
      {
        label: "Overdue",
        value: stats.overdue,
        iconClass: "bg-[#FEE2E280] text-[#DC2626]",
      },
    ],
    [stats],
  );

  const columns = [
    {
      key: "title",
      header: "Request Title",
      render: (item: StaffComplaintItem) => (
        <div>
          <p className="font-medium text-foreground">
            {item.title || "Maintenance Request"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getTicketDisplay(item)}
          </p>
        </div>
      ),
      exportValue: (item: StaffComplaintItem) =>
        `${item.title || "Maintenance Request"} (${getTicketDisplay(item)})`,
    },
    {
      key: "category",
      header: "Category",
      render: (item: StaffComplaintItem) => formatCategoryLabel(item.category),
      exportValue: (item: StaffComplaintItem) =>
        formatCategoryLabel(item.category),
    },
    {
      key: "location",
      header: "Location",
      render: (item: StaffComplaintItem) => getAddressDisplay(item),
      exportValue: (item: StaffComplaintItem) => getAddressDisplay(item),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      render: (item: StaffComplaintItem) => {
        const name = getResidentName(item);
        const image = getResidentImage(item);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(name)
              )}
            </div>
            <span>{name}</span>
          </div>
        );
      },
      exportValue: (item: StaffComplaintItem) => getResidentName(item),
    },
    {
      key: "status",
      header: "Status",
      render: (item: StaffComplaintItem) => (
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(item, e.target.value)}
          disabled={updatingStatus}
          aria-label={`Update status for ${item.title || "maintenance request"} (${getTicketDisplay(item)})`}
          className={`min-w-[140px] rounded-full px-3 py-1.5 text-xs font-semibold border-0 cursor-pointer ${getStatusStyle(item.status)}`}
        >
          {STAFF_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
      exportable: false,
    },
    {
      key: "assignedOn",
      header: "Assigned On",
      render: (item: StaffComplaintItem) =>
        formatAssignedOn(item.updatedAt || item.createdAt),
      exportValue: (item: StaffComplaintItem) =>
        formatAssignedOn(item.updatedAt || item.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: StaffComplaintItem) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF]"
          onClick={() => setViewComplaintId(item.id)}
        >
          View
        </Button>
      ),
      exportable: false,
    },
  ];

  const total = pagination?.total ?? 0;
  const pageLoading = bootstrapping || loading;

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading maintenance requests..." />
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
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {getGreetingName(firstName)}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your overview of assigned maintenance tasks in{" "}
            <span className="font-bold uppercase underline text-foreground">
              {estateName}
            </span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-3xl font-bold mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconClass}`}>
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name or ticket ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Select
              options={STAFF_STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="lg:max-w-[220px] rounded-xl"
            />
            <Select
              options={STAFF_CATEGORY_FILTER_OPTIONS}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="lg:max-w-[220px] rounded-xl"
            />
          </div>

          <Table
            columns={columns}
            data={filteredComplaints}
            emptyMessage="No maintenance requests assigned to you yet."
            showPagination
            paginationInfo={{
              total,
              current: page,
              pageSize: PAGE_SIZE,
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </Card>
      </div>

      <StaffMaintenanceViewModal
        complaintId={viewComplaintId}
        estateName={estateName}
        onClose={() => setViewComplaintId(null)}
        onUpdated={() => {
          dispatch(fetchStaffMaintenanceStats()).catch(() => {});
        }}
      />
    </div>
  );
}
