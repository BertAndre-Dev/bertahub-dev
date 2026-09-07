"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import Select from "react-select";
import {
  Plus,
  Power,
  PowerOff,
  Trash2,
  UsersRound,
  Search,
  Edit,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  activateCompanyUser,
  deleteCompanyUser,
  getCompanyUser,
  getCompanyUsersByEstate,
  suspendCompanyUser,
  updateCompanyUser,
} from "@/redux/slice/company/user-mgt/company-user";
import type { CompanyUserDetails } from "@/redux/slice/company/user-mgt/company-user-slice";
import {
  selectCompanyUserState,
  selectCompanyUsersList,
  selectCompanyUsersPagination,
} from "@/redux/slice/company/user-mgt/company-user-slice";
import { parseCompanyFromUser } from "../lib/company";
import CompanyInviteUserForm from "./components/CompanyInviteUserForm";
import { UserStatusModal } from "./components/UserStatusModal";
import EditUserForm from "@/components/user-mgt/edit-user-form";
import {
  getCompanyUserRoleTotalLabel,
  getUserManagementPageTitle,
  parseCompanyUserRoleQuery,
  type CompanyUserRoleFilter,
} from "@/lib/estate-user-roles";
import {
  ENERGY_PROVIDER_ROLE,
  getCompanyInviteLabel,
  type CompanyInviteRole,
} from "@/lib/invite-user-roles";
import { getDesignations } from "@/redux/slice/designations/designations";
import {
  designationLabelForUser,
  designationNamesById,
  DESIGNATIONS_PAGE_SIZE,
  userHasDesignationModule,
} from "@/lib/designations";
import { DesignationsManager } from "@/components/designations/DesignationsManager";

type CompanyStaffPageTab = "staff" | "designations";

const COMPANY_STAFF_TABS: { id: CompanyStaffPageTab; label: string }[] = [
  { id: "designations", label: "Designations" },
  { id: "staff", label: "Staff" },
];

function parseCompanyStaffTab(raw: string | null): CompanyStaffPageTab {
  return raw === "staff" ? "staff" : "designations";
}

interface EstateOption {
  label: string;
  value: string;
}

function userRowId(user: CompanyUserDetails) {
  return user.id || user._id || "";
}

