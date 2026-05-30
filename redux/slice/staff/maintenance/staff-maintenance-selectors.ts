import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  getAddressDisplay,
  getResidentName,
} from "@/app/dashboard/staff/maintenance/lib/format";
import type { StaffComplaintItem } from "./staff-maintenance";

function ticketLabel(item: StaffComplaintItem) {
  if (item.ticketNumber) return `#${item.ticketNumber}`;
  const year = item.createdAt
    ? new Date(item.createdAt).getFullYear()
    : new Date().getFullYear();
  return `#MR-${year}-${String(item.id).slice(-5).toUpperCase()}`;
}

function matchesSearch(item: StaffComplaintItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    ticketLabel(item),
    item.title ?? "",
    getResidentName(item),
    getAddressDisplay(item),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesCategory(item: StaffComplaintItem, category: string) {
  if (!category) return true;
  return (item.category ?? "").trim().toLowerCase() === category.toLowerCase();
}

const selectStaffMaintenanceState = (state: RootState) => state.staffMaintenance;

export const selectStaffMaintenanceUi = createSelector(
  selectStaffMaintenanceState,
  (s) => s.ui,
);

export const selectStaffMaintenanceComplaints = createSelector(
  selectStaffMaintenanceState,
  (s) => s.assignedComplaints?.data ?? [],
);

export const selectStaffMaintenancePagination = createSelector(
  selectStaffMaintenanceState,
  (s) => s.assignedComplaints?.pagination ?? null,
);

export const selectStaffMaintenanceStats = createSelector(
  selectStaffMaintenanceState,
  (s) => s.stats,
);

export const selectStaffMaintenanceLoading = createSelector(
  selectStaffMaintenanceState,
  (s) => s.getComplaintsByStaffStatus === "isLoading",
);

export const selectStaffMaintenanceUpdatingStatus = createSelector(
  selectStaffMaintenanceState,
  (s) => s.updateComplaintStatusStatus === "isLoading",
);

export const selectStaffMaintenancePageLoading = createSelector(
  selectStaffMaintenanceState,
  selectStaffMaintenanceLoading,
  (s, loading) => !s.ui.hasInitialized || loading,
);

export const selectFilteredStaffComplaints = createSelector(
  selectStaffMaintenanceComplaints,
  selectStaffMaintenanceUi,
  (complaints, ui) =>
    complaints.filter(
      (item) =>
        matchesSearch(item, ui.search) &&
        matchesCategory(item, ui.categoryFilter),
    ),
);

export const selectSelectedStaffComplaint = createSelector(
  selectStaffMaintenanceComplaints,
  selectStaffMaintenanceUi,
  (complaints, ui) => {
    if (!ui.selectedComplaintId) return null;
    return (
      complaints.find((c) => c.id === ui.selectedComplaintId) ?? null
    );
  },
);

export const selectStaffFirstName = (state: RootState) => {
  const user = state.auth.user as Record<string, unknown> | null | undefined;
  return String(user?.firstName ?? "");
};

export const selectStaffEstateName = (state: RootState) => {
  const user = state.auth.user as Record<string, unknown> | null | undefined;
  if (!user) return "Estate";

  const rawEstate = user.estateId ?? user.estate;
  if (typeof rawEstate === "object" && rawEstate) {
    return (
      (rawEstate as { name?: string }).name ??
      (user.estateName as string) ??
      "Estate"
    );
  }
  if (typeof user.estateName === "string" && user.estateName) {
    return user.estateName;
  }
  return "Estate";
};
