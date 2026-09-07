"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import Image from "next/image";
import {
  ChevronDown,
  Edit,
  FileText,
  MapPin,
  MessageSquareWarning,
  Phone,
  Power,
  PowerOff,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import EditUserForm, {
  type UpdateUserDetailsData,
} from "@/components/user-mgt/edit-user-form";
import { CopyButton } from "@/components/ui/copy-button";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import { MaintenanceRequestCard } from "@/components/admin/maintenance/maintenance-request-card";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  paidByEmail,
  paidByName,
  type PaidByPerson,
} from "@/lib/paid-by";
import { cn } from "@/lib/utils";
import { normalizeAddresses, formatAddressLabel, type AddressOption } from "@/lib/address";
import type { AsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "@/redux/store";
import type { DashboardUserDetails } from "@/lib/dashboard-user-details";
import { getResidentBills } from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getBillsForAddress } from "@/redux/slice/admin/bills-mgt/bills";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import type { ResidentMeterData } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
import { getComplaintsByAddress } from "@/redux/slice/resident/maintenance/resident-complaints";
import type { ResidentComplaintItem } from "@/redux/slice/resident/maintenance/resident-complaints";
import { getVisitorsByResident } from "@/redux/slice/resident/visitor/visitor";

type DetailTab = "bills" | "complaints" | "visitors";

interface UserBillRow {
  id: string;
  billName?: string;
  frequency?: string;
  amountPaid?: number;
  status?: string;
  startDate?: string;
  nextDueDate?: string;
  lastPaymentDate?: string | null;
  paidBy?: PaidByPerson | null;
}

interface AssignedBillRow {
  id: string;
  billName?: string;
  frequency?: string;
  amountDue?: number;
  amount?: number;
  status?: string;
  compulsory?: boolean;
  startDate?: string;
  nextDueDate?: string;
  createdAt?: string;
  addressId?: string;
  addressLabel?: string;
}

function resolveEstateId(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const o = raw as { id?: string; _id?: string };
    return String(o._id || o.id || "").trim();
  }
  return "";
}

interface UserVisitorRow {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
  visitingType?: string;
  visitorCode?: string;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  createdAt?: string;
}

const BASE_TABS: { id: DetailTab; label: string }[] = [
  { id: "bills", label: "Assigned Bills" },
  { id: "complaints", label: "Complaints" },
  { id: "visitors", label: "Visitors" },
];

function getUserId(user: DashboardUserDetails | null | undefined) {
  return user?.id || user?._id || "";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatLabel(value?: string) {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(user: DashboardUserDetails) {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return (first + last).toUpperCase() || "?";
}

function getUserAddresses(user: DashboardUserDetails): AddressOption[] {
  const normalized = normalizeAddresses(
    user as unknown as Record<string, unknown>,
  );
  if (normalized.length > 0) return normalized;

  const legacy = user.addressIds ?? [];
  return legacy
    .map((raw) => ({
      id: raw.id || (raw as { _id?: string })._id || "",
      data: raw.data,
    }))
    .filter((addr) => addr.id.length > 0);
}

function normalizeMeter(data: unknown): ResidentMeterData | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as ResidentMeterData) ?? null;
  return data as ResidentMeterData;
}

function MeterNumberValue({ meterNumber }: { meterNumber: string | null }) {
  if (!meterNumber) {
    return (
      <span className="text-sm text-muted-foreground italic">Not assigned</span>
    );
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="font-mono text-sm font-semibold">{meterNumber}</span>
      <CopyButton
        value={meterNumber}
        // label="Copy"
        copiedLabel="Copied"
        title="Copy meter number"
      />
    </div>
  );
}