function formatUserDate(value?: string) {
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

function formatInvitationStatus(value?: string) {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function companyInviteRole(
  role: CompanyUserRoleFilter,
): CompanyInviteRole | null {
  if (
    role === "admin" ||
    role === "staff" ||
    role === ENERGY_PROVIDER_ROLE
  ) {
    return role;
  }
  return null;
}

export default function CompanyUsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("Company");
  const [open, setOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [roleFilter, setRoleFilter] = useState<CompanyUserRoleFilter>(() =>
    parseCompanyUserRoleQuery(searchParams.get("role")),
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusItem, setStatusItem] = useState<CompanyUserDetails | null>(null);
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">(
    "suspend",
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [designationNames, setDesignationNames] = useState<
    Record<string, string>
  >({});

  const authUser = useSelector((state: RootState) => state.auth.user);
  const canManageDesignations = userHasDesignationModule(authUser);
  const requestedStaffTab = parseCompanyStaffTab(searchParams.get("tab"));
  const staffTab = canManageDesignations ? requestedStaffTab : "staff";
  const showStaffTabs = roleFilter === "staff" && canManageDesignations;
  const showDesignations = showStaffTabs && staffTab === "designations";

  const applyStaffTab = useCallback(
    (tab: CompanyStaffPageTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("role", "staff");
      if (tab === "staff") params.set("tab", "staff");
      else params.delete("tab");
      router.replace(`/dashboard/company/users?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const fromQuery = parseCompanyUserRoleQuery(searchParams.get("role"));
    if (fromQuery !== roleFilter) {
      setRoleFilter(fromQuery);
    }
  }, [roleFilter, searchParams]);

  const allUsers = useSelector((state: RootState) =>
    selectCompanyUsersList(state),
  );
  const pagination = useSelector((state: RootState) =>
    selectCompanyUsersPagination(state),
  );
  const usersStatus = useSelector(
    (state: RootState) => selectCompanyUserState(state).getUsersStatus,
  );

  const pageLoading =
    estatesLoading ||
    (!showDesignations &&
      Boolean(selectedEstate?.value) &&
      isPending(usersStatus));
  const pageSize =
    Number(pagination?.pageSize ?? (pagination as { limit?: number })?.limit) ||
    10;
  const inviteRole = companyInviteRole(roleFilter);

  const fetchUsers = useCallback(
    (page = 1) => {
      if (!selectedEstate?.value) return Promise.resolve();
      const shouldApplyDate = Boolean(startDate && endDate);
      return dispatch(
        getCompanyUsersByEstate({
          estateId: selectedEstate.value,
          page,
          limit: pageSize,
          role: roleFilter,
          search: search.trim() || undefined,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    },
    [
      dispatch,
      selectedEstate,
      pageSize,
      search,
      startDate,
      endDate,
      roleFilter,
    ],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          return;
        }
        setCompanyId(company.id);
        setCompanyName(company.name);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption =>
              Boolean(x),
            ) ?? [];
        setEstateOptions(options);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setEstateOptions([]);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (showDesignations) return;
    if (!selectedEstate?.value) return;
    fetchUsers(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [fetchUsers, selectedEstate, showDesignations]);

  useEffect(() => {
    if (roleFilter !== "staff" || !companyId) {
      setDesignationNames({});
      return;
    }
    if (showDesignations) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await dispatch(
          getDesignations({
            companyId,
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
  }, [dispatch, roleFilter, companyId, showDesignations]);

  const closeStatusModal = () => {
    if (statusSubmitting) return;
    setStatusItem(null);
  };

  const openSuspendModal = (user: CompanyUserDetails) => {
    setStatusItem(user);
    setStatusMode("suspend");
  };

  const openActivateModal = (user: CompanyUserDetails) => {
    setStatusItem(user);
    setStatusMode("activate");
  };

  const userDisplayName = (user: CompanyUserDetails) =>
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email ||
    "this user";

  const handleConfirmStatus = async () => {
    const user = statusItem;
    const id = user ? userRowId(user) : "";
    if (!id) return;
    setStatusSubmitting(true);
    try {
      if (statusMode === "suspend") {
        await dispatch(suspendCompanyUser(id)).unwrap();
        toast.info(`${user?.firstName ?? "User"} has been suspended.`);
      } else {
        await dispatch(activateCompanyUser(id)).unwrap();
        toast.success(`${user?.firstName ?? "User"} has been activated.`);
      }
      closeStatusModal();
      await fetchUsers(Number(pagination?.currentPage) || 1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteUser = (id?: string, name?: string) => {
    if (!id) return;
    setItemToDelete({ id, name });
  };

  const handleEditUser = (user: CompanyUserDetails) => {
    const id = userRowId(user);
    if (!id) {
      toast.error("User id is missing");
      return;
    }
    setEditingUserId(id);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteCompanyUser(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name ?? "User"} deleted successfully!`);
      setItemToDelete(null);
      await fetchUsers(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const showResidentColumns = roleFilter === "resident";
  const showStaffColumns = roleFilter === "staff";
  // Admin & security: Actions column removed.
  const hideActionsColumn =
    roleFilter === "admin" || roleFilter === "security";

  const columns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Created",
        render: (item: CompanyUserDetails) => formatUserDate(item.createdAt),
        exportValue: (item: CompanyUserDetails) =>
          item.createdAt ? String(item.createdAt) : "",
      },
      { key: "firstName" as const, header: "First Name" },
      { key: "lastName" as const, header: "Last Name" },
      { key: "email" as const, header: "Email" },
      {
        key: "phoneNumber" as const,
        header: "Phone",
        render: (item: CompanyUserDetails) => item.phoneNumber?.trim() || "—",
        exportValue: (item: CompanyUserDetails) => item.phoneNumber?.trim() || "",
      },
      { key: "role" as const, header: "Role" },
      ...(showResidentColumns
        ? [
            {
              key: "serviceCharge" as const,
              header: "Service charge",
              render: (item: CompanyUserDetails) =>
                String(Boolean(item.serviceCharge)),
              exportValue: (item: CompanyUserDetails) =>
                String(Boolean(item.serviceCharge)),
            },
          ]
        : []),
      ...(showStaffColumns
        ? [
            {
              key: "designation" as const,
              header: "Designation",
              render: (item: CompanyUserDetails) =>
                designationLabelForUser(item, designationNames),
              exportValue: (item: CompanyUserDetails) =>
                designationLabelForUser(item, designationNames),
            },
          ]
        : []),
      {
        key: "invitationStatus" as const,
        header: "Invitation",
        render: (item: CompanyUserDetails) =>
          formatInvitationStatus(item.invitationStatus),
        exportValue: (item: CompanyUserDetails) =>
          formatInvitationStatus(item.invitationStatus),
      },
      {
        key: "isActive" as const,
        header: "Status",
        render: (item: CompanyUserDetails) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      // Admin & security: hide Actions column
      ...(!hideActionsColumn
        ? [
            {
              key: "actions" as const,
              header: "Actions",
              exportable: false,
              render: (item: CompanyUserDetails) => (
                <div className="flex items-center gap-1">
                  {roleFilter === "resident" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#0150AC] hover:bg-blue-50 hover:text-[#01408A] cursor-pointer"
                      onClick={() => {
                        const id = userRowId(item);
                        if (id) router.push(`/dashboard/company/users/${id}`);
                      }}
                      title="View user details"
                      disabled={!userRowId(item)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  ) : null}
                  {/* Resident: edit / suspend / delete commented out */}
                  {roleFilter !== "resident" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => handleEditUser(item)}
                        title="Edit user details"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      {item.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => openSuspendModal(item)}
                          title="Suspend user"
                        >
                          <PowerOff className="w-4 h-4 text-red-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => openActivateModal(item)}
                          title="Activate user"
                        >
                          <Power className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() =>
                          handleDeleteUser(userRowId(item), item.firstName)
                        }
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </>
                  ) : null}
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => handleEditUser(item)}
                    title="Edit user details"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  {item.isActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openSuspendModal(item)}
                      title="Suspend user"
                    >
                      <PowerOff className="w-4 h-4 text-red-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openActivateModal(item)}
                      title="Activate user"
                    >
                      <Power className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() =>
                      handleDeleteUser(userRowId(item), item.firstName)
                    }
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button> */}
                </div>
              ),
            },
          ]
        : []),
      // {
      //   key: "actions" as const,
      //   header: "Actions",
      //   ...
      // },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      pagination?.currentPage,
      showResidentColumns,
      showStaffColumns,
      designationNames,
      hideActionsColumn,
      roleFilter,
    ],
  );

  const stats = useMemo(
    () => [
      {
        label: getCompanyUserRoleTotalLabel(roleFilter),
        value: pagination?.total ?? 0,
        icon: UsersRound,
        color: "bg-[#FEE6D480]",
      },
    ],
    [pagination?.total, roleFilter],
  );

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading users..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold">
              {getUserManagementPageTitle(roleFilter)}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users for{" "}
              {/* <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span> */}
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 md:ml-auto">
            <div className="w-full sm:w-48 sm:min-w-[12rem]">
              <Select
                options={estateOptions}
                placeholder="Filter by estate"
                value={selectedEstate}
                onChange={(option) => setSelectedEstate(option)}
                isSearchable
                isDisabled={!estateOptions.length}
                styles={{
                  control: (base) => ({ ...base, cursor: "pointer" }),
                  option: (base) => ({ ...base, cursor: "pointer" }),
                  dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                  clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
                }}
              />
            </div>
            {inviteRole && !showDesignations ? (
              <Button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 cursor-pointer shrink-0"
                disabled={!companyId}
              >
                <Plus className="w-4 h-4" />
                {getCompanyInviteLabel(inviteRole)}
              </Button>
            ) : null}
          </div>
        </div>

        {showStaffTabs ? (
          <div className="flex space-x-4" role="tablist" aria-label="Staff management">
            {COMPANY_STAFF_TABS.map((tab) => (
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
          companyId ? (
            <DesignationsManager
              role="company"
              compact
              companyId={companyId}
              companyName={companyName}
            />
          ) : null
        ) : (
          <>
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
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
          })}
        </div>

        <div className="bg-white p-4 rounded-lg">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by name or email"
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="p-4">
          <Table
            columns={columns}
            data={allUsers}
            emptyMessage={
              estateOptions.length
                ? "No users found for this estate"
                : "Create an estate first to manage users"
            }
            enableDateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
            showPagination
            paginationInfo={{
              total: pagination?.total || 0,
              current:
                Number(
                  pagination?.currentPage ??
                    (pagination as { page?: number })?.page,
                ) || 1,
              pageSize,
            }}
            onPageChange={(page) => {
              fetchUsers(page).catch((err: unknown) => {
                const message = getApiErrorMessage(err);
                if (message) toast.error(message);
              });
            }}
            enableExport
            exportFileName="company-users"
            onExportRequest={
              selectedEstate?.value
                ? async () => {
                    const shouldApplyDate = Boolean(startDate && endDate);
                    const res = await dispatch(
                      getCompanyUsersByEstate({
                        estateId: selectedEstate.value,
                        page: 1,
                        limit: 50000,
                        role: roleFilter,
                        search: search.trim() || undefined,
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

        {open && companyId && inviteRole && (
          <Modal visible={open} onClose={() => setOpen(false)}>
            <CompanyInviteUserForm
              companyId={companyId}
              role={inviteRole}
              defaultEstateId={selectedEstate?.value}
              onClose={() => setOpen(false)}
              onSuccess={() => fetchUsers(1)}
            />
          </Modal>
        )}

        {editingUserId && (
          <Modal
            visible={Boolean(editingUserId)}
            onClose={() => setEditingUserId(null)}
          >
            <EditUserForm
              userId={editingUserId}
              close={() => setEditingUserId(null)}
              fetchUser={(id) => dispatch(getCompanyUser(id)).unwrap()}
              saveUser={(id, data) =>
                dispatch(updateCompanyUser({ id, data })).unwrap()
              }
              onUpdated={() => {
                fetchUsers(Number(pagination?.currentPage) || 1).catch(
                  (err: unknown) => {
                    const message = getApiErrorMessage(err);
                    if (message) toast.error(message);
                  },
                );
              }}
            />
          </Modal>
        )}

        <UserStatusModal
          visible={Boolean(statusItem)}
          onClose={closeStatusModal}
          userName={statusItem ? userDisplayName(statusItem) : "this user"}
          mode={statusMode}
          loading={statusSubmitting}
          onConfirm={handleConfirmStatus}
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
