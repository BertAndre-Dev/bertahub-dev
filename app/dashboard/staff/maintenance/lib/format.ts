import type {
  StaffComplaintItem,
  StaffComplaintResident,
} from "@/redux/slice/staff/maintenance/staff-maintenance";
import { formatAddressEntryLabel } from "@/lib/address";

export const STAFF_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", className: "bg-[#D0DFF2] text-[#1E4F91]" },
  {
    value: "in progress",
    label: "In Progress",
    className: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
  {
    value: "completed",
    label: "Completed",
    className: "bg-[#DCFCE7] text-[#15803D]",
  },
  {
    value: "blocked",
    label: "Blocked",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
] as const;

export const STAFF_CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "electricity", label: "Electricity" },
  { value: "plumbing", label: "Plumbing" },
  { value: "security", label: "Security" },
  { value: "structural", label: "Structural" },
  { value: "other", label: "Other" },
];

export const STAFF_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export function getGreetingName(firstName?: string) {
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${salutation}${firstName ? ` ${firstName}` : ""},`;
}

export function formatCategoryLabel(category?: string) {
  if (!category) return "Other";
  const normalized = category.trim().toLowerCase();
  if (normalized.includes("electric")) return "Electricity";
  if (normalized.includes("plumb")) return "Plumbing";
  if (normalized.includes("security")) return "Security";
  if (normalized.includes("struct")) return "Structural";
  if (normalized.includes("other")) return "Other";
  return category
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getTicketDisplay(complaint: StaffComplaintItem) {
  if (complaint.ticketNumber) return `#${complaint.ticketNumber}`;
  const year = complaint.createdAt
    ? new Date(complaint.createdAt).getFullYear()
    : new Date().getFullYear();
  const suffix = String(complaint.id).slice(-5).toUpperCase();
  return `#MR-${year}-${suffix}`;
}

export function getResidentFromComplaint(
  complaint: StaffComplaintItem,
): StaffComplaintResident | null {
  if (complaint.resident && typeof complaint.resident === "object") {
    return complaint.resident;
  }
  const r = complaint.residentId;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    return r as StaffComplaintResident;
  }
  return null;
}

export function getResidentName(complaint: StaffComplaintItem) {
  const resident = getResidentFromComplaint(complaint);
  if (!resident) return "—";
  const name = [resident.firstName, resident.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || resident.email?.trim() || "—";
}

export function getResidentImage(complaint: StaffComplaintItem) {
  return getResidentFromComplaint(complaint)?.image;
}

function formatAddressEntryData(
  data?: Record<string, string> | Record<string, unknown>,
) {
  if (!data || typeof data !== "object") return "";
  const values = Object.values(data)
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (values.length) return values.join(", ");
  return formatAddressEntryLabel(data as Record<string, unknown>);
}

export function getAddressDisplay(complaint: StaffComplaintItem) {
  const addressId = complaint.addressId;
  if (!addressId) return "—";

  if (typeof addressId === "string") {
    return addressId.trim() || "—";
  }

  if (Array.isArray(addressId)) {
    const labels = addressId
      .map((entry) => formatAddressEntryData(entry?.data))
      .filter(Boolean);
    return labels.length ? labels.join(" · ") : "—";
  }

  const label = formatAddressEntryData(addressId.data);
  if (label) return label;
  return addressId.id ?? addressId._id ?? "—";
}

export function getResidentEmail(complaint: StaffComplaintItem) {
  return getResidentFromComplaint(complaint)?.email?.trim() || "—";
}

function hasPopulatedResident(value: StaffComplaintItem["residentId"]) {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Boolean(
      (value as StaffComplaintResident).firstName ||
        (value as StaffComplaintResident).lastName ||
        (value as StaffComplaintResident).email,
    )
  );
}

function hasPopulatedAddress(value: StaffComplaintItem["addressId"]) {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => entry?.data && Object.keys(entry.data).length > 0);
  }
  if (typeof value === "string") return false;
  return Boolean(value.data && Object.keys(value.data).length > 0);
}

/** Prefer list payload when detail fetch returns only ids for nested fields. */
export function mergeStaffComplaintDetails(
  fromList: StaffComplaintItem | null | undefined,
  fromDetail: StaffComplaintItem | null | undefined,
): StaffComplaintItem | null {
  if (!fromList && !fromDetail) return null;
  if (!fromDetail) return fromList ?? null;
  if (!fromList) return fromDetail;

  return {
    ...fromList,
    ...fromDetail,
    residentId: hasPopulatedResident(fromDetail.residentId)
      ? fromDetail.residentId
      : fromList.residentId,
    resident: fromDetail.resident ?? fromList.resident,
    addressId: hasPopulatedAddress(fromDetail.addressId)
      ? fromDetail.addressId
      : fromList.addressId,
    assignedTo:
      fromDetail.assignedTo &&
      typeof fromDetail.assignedTo === "object" &&
      !Array.isArray(fromDetail.assignedTo)
        ? fromDetail.assignedTo
        : fromList.assignedTo,
    image: fromDetail.image ?? fromList.image,
    comments: fromDetail.comments?.length
      ? fromDetail.comments
      : fromList.comments,
  };
}

export function getAssignedToName(complaint: StaffComplaintItem) {
  const assignee = complaint.assignedTo;
  if (!assignee) return "—";
  if (typeof assignee === "string") return assignee;
  const name = [assignee.firstName, assignee.lastName].filter(Boolean).join(" ");
  return name || assignee.email || "—";
}

export function getAssignedToEmail(complaint: StaffComplaintItem) {
  const assignee = complaint.assignedTo;
  if (!assignee || typeof assignee === "string") return "—";
  return assignee.email?.trim() || "—";
}

export function formatStatusLabel(status?: string) {
  const normalized = (status ?? "").trim().toLowerCase();
  const found = STAFF_STATUS_OPTIONS.find((o) => o.value === normalized);
  if (found) return found.label;
  if (!status) return "—";
  return status
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatAssignedOn(dateString?: string) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusStyle(status?: string) {
  const normalized = (status ?? "").trim().toLowerCase();
  return (
    STAFF_STATUS_OPTIONS.find((option) => option.value === normalized)
      ?.className ?? "bg-[#D0DFF2] text-[#1E4F91]"
  );
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