function DetailField({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium flex flex-wrap items-center gap-2">
        {value}
        {copyValue ? (
          <CopyButton
            value={copyValue}
            // label="Copy"
            copiedLabel="Copied"
            title={`Copy ${label.toLowerCase()}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "red" | "amber" | "blue" | "slate";
}) {
  const tones = {
    green: "bg-green-50 text-green-700 ring-green-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: ElementType;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </button>
  );
}

function UserProfileDetails({
  user,
  phoneDisplay,
  userAddresses,
  meterByAddressId,
}: {
  user: DashboardUserDetails;
  phoneDisplay: string;
  userAddresses: AddressOption[];
  meterByAddressId: Record<string, string | null>;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-primary" />
            Personal details
          </h2>
          <DetailField label="First name" value={user.firstName || "—"} />
          <DetailField label="Last name" value={user.lastName || "—"} />
          <DetailField label="Gender" value={formatLabel(user.gender)} />
          <DetailField
            label="Email"
            value={user.email || "—"}
            copyValue={user.email || undefined}
          />
          {user.role?.toLowerCase() === "resident" ? (
            <DetailField
              label="Resident type"
              value={formatLabel(user.residentType)}
            />
          ) : null}
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Phone className="h-4 w-4 text-primary" />
            Contact & account
          </h2>
          <DetailField
            label="Phone"
            value={phoneDisplay}
            copyValue={phoneDisplay !== "—" ? phoneDisplay : undefined}
          />
          {user.address ? (
            <DetailField label="Address" value={user.address} />
          ) : null}
          <DetailField
            label="Invitation"
            value={formatLabel(user.invitationStatus) || "—"}
          />
          {user.isActive === false ? (
            <>
              <DetailField
                label="Suspension reason"
                value={user.suspensionReason?.trim() || "—"}
              />
              <DetailField
                label="Suspended at"
                value={formatDateTime(user.suspendedAt)}
              />
            </>
          ) : null}
          {user.serviceCharge != null ? (
            <DetailField
              label="Service charge"
              value={user.serviceCharge ? "Yes" : "No"}
            />
          ) : null}
          <DetailField
            label="Member since"
            value={formatDateTime(user.createdAt)}
          />
          <DetailField
            label="Last updated"
            value={formatDateTime(user.updatedAt)}
          />
        </div>
      </div>

      {userAddresses.length > 0 ? (
        <div className="mt-6 border-t border-border pt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Addresses linked to this user
          </h2>
          <div className="grid grid-cols-1">
            {userAddresses.map((addr, index) => (
              <div key={addr.id || index} className="rounded-lg border p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Address {index + 1}
                </p>
                <dl className="space-y-1">
                  {Object.entries(addr.data ?? {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <dt className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </dt>
                      <dd className="font-medium text-right">{val || "—"}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-t border-border/60 pt-2 mt-2 text-sm">
                    <dt className="text-muted-foreground">Meter number</dt>
                    <dd className="text-right">
                      <MeterNumberValue
                        meterNumber={meterByAddressId[addr.id] ?? null}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

type UserIdThunk = AsyncThunk<unknown, string, object>;
type SuspendUserThunk = AsyncThunk<
  unknown,
  { id: string; reason: string },
  object
>;
type ActivateUserThunk = AsyncThunk<
  unknown,
  { id: string; note: string },
  object
>;
type UpdateUserThunk = AsyncThunk<
  unknown,
  { id: string; data: UpdateUserDetailsData },
  object
>;

export type UserMgtActions = {
  getUser: UserIdThunk;
  activateUser: ActivateUserThunk;
  suspendUser: SuspendUserThunk;
  deleteUser: UserIdThunk;
  updateUser?: UpdateUserThunk;
};

export interface UserDetailViewProps {
  userId: string;
  user: DashboardUserDetails | null;
  userLoading: boolean;
  listPath: string;
  actions: UserMgtActions;
}

export default function UserDetailView({
  userId,
  user,
  userLoading,
  listPath,
  actions,
}: UserDetailViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authEstateId = useSelector((state: RootState) =>
    resolveEstateId(state.auth.user?.estateId),
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("bills");
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [bills, setBills] = useState<UserBillRow[]>([]);
  const [assignedBills, setAssignedBills] = useState<AssignedBillRow[]>([]);
  const [estateId, setEstateId] = useState(authEstateId);
  const [complaints, setComplaints] = useState<ResidentComplaintItem[]>([]);
  const [meterByAddressId, setMeterByAddressId] = useState<
    Record<string, string | null>
  >({});
  const [visitors, setVisitors] = useState<UserVisitorRow[]>([]);
  const [visitorsTotal, setVisitorsTotal] = useState(0);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  );

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      await dispatch(actions.getUser(userId)).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  }, [actions, dispatch, userId]);

  const userAddresses = useMemo(
    () => (user ? getUserAddresses(user) : []),
    [user],
  );

  useEffect(() => {
    if (authEstateId) {
      setEstateId(authEstateId);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await dispatch(getSignedInUser()).unwrap();
        const data = (res?.data ?? res) as Record<string, unknown>;
        const resolved = resolveEstateId(data?.estateId);
        if (!cancelled && resolved) setEstateId(resolved);
      } catch {
        // non-blocking: assigned bills need estateId
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authEstateId, dispatch]);

  const fetchRelatedData = useCallback(async () => {
    if (!user) return;
    const uid = getUserId(user);
    const addresses = getUserAddresses(user);
    const resolvedEstateId =
      estateId ||
      resolveEstateId(
        (user as DashboardUserDetails & { estateId?: unknown }).estateId,
      );

    setRelatedLoading(true);
    try {
      const billPromise = uid
        ? dispatch(
            getResidentBills({ residentId: uid, page: 1, limit: 100 }),
          ).unwrap()
        : Promise.resolve({ data: [] });

      const assignedBillPromises =
        resolvedEstateId && addresses.length > 0
          ? addresses.map(async (addr) => {
              try {
                const res = await dispatch(
                  getBillsForAddress({
                    addressId: addr.id,
                    estateId: resolvedEstateId,
                    page: 1,
                    limit: 100,
                  }),
                ).unwrap();
                const label = formatAddressLabel(addr);
                return ((res?.data ?? []) as Record<string, unknown>[]).map(
                  (bill, i) => ({
                    id: String(
                      bill.id ?? bill._id ?? bill.billId ?? `${addr.id}-${i}`,
                    ),
                    billName: (bill.billName ?? bill.name) as
                      | string
                      | undefined,
                    frequency: bill.frequency as string | undefined,
                    amountDue: bill.amountDue as number | undefined,
                    amount: bill.amount as number | undefined,
                    status: bill.status as string | undefined,
                    compulsory: Boolean(bill.compulsory),
                    startDate: bill.startDate as string | undefined,
                    nextDueDate: bill.nextDueDate as string | undefined,
                    createdAt: bill.createdAt as string | undefined,
                    addressId: addr.id,
                    addressLabel: label,
                  }),
                );
              } catch {
                return [] as AssignedBillRow[];
              }
            })
          : [];

      const complaintPromises = addresses.map(async (addr) => {
        try {
          const res = await dispatch(
            getComplaintsByAddress({ addressId: addr.id, page: 1, limit: 100 }),
          ).unwrap();
          return (res?.data ?? []) as ResidentComplaintItem[];
        } catch {
          return [];
        }
      });

      const meterPromises = addresses.map(async (addr) => {
        try {
          const res = await dispatch(
            getMeterByAddress({ addressId: addr.id }),
          ).unwrap();
          const meter = normalizeMeter(res?.data);
          return [addr.id, meter?.meterNumber ?? null] as const;
        } catch {
          return [addr.id, null] as const;
        }
      });

      const visitorPromise = uid
        ? dispatch(
            getVisitorsByResident({
              residentId: uid,
              page: 1,
              limit: 100,
            }),
          )
            .unwrap()
            .catch(() => ({ data: [], pagination: { total: 0 } }))
        : Promise.resolve({ data: [], pagination: { total: 0 } });

      const [
        billsRes,
        assignedGroups,
        complaintGroups,
        meterEntries,
        visitorRes,
      ] = await Promise.all([
        billPromise,
        Promise.all(assignedBillPromises),
        Promise.all(complaintPromises),
        Promise.all(meterPromises),
        visitorPromise,
      ]);

      setBills(
        (billsRes?.data ?? []).map(
          (bill: Record<string, unknown>, i: number) => ({
            id: String(bill.id ?? bill._id ?? bill.billId ?? i),
            billName: (bill.billName ?? bill.name) as string | undefined,
            frequency: bill.frequency as string | undefined,
            amountPaid: bill.amountPaid as number | undefined,
            status: bill.status as string | undefined,
            startDate: bill.startDate as string | undefined,
            nextDueDate: bill.nextDueDate as string | undefined,
            lastPaymentDate: bill.lastPaymentDate as string | null | undefined,
            paidBy: (bill.paidBy as PaidByPerson | null | undefined) ?? null,
          }),
        ),
      );

      const assignedSeen = new Set<string>();
      setAssignedBills(
        assignedGroups.flat().filter((bill) => {
          if (!bill.id || assignedSeen.has(bill.id)) return false;
          assignedSeen.add(bill.id);
          return true;
        }),
      );

      setMeterByAddressId(Object.fromEntries(meterEntries));

      const seen = new Set<string>();
      const merged = complaintGroups.flat().filter((c) => {
        const id = c.id || c._id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setComplaints(merged);

      const visitorRows = (
        (visitorRes?.data ?? []) as Record<string, unknown>[]
      ).map((v, index) => ({
        id: String(v.id ?? v._id ?? index),
        firstName: v.firstName as string | undefined,
        lastName: v.lastName as string | undefined,
        phone: v.phone as string | undefined,
        purpose: v.purpose as string | undefined,
        visitingType: v.visitingType as string | undefined,
        visitorCode: (v.visitorCode ?? v.code) as string | undefined,
        checkinTime: (v.checkinTime ?? v.checkInTime) as
          | string
          | null
          | undefined,
        checkoutTime: (v.checkoutTime ?? v.checkOutTime) as
          | string
          | null
          | undefined,
        createdAt: v.createdAt as string | undefined,
      }));
      setVisitors(visitorRows);
      setVisitorsTotal(
        Number(
          (visitorRes as { pagination?: { total?: number } })?.pagination
            ?.total ?? visitorRows.length,
        ),
      );
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setRelatedLoading(false);
    }
  }, [dispatch, estateId, user]);

  useEffect(() => {
    fetchRelatedData().catch(() => {});
  }, [fetchRelatedData]);

  const tabs = BASE_TABS;

  const displayName = useMemo(() => {
    if (!user) return "User";
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return name || user.email || "User";
  }, [user]);

  const phoneDisplay = useMemo(() => {
    if (!user) return "—";
    const code = user.countryCode?.trim();
    const number = user.phoneNumber?.trim();
    if (code && number) return `${code} ${number}`;
    return number || code || "—";
  }, [user]);

  const handleActivateConfirm = async (note: string) => {
    const id = getUserId(user);
    if (!id) return;
    setActivateSubmitting(true);
    try {
      await dispatch(actions.activateUser({ id, note })).unwrap();
      toast.success(`${displayName} has been activated.`);
      setActivateOpen(false);
      await fetchUser();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setActivateSubmitting(false);
    }
  };

  const handleSuspendConfirm = async (reason: string) => {
    const id = getUserId(user);
    if (!id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(actions.suspendUser({ id, reason })).unwrap();
      toast.info(`${displayName} has been suspended.`);
      setSuspendOpen(false);
      await fetchUser();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleDelete = () => {
    const id = getUserId(user);
    if (!id) return;
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = getUserId(user);
    if (!id) return;
    setDeleting(true);
    try {
      await dispatch(actions.deleteUser(id)).unwrap();
      toast.success(`${displayName} deleted successfully.`);
      setDeleteOpen(false);
      router.push(listPath);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const assignedBillColumns = [
    {
      key: "createdAt",
      header: "Created",
      render: (item: AssignedBillRow) => formatDate(item.createdAt),
    },
    {
      key: "billName",
      header: "Bill Name",
      render: (item: AssignedBillRow) => item.billName || "—",
    },
    {
      key: "addressLabel",
      header: "Address",
      render: (item: AssignedBillRow) => item.addressLabel || "—",
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: AssignedBillRow) => formatLabel(item.frequency),
    },
    {
      key: "amountDue",
      header: "Amount Due",
      render: (item: AssignedBillRow) =>
        `₦${Number(item.amountDue ?? item.amount ?? 0).toLocaleString()}`,
    },
    {
      key: "compulsory",
      header: "Compulsory",
      render: (item: AssignedBillRow) => (
        <StatusPill tone={item.compulsory ? "amber" : "slate"}>
          {item.compulsory ? "Yes" : "No"}
        </StatusPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: AssignedBillRow) => {
        const active = (item.status ?? "").toLowerCase() === "active";
        return (
          <StatusPill tone={active ? "green" : "red"}>
            {formatLabel(item.status) || "—"}
          </StatusPill>
        );
      },
    },
    {
      key: "nextDueDate",
      header: "Next Due",
      render: (item: AssignedBillRow) => formatDateTime(item.nextDueDate),
    },
  ];

  const billColumns = [
    { key: "billName", header: "Bill Name" },
    {
      key: "paidBy",
      header: "Paid By",
      render: (item: UserBillRow) => {
        const name = paidByName(item.paidBy);
        const email = paidByEmail(item.paidBy);
        if (!name && !email) return "—";
        return (
          <div className="min-w-0">
            <p className="truncate">{name || email}</p>
            {name && email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: UserBillRow) => formatLabel(item.frequency),
    },
    {
      key: "amountPaid",
      header: "Amount Paid",
      render: (item: UserBillRow) =>
        `₦${Number(item.amountPaid ?? 0).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: UserBillRow) => {
        const paid =
          (item.status ?? "").toLowerCase() === "paid" ||
          Number(item.amountPaid ?? 0) > 0;
        return (
          <StatusPill tone={paid ? "green" : "amber"}>
            {formatLabel(item.status) || (paid ? "Paid" : "Pending")}
          </StatusPill>
        );
      },
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: UserBillRow) => formatDateTime(item.startDate),
    },
    {
      key: "nextDueDate",
      header: "Next Due",
      render: (item: UserBillRow) => formatDateTime(item.nextDueDate),
    },
    {
      key: "lastPaymentDate",
      header: "Last Payment",
      render: (item: UserBillRow) =>
        formatDateTime(item.lastPaymentDate ?? undefined),
    },
  ];

  const visitorColumns = [
    {
      key: "createdAt",
      header: "Created",
      render: (item: UserVisitorRow) => formatDateTime(item.createdAt),
    },
    {
      key: "name",
      header: "Visitor",
      render: (item: UserVisitorRow) =>
        `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "—",
    },
    {
      key: "phone",
      header: "Phone",
      render: (item: UserVisitorRow) => item.phone || "—",
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (item: UserVisitorRow) => item.purpose || "—",
    },
    {
      key: "visitingType",
      header: "Type",
      render: (item: UserVisitorRow) => formatLabel(item.visitingType),
    },
    {
      key: "visitorCode",
      header: "Code",
      render: (item: UserVisitorRow) => (
        <span className="font-mono text-xs">{item.visitorCode || "—"}</span>
      ),
    },
    {
      key: "checkinTime",
      header: "Check-in",
      render: (item: UserVisitorRow) =>
        formatDateTime(item.checkinTime ?? undefined),
    },
    {
      key: "checkoutTime",
      header: "Check-out",
      render: (item: UserVisitorRow) =>
        formatDateTime(item.checkoutTime ?? undefined),
    },
  ];

  const pageLoading = userLoading || (Boolean(user) && relatedLoading);
  const updateUser = actions.updateUser;

  return (
    <div className="relative space-y-6">
      {pageLoading && (
        <Loader
          fullScreen
          label={userLoading ? "Loading user..." : "Loading activity data..."}
        />
      )}

      <div className={pageLoading ? "pointer-events-none select-none" : ""}>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
            <button
              type="button"
              aria-label="Back to user management"
              onClick={() => router.push(listPath)}
              className="grid h-10 w-10 shrink-0 place-items-center self-start rounded-full bg-[#F2F2F2] hover:opacity-80 cursor-pointer"
            >
              <Image src="/arrow.svg" alt="" width={20} height={20} />
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                {user ? (
                  <>
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={displayName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground sm:h-12 sm:w-12">
                        {getInitials(user)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h1 className="font-heading text-lg font-bold break-words sm:text-xl lg:text-2xl">
                        {displayName}
                      </h1>
                      <p className="mt-0.5 text-sm text-muted-foreground break-all">
                        {user.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusPill tone={user.isActive ? "green" : "red"}>
                          {user.isActive ? "Active" : "Suspended"}
                        </StatusPill>
                        <StatusPill tone="blue">
                          {formatLabel(user.role)}
                        </StatusPill>
                      </div>
                    </div>
                  </>
                ) : (
                  <h1 className="font-heading text-lg font-bold sm:text-xl">
                    User Details
                  </h1>
                )}
              </div>

              {user ? (
                <div className="relative w-full shrink-0 lg:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      aria-expanded={profileOpen}
                      aria-label={
                        profileOpen
                          ? "Hide profile details"
                          : "Show profile details"
                      }
                      onClick={() => setProfileOpen((open) => !open)}
                    >
                      <User className="h-4 w-4" />
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          profileOpen && "rotate-180",
                        )}
                      />
                    </Button>

                    {updateUser ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={actionLoading}
                        onClick={() => setEditing(true)}
                        title="Edit user details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : null}

                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={actionLoading}
                        onClick={() => setSuspendOpen(true)}
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={actionLoading}
                        onClick={() => setActivateOpen(true)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      disabled={actionLoading}
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {profileOpen ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg sm:left-auto sm:right-0 sm:w-[min(calc(100vw-2rem),40rem)]">
                      <UserProfileDetails
                        user={user}
                        phoneDisplay={phoneDisplay}
                        userAddresses={userAddresses}
                        meterByAddressId={meterByAddressId}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {!userLoading && !user ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">User not found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(listPath)}
            >
              Back to users
            </Button>
          </Card>
        ) : null}

        {user ? (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-1 gap-3 pt-8 sm:grid-cols-3">
              <SummaryCard
                label="Assigned Bills"
                value={assignedBills.length}
                icon={FileText}
                active={activeTab === "bills"}
                onClick={() => setActiveTab("bills")}
              />
              <SummaryCard
                label="Complaints"
                value={complaints.length}
                icon={MessageSquareWarning}
                active={activeTab === "complaints"}
                onClick={() => setActiveTab("complaints")}
              />
              <SummaryCard
                label="Visitors"
                value={visitorsTotal || visitors.length}
                icon={Users}
                active={activeTab === "visitors"}
                onClick={() => setActiveTab("visitors")}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-border pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.label}
                  {tab.id === "bills" && assignedBills.length > 0
                    ? ` (${assignedBills.length})`
                    : ""}
                  {tab.id === "complaints" && complaints.length > 0
                    ? ` (${complaints.length})`
                    : ""}
                  {tab.id === "visitors" &&
                  (visitorsTotal || visitors.length) > 0
                    ? ` (${visitorsTotal || visitors.length})`
                    : ""}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "bills" ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">Assigned Bills</h3>
                  <Table
                    columns={assignedBillColumns}
                    data={assignedBills}
                    emptyMessage="No bills assigned to this user's addresses."
                  />
                </Card>
                <Card className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">Payment History</h3>
                  <Table
                    columns={billColumns}
                    data={bills}
                    emptyMessage="No paid bills found for this user."
                  />
                </Card>
              </div>
            ) : null}

            {activeTab === "complaints" ? (
              <div className="space-y-3">
                {complaints.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    No complaints submitted by this user.
                  </Card>
                ) : (
                  complaints.map((complaint) => {
                    const id = complaint.id || complaint._id || "";
                    return (
                      <MaintenanceRequestCard
                        key={id}
                        complaint={complaint}
                        isSelected={selectedComplaintId === id}
                        onSelect={() =>
                          setSelectedComplaintId((prev) =>
                            prev === id ? null : id,
                          )
                        }
                      />
                    );
                  })
                )}
              </div>
            ) : null}

            {activeTab === "visitors" ? (
              <Card className="p-4">
                <Table
                  columns={visitorColumns}
                  data={visitors}
                  emptyMessage="No visitors found for this user."
                />
              </Card>
            ) : null}
          </>
        ) : null}
      </div>

      {editing && updateUser ? (
        <Modal visible={editing} onClose={() => setEditing(false)}>
          <EditUserForm
            userId={userId}
            close={() => setEditing(false)}
            fetchUser={(id) => dispatch(actions.getUser(id)).unwrap()}
            saveUser={(id, data) =>
              dispatch(updateUser({ id, data })).unwrap()
            }
            onUpdated={() => {
              fetchUser().catch(() => {});
            }}
          />
        </Modal>
      ) : null}

      <SuspendRentModal
        visible={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        tenantName={displayName}
        title="Suspend user"
        confirmLabel="Suspend"
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="e.g. Outstanding service charge / policy violation"
        description={
          <>
            Are you sure you want to suspend <strong>{displayName}</strong>?
            Please provide a reason.
          </>
        }
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />

      <SuspendRentModal
        visible={activateOpen}
        onClose={() => setActivateOpen(false)}
        tenantName={displayName}
        title="Activate user"
        confirmLabel="Activate"
        requireReason
        reasonLabel="Note"
        reasonPlaceholder="e.g. Service charge settled — account restored"
        description={
          <>
            Are you sure you want to activate <strong>{displayName}</strong>?
            Please add a short note.
          </>
        }
        onConfirm={handleActivateConfirm}
        loading={activateSubmitting}
      />

      <DeleteModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        itemName={displayName}
        title="Delete user"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
