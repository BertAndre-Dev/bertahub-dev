"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Power,
  PowerOff,
  Trash2,
  Plus,
  UsersRound,
  Search,
  Eye,
  Edit,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Table from "@/components/tables/list/page";
import {
  getAllUsersByEstate,
  activateUser,
  suspendUser,
  deleteUser,
  getUser,
  updateUser,
} from "@/redux/slice/admin/user-mgt/user";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import InviteUserForm from "@/components/admin/user-form/page";
import EditUserForm from "@/components/user-mgt/edit-user-form";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import Loader from "@/components/ui/Loader";
import {
  getEstateUserRoleTotalLabel,
  getUserManagementPageTitle,
  parseAdminUserRoleQuery,
  parseEstateAdminUserRoleQuery,
  type EstateUserRoleFilter,
} from "@/lib/estate-user-roles";
import {
  getAdminInviteLabel,
  isAdminInviteRole,
} from "@/lib/invite-user-roles";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { getApiErrorMessage } from "@/lib/api-error";
import { isPending } from "@/lib/async-status";
import { getDesignations } from "@/redux/slice/designations/designations";
import {
  designationLabelForUser,
  designationNamesById,
  designationWriteScope,
  DESIGNATIONS_PAGE_SIZE,
} from "@/lib/designations";
import { DesignationsManager } from "@/components/designations/DesignationsManager";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";

type AdminStaffPageTab = "staff" | "designations";

const ADMIN_STAFF_TABS: { id: AdminStaffPageTab; label: string }[] = [
  { id: "designations", label: "Designations" },
  { id: "staff", label: "Staff" },
];

function parseAdminStaffTab(raw: string | null): AdminStaffPageTab {
  return raw === "staff" ? "staff" : "designations";
}

interface AdminUserData {
  id?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  email: string;
  phoneNumber?: string;
  // Single primary address id from backend (kept for backwards compatibility)
  addressId?: string;
  // Full address objects with metadata like block & apartment
  addressIds?: {
    id: string;
    data: Record<string, string>;
  }[];
  role: string;
  residentType: string;
  serviceCharge: boolean;
  isActive?: boolean;
  invitationStatus?: string;
  designationId?: string;
  memberships?: Array<{
    designationId?: string;
    isCurrent?: boolean;
  }>;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspensionReason?: string | null;
}

interface EstateOption {
  label: string;
  value: string;
}

const DATE_RANGE_PLACEHOLDERS = getDateRangePlaceholders();

const PAGE_LIMIT = 10;

export type EstateUsersStaffPolicy = "company-only" | "estate-always";

export type EstateUsersInvitePolicy = "standard" | "none";

type Props = {
  basePath: string;
  staffPolicy: EstateUsersStaffPolicy;
  /** Estate-admin can list admins; company/estate admin pages cannot. */
  allowAdminRole?: boolean;
  /** `none` hides invite on every role page. */
  invitePolicy?: EstateUsersInvitePolicy;
};

