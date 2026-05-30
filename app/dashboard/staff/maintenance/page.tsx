"use client";

import { useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import {
  fetchStaffMaintenancePage,
  updateStaffComplaintStatus,
} from "@/redux/slice/staff/maintenance/staff-maintenance";
import {
  clearStaffMaintenanceSelectedComplaint,
  setStaffMaintenanceCategoryFilter,
  setStaffMaintenancePage,
  setStaffMaintenanceSearch,
  setStaffMaintenanceSelectedComplaintId,
  setStaffMaintenanceStatusFilter,
} from "@/redux/slice/staff/maintenance/staff-maintenance-slice";
import {
  selectFilteredStaffComplaints,
  selectSelectedStaffComplaint,
  selectStaffEstateName,
  selectStaffFirstName,
  selectStaffMaintenancePageLoading,
  selectStaffMaintenancePagination,
  selectStaffMaintenanceStats,
  selectStaffMaintenanceUi,
  selectStaffMaintenanceUpdatingStatus,
} from "@/redux/slice/staff/maintenance/staff-maintenance-selectors";
import type { StaffComplaintItem } from "@/redux/slice/staff/maintenance/staff-maintenance-slice";
import type { AppDispatch } from "@/redux/store";
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

export default function StaffMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();

  const ui = useSelector(selectStaffMaintenanceUi);
  const filteredComplaints = useSelector(selectFilteredStaffComplaints);
  const selectedComplaint = useSelector(selectSelectedStaffComplaint);
  const pagination = useSelector(selectStaffMaintenancePagination);
  const stats = useSelector(selectStaffMaintenanceStats);
  const pageLoading = useSelector(selectStaffMaintenancePageLoading);
  const updatingStatus = useSelector(selectStaffMaintenanceUpdatingStatus);
  const firstName = useSelector(selectStaffFirstName);
  const estateName = useSelector(selectStaffEstateName);

  const { page, pageSize, search, statusFilter, categoryFilter } = ui;

  const loadPage = useCallback(() => {
    return dispatch(fetchStaffMaintenancePage())
      .unwrap()
      .catch((err: unknown) =>
        toast.error(
          (err as { message?: string })?.message ??
            "Failed to load maintenance requests.",
        ),
      );
  }, [dispatch]);

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage, page, statusFilter]);

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
      await loadPage();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to update status",
      );
    }
  };

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
      key: "assignedOn",
      header: "Assigned On",
      render: (item: StaffComplaintItem) =>
        formatAssignedOn(item.updatedAt || item.createdAt),
      exportValue: (item: StaffComplaintItem) =>
        formatAssignedOn(item.updatedAt || item.createdAt),
    },
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
          className={`min-w-[100px] rounded-full px-3 py-1.5 text-xs font-semibold border-0 cursor-pointer ${getStatusStyle(item.status)}`}
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
      key: "actions",
      header: "Actions",
      render: (item: StaffComplaintItem) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF] cursor-pointer"
          onClick={() =>
            dispatch(setStaffMaintenanceSelectedComplaintId(item.id))
          }
        >
          View
        </Button>
      ),
      exportable: false,
    },
  ];

  const total = pagination?.total ?? 0;

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
              onChange={(e) =>
                dispatch(setStaffMaintenanceSearch(e.target.value))
              }
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Select
              options={STAFF_STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) =>
                dispatch(setStaffMaintenanceStatusFilter(e.target.value))
              }
              className="lg:max-w-[220px] rounded-xl"
            />
            <Select
              options={STAFF_CATEGORY_FILTER_OPTIONS}
              value={categoryFilter}
              onChange={(e) =>
                dispatch(setStaffMaintenanceCategoryFilter(e.target.value))
              }
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
              pageSize,
            }}
            onPageChange={(nextPage) =>
              dispatch(setStaffMaintenancePage(nextPage))
            }
          />
        </Card>
      </div>

      <StaffMaintenanceViewModal
        complaintId={ui.selectedComplaintId}
        initialComplaint={selectedComplaint}
        estateName={estateName}
        onClose={() => dispatch(clearStaffMaintenanceSelectedComplaint())}
        onUpdated={() => {
          loadPage().catch(() => {});
        }}
      />
    </div>
  );
}