export function EstateUsersPage({
  basePath,
  staffPolicy,
  allowAdminRole = false,
  invitePolicy = "standard",
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [open, setOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [suspendUserItem, setSuspendUserItem] = useState<AdminUserData | null>(
    null,
  );
  const [activateUserItem, setActivateUserItem] = useState<AdminUserData | null>(
    null,
  );
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roleFilter, setRoleFilter] = useState<EstateUserRoleFilter>(() =>
    (allowAdminRole
      ? parseEstateAdminUserRoleQuery
      : parseAdminUserRoleQuery)(searchParams.get("role")),
  );
  const [bootstrapping, setBootstrapping] = useState(true);
  const [designationNames, setDesignationNames] = useState<
    Record<string, string>
  >({});
  const adminCompanyId = user
    ? parseCompanyFromUser(user as Record<string, unknown>)?.id ?? ""
    : "";
  const parseRoleQuery = allowAdminRole
    ? parseEstateAdminUserRoleQuery
    : parseAdminUserRoleQuery;
  const hasCompany = Boolean(adminCompanyId);
  const isStandaloneEstate = !bootstrapping && !hasCompany;
  const staffAllowed = true;
  const canInvite =
    invitePolicy !== "none" &&
    isAdminInviteRole(roleFilter) &&
    (roleFilter !== "staff" || isStandaloneEstate);
  const canManageDesignations =
    staffPolicy === "company-only" && isStandaloneEstate;
  const requestedStaffTab = parseAdminStaffTab(searchParams.get("tab"));
  const staffTab = canManageDesignations ? requestedStaffTab : "staff";
  const showStaffTabs = roleFilter === "staff" && canManageDesignations;
  const showDesignations = showStaffTabs && staffTab === "designations";
  const designationScope = designationWriteScope(
    staffPolicy === "company-only" && hasCompany
      ? {
          companyId: adminCompanyId,
          estateId: selectedEstate?.value,
        }
      : { estateId: selectedEstate?.value },
  );

  const applyRoleFilter = useCallback(
    (role: EstateUserRoleFilter) => {
      setRoleFilter(role);
      const params = new URLSearchParams(searchParams.toString());
      params.set("role", role);
      if (role !== "staff") params.delete("tab");
      router.replace(`${basePath}?${params.toString()}`, {
        scroll: false,
      });
    },
    [basePath, router, searchParams],
  );

  const applyStaffTab = useCallback(
    (tab: AdminStaffPageTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("role", "staff");
      if (tab === "staff") params.set("tab", "staff");
      else params.delete("tab");
      router.replace(`${basePath}?${params.toString()}`, {
        scroll: false,
      });
    },
    [basePath, router, searchParams],
  );

  useEffect(() => {
    const fromQuery = parseRoleQuery(searchParams.get("role"));
    if (fromQuery !== roleFilter) {
      setRoleFilter(fromQuery);
    }
  }, [parseRoleQuery, roleFilter, searchParams]);

  useEffect(() => {
    if (searchParams.get("role")) return;
    applyRoleFilter(parseRoleQuery(null));
  }, [applyRoleFilter, parseRoleQuery, searchParams]);

  useEffect(() => {
    if (bootstrapping) return;
    if (staffAllowed) return;
    if (roleFilter !== "staff") return;
    applyRoleFilter("resident");
  }, [applyRoleFilter, bootstrapping, roleFilter, staffAllowed]);

  const { allAdminUsers, pagination, listPending } = useSelector(
    (state: RootState) => {
      const userState = state.adminUser as any;
      const response = userState.allAdminUsers;

      return {
        allAdminUsers: Array.isArray(response?.data) ? response.data : [],
        pagination: response?.pagination ?? {},
        listPending: isPending(userState.getAllUsersByEstateState),
      };
    },
  );
  const loading =
    bootstrapping ||
    (!showDesignations &&
      Boolean(selectedEstate?.value) &&
      listPending);

  const fetchAdminUsers = useCallback(
    async (page = 1) => {
      const estateId = selectedEstate?.value;
      if (!estateId) return;

      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getAllUsersByEstate({
          estateId,
          page,
          limit: PAGE_LIMIT,
          role: roleFilter,
          search: searchQuery || undefined,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
      setCurrentPage(page);
    },
    [dispatch, selectedEstate?.value, searchQuery, startDate, endDate, roleFilter],
  );

  // Bootstrap signed-in user and estate only (no user list fetch here).
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        setUser(data);

        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (estateId) {
          setSelectedEstate({ label: "My Estate", value: estateId });
        } else {
          toast.warning("No estate found for this user.");
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  // Single fetch when estate, search, or date range changes.
  useEffect(() => {
    if (showDesignations) return;
    if (!staffAllowed && roleFilter === "staff") return;
    if (!selectedEstate?.value) return;
    fetchAdminUsers(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [
    fetchAdminUsers,
    roleFilter,
    selectedEstate?.value,
    showDesignations,
    staffAllowed,
  ]);

  useEffect(() => {
    if (roleFilter !== "staff" || !staffAllowed) {
      setDesignationNames({});
      return;
    }
    if (showDesignations) return;
    if (!designationScope.companyId && !designationScope.estateId) {
      setDesignationNames({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await dispatch(
          getDesignations({
            companyId: designationScope.companyId,
            estateId: designationScope.companyId
              ? undefined
              : designationScope.estateId,
            page: 1,
            limit: DESIGNATIONS_PAGE_SIZE,
          }),
        ).unwrap();
        if (cancelled) return;
        setDesignationNames(designationNamesById(res.items ?? []));
      } catch {
        if (!cancelled) setDesignationNames({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    roleFilter,
    showDesignations,
    designationScope.companyId,
    designationScope.estateId,
    staffAllowed,
  ]);

  const handleEstateModal = (user?: AdminUserData) => {
    setSelectedUser(user || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const openSuspendModal = (user: AdminUserData) => {
    if (!user.id || !user.isActive) return;
    setSuspendUserItem(user);
  };

  const openActivateModal = (user: AdminUserData) => {
    if (!user.id || user.isActive) return;
    setActivateUserItem(user);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendUserItem?.id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(
        suspendUser({ id: suspendUserItem.id, reason }),
      ).unwrap();
      toast.info(`${suspendUserItem.firstName} has been suspended.`);
      setSuspendUserItem(null);
      await fetchAdminUsers(1).catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateConfirm = async (note: string) => {
    if (!activateUserItem?.id) return;
    setActivateSubmitting(true);
    try {
      await dispatch(
        activateUser({ id: activateUserItem.id, note }),
      ).unwrap();
      toast.success(`${activateUserItem.firstName} has been activated.`);
      setActivateUserItem(null);
      await fetchAdminUsers(1).catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setActivateSubmitting(false);
    }
  };

  const handleEditUser = (user: AdminUserData) => {
    const id = user.id || (user as { _id?: string })._id;
    if (!id) {
      toast.error("User id is missing");
      return;
    }
    setEditingUserId(id);
  };

  const handleDeleteUser = async (id?: string, name?: string) => {
    if (!id) return;
    setItemToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteUser(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name ?? "User"} deleted successfully!`);
      setItemToDelete(null);
      await fetchAdminUsers(1).catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const getAllAddressKeys = (data: AdminUserData[]) => {
    const keys = new Set<string>();

    data.forEach((item) => {
      item.addressIds?.forEach((address) => {
        if (address?.data) {
          Object.keys(address.data).forEach((key) => keys.add(key));
        }
      });
    });

    return Array.from(keys);
  };

  const formatAddressFieldValue = (
    item: AdminUserData,
    key: string,
  ): string => {
    if (!item.addressIds?.length) return "";

    const values = item.addressIds
      .map((address) => address?.data?.[key])
      .filter((value): value is string => Boolean(value));

    if (!values.length) return "";

    return Array.from(new Set(values)).join(", ");
  };

  const getAddressColumns = (data: AdminUserData[]) => {
    if (!data.length) return [];

    const addressKeys = getAllAddressKeys(data);

    return addressKeys.map((key) => ({
      key: `address_${key}`,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      render: (item: AdminUserData) => formatAddressFieldValue(item, key) || "-",
      exportValue: (item: AdminUserData) => formatAddressFieldValue(item, key),
    }));
  };

  const showResidentColumns = roleFilter === "resident";
  const showStaffColumns = roleFilter === "staff";
  const hideActionsColumn =
    roleFilter === "admin" || roleFilter === "security";

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: AdminUserData) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    {
      key: "phoneNumber",
      header: "Phone",
      render: (item: AdminUserData) => item.phoneNumber?.trim() || "—",
    },
    ...getAddressColumns(allAdminUsers),
    // { key: "role", header: "Role" },
    ...(showResidentColumns
      ? [
          {
            key: "residentType",
            header: "Resident Type",
            render: (item: AdminUserData) =>
              item.role?.toLowerCase() === "resident"
                ? item.residentType || "-"
                : "-",
          },
        ]
      : []),
    ...(showStaffColumns
      ? [
          {
            key: "designation",
            header: "Designation",
            render: (item: AdminUserData) =>
              designationLabelForUser(item, designationNames),
            exportValue: (item: AdminUserData) =>
              designationLabelForUser(item, designationNames),
          },
        ]
      : []),
    {
      key: "invitationStatus",
      header: "Invitation Status",
      render: (item: AdminUserData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.invitationStatus === "completed"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.invitationStatus === "completed"
            ? "Completed"
            : "Not Completed"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: AdminUserData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Suspended"}
        </span>
      ),
      exportValue: (item: AdminUserData) =>
        item.isActive ? "Active" : "Suspended",
    },
    {
      key: "suspensionReason",
      header: "Suspension reason",
      render: (item: AdminUserData) =>
        item.isActive === false
          ? item.suspensionReason?.trim() || "—"
          : "—",
      exportValue: (item: AdminUserData) =>
        item.isActive === false ? item.suspensionReason?.trim() || "" : "",
    },
    {
      key: "suspendedAt",
      header: "Suspended at",
      render: (item: AdminUserData) =>
        item.isActive === false && item.suspendedAt
          ? new Date(item.suspendedAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      exportValue: (item: AdminUserData) =>
        item.isActive === false && item.suspendedAt
          ? String(item.suspendedAt)
          : "",
    },
    // Admin & security: hide Actions column
    ...(!hideActionsColumn
      ? [
          {
            key: "actions",
            header: "Actions",
            exportable: false,
            render: (item: AdminUserData) => (
              <div className="flex items-center gap-1">
                {item.role?.toLowerCase() === "resident" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (item.id) router.push(`${basePath}/${item.id}`);
                    }}
                    title="View user details"
                    disabled={!item.id}
                    className="text-[#0150AC] hover:bg-blue-50 hover:text-[#01408A]"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}

                {/* Resident: edit / suspend / delete commented out */}
                {/* Staff: edit icon commented out */}
                {roleFilter !== "resident" ? (
                  <>
                    {roleFilter !== "staff" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(item)}
                        title="Edit user details"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    ) : null}

                    {item.isActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSuspendModal(item)}
                        title="Suspend user"
                      className="text-red-600 hover:text-red-700"
                    >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openActivateModal(item)}
                        title="Activate user"
                      className="text-green-600 hover:text-green-700"
                    >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteUser(item.id, item.firstName)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : null}
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditUser(item)}
                  title="Edit user details"
                      className="text-blue-600 hover:text-blue-700"
                    >
                  <Edit className="w-4 h-4" />
                </Button>

                {item.isActive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openSuspendModal(item)}
                    title="Suspend user"
                      className="text-red-600 hover:text-red-700"
                    >
                    <PowerOff className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openActivateModal(item)}
                    title="Activate user"
                      className="text-green-600 hover:text-green-700"
                    >
                    <Power className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(item.id, item.firstName)}
                      className="text-red-600 hover:text-red-700"
                    >
                  <Trash2 className="w-4 h-4" />
                </Button> */}
              </div>
            ),
          },
        ]
      : []),
    // {
    //   key: "actions",
    //   header: "Actions",
    //   exportable: false,
    //   render: (item: AdminUserData) => ( ... ),
    // },
  ];

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading users..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold">
              {getUserManagementPageTitle(roleFilter)}
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage{" "}
              {staffAllowed ? "residents and staff" : "residents"} in{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {estateName}
              </span>
              .
            </p>
          </div>

          {canInvite && !showDesignations ? (
            <Button
              onClick={() => handleEstateModal()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />{" "}
              {isAdminInviteRole(roleFilter)
                ? getAdminInviteLabel(roleFilter)
                : "Invite"}
            </Button>
          ) : null}
        </div>

        {showStaffTabs ? (
          <div
            className="flex space-x-4"
            role="tablist"
            aria-label="Staff management"
          >
            {ADMIN_STAFF_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={staffTab === tab.id}
                className={`py-2 px-4 cursor-pointer ${
                  staffTab === tab.id
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "font-medium text-sidebar-foreground/60"
                }`}
                onClick={() => applyStaffTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {showDesignations ? (
          <DesignationsManager
            role="estate"
            compact
            lockToEstateScope
            estateId={selectedEstate?.value}
            estateName={estateName}
          />
        ) : (
          <>
        {/* Stats Card */}
        <div className="grid grid-cols-1 gap-4">
          {(() => {
            const stats = [
              {
                label: getEstateUserRoleTotalLabel(roleFilter),
                value: pagination?.total ?? 0,
                icon: UsersRound,
                color: "bg-[#FEE6D480]",
              },
            ];

            return stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="font-heading text-2xl font-bold mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </Card>
              );
            });
          })()}
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative w-full max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
              <input
                type="text"
                placeholder="Search users by name, email, block or apartment..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(searchInput);
                  }
                  if (e.key === "Escape") {
                    setSearchInput("");
                    setSearchQuery("");
                  }
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {searchInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery(searchInput)}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition cursor-pointer"
              >
                Search
              </button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="p-4">
          <Table
            columns={columns}
            data={allAdminUsers}
            emptyMessage="No users found for this estate"
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={startDate}
            endDate={endDate}
            startDatePlaceholder={DATE_RANGE_PLACEHOLDERS.start}
            endDatePlaceholder={DATE_RANGE_PLACEHOLDERS.end}
            onDateRangeChange={({ startDate, endDate }) => {
              setStartDate(startDate);
              setEndDate(endDate);
              setCurrentPage(1);
            }}
            showPagination={true}
            paginationInfo={{
              total: pagination?.total || 0,
              current: currentPage,
              pageSize: Number(pagination?.pageSize) || 10,
            }}
            onPageChange={(page) => {
              fetchAdminUsers(page).catch((err: unknown) => {
                const message = getApiErrorMessage(err);
                if (message) toast.error(message);
              });
            }}
            enableExport
            exportFileName="users"
            onExportRequest={
              selectedEstate?.value
                ? async () => {
                    const shouldApplyDate = Boolean(startDate && endDate);
                    const res = await dispatch(
                      getAllUsersByEstate({
                        estateId: selectedEstate.value,
                        page: 1,
                        limit: 50000,
                        role: roleFilter,
                        search: searchQuery || undefined,
                        startDate: shouldApplyDate ? startDate : undefined,
                        endDate: shouldApplyDate ? endDate : undefined,
                      }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
        </Card>
          </>
        )}

        {/* Invite user modal */}
        {open && canInvite && isAdminInviteRole(roleFilter) ? (
          <Modal
            visible={open}
            onClose={handleCloseModal}
            contentClassName="p-4 md:w-[45%] xl:w-[35%]"
          >
            <InviteUserForm
              close={handleCloseModal}
              refresh={() =>
                fetchAdminUsers(1).catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                })
              }
              role={roleFilter}
            />
          </Modal>
        ) : null}

        {editingUserId && (
          <Modal
            visible={Boolean(editingUserId)}
            onClose={() => setEditingUserId(null)}
          >
            <EditUserForm
              userId={editingUserId}
              close={() => setEditingUserId(null)}
              fetchUser={(id) => dispatch(getUser(id)).unwrap()}
              saveUser={(id, data) => dispatch(updateUser({ id, data })).unwrap()}
              onUpdated={() => {
                fetchAdminUsers(currentPage).catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
              }}
            />
          </Modal>
        )}

        <SuspendRentModal
          visible={!!suspendUserItem}
          onClose={() => setSuspendUserItem(null)}
          tenantName={
            suspendUserItem
              ? `${suspendUserItem.firstName} ${suspendUserItem.lastName}`.trim() ||
                suspendUserItem.email
              : ""
          }
          title="Suspend user"
          confirmLabel="Suspend"
          requireReason
          reasonLabel="Reason"
          reasonPlaceholder="e.g. Outstanding service charge / policy violation"
          description={
            <>
              Are you sure you want to suspend{" "}
              <strong>
                {suspendUserItem
                  ? `${suspendUserItem.firstName} ${suspendUserItem.lastName}`.trim() ||
                    suspendUserItem.email
                  : "this user"}
              </strong>
              ? Please provide a reason.
            </>
          }
          onConfirm={handleSuspendConfirm}
          loading={suspendSubmitting}
        />

        <SuspendRentModal
          visible={!!activateUserItem}
          onClose={() => setActivateUserItem(null)}
          tenantName={
            activateUserItem
              ? `${activateUserItem.firstName} ${activateUserItem.lastName}`.trim() ||
                activateUserItem.email
              : ""
          }
          title="Activate user"
          confirmLabel="Activate"
          requireReason
          reasonLabel="Note"
          reasonPlaceholder="e.g. Service charge settled — account restored"
          description={
            <>
              Are you sure you want to activate{" "}
              <strong>
                {activateUserItem
                  ? `${activateUserItem.firstName} ${activateUserItem.lastName}`.trim() ||
                    activateUserItem.email
                  : "this user"}
              </strong>
              ? Please add a short note.
            </>
          }
          onConfirm={handleActivateConfirm}
          loading={activateSubmitting}
        />
      </div>
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name ?? "this user"}
        title="Delete user"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
