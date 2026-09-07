"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  // Building2,
  // Users,
  // Home,
  // TrendingUp,
  Plus,
  Edit,
  Power,
  PowerOff,
  Trash2,
  UsersRound,
  Search,
  Eye,
} from "lucide-react";
import Table from "@/components/tables/list/page";
import Select from "react-select";
import {
  getAllUsersByEstate,
  getAllUsersByCompany,
  activateUser,
  suspendUser,
  deleteUser,
} from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal/page";
import InviteUserForm from "@/components/super-admin/user-form/page";
import EditUserForm from "@/app/dashboard/super-admin/user/components/EditUserForm";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import { UserStatusModal } from "./components/UserStatusModal";
import {
  DEFAULT_ESTATE_USER_ROLE,
  ESTATE_USER_ROLE_FILTER_OPTIONS,
  ESTATE_SCOPE_ROLE_FILTER_OPTIONS,
  getEstateUserRoleTotalLabel,
  type EstateUserRoleFilter,
} from "@/lib/estate-user-roles";

interface UserAddress {
  id: string;
  data?: {
    block?: string;
    apartment?: string;
    [key: string]: unknown;
  };
}

interface SuperAdminUserData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  role?: string;
  image?: string;
  isActive?: boolean;
  serviceCharge?: boolean;
  invitationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  residentType?: string | null;
  addressIds?: UserAddress[];
  serviceChargesPaidForAddresses?: string[];
}

function formatAddressLabel(data?: UserAddress["data"]) {
  if (!data) return "";
  const parts: string[] = [];
  if (data.block) parts.push(`Block ${data.block}`);
  if (data.apartment) parts.push(`Apt ${data.apartment}`);
  return parts.join(", ");
}

function resolvePaidAddressLabels(item: SuperAdminUserData): string[] {
  const paidIds = item.serviceChargesPaidForAddresses || [];
  if (!paidIds.length) return [];
  const addressMap = new Map<string, UserAddress["data"]>(
    (item.addressIds || []).map((a) => [a.id, a.data]),
  );
  return paidIds.map((id) => {
    const data = addressMap.get(id);
    return formatAddressLabel(data) || id;
  });
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

interface SelectOption {
  label: string;
  value: string;
}

type FilterScope = "estate" | "company";

const FILTER_SCOPE_OPTIONS: { label: string; value: FilterScope }[] = [
  { label: "Estate", value: "estate" },
  { label: "Company", value: "company" },
];

/** Estates/companies for filter dropdown — not tied to user table page size. */
const FILTER_FETCH_LIMIT = 500;

export default function SuperAdminUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    allSuperAdminUsers,
    userPagination,
    getAllUsersByEstateState,
    getAllUsersByCompanyState,
  } = useSelector((state: RootState) => {
    const userState = state.superAdminUser as any;
    const data = userState.allSuperAdminUsers?.data || [];
    const userPagination = userState.allSuperAdminUsers?.pagination || {};
    return {
      allSuperAdminUsers: Array.isArray(data) ? data : [],
      userPagination,
      getAllUsersByEstateState: userState.getAllUsersByEstateState as string,
      getAllUsersByCompanyState: userState.getAllUsersByCompanyState as string,
    };
  });

  const { allEstates, estateLoading } = useSelector((state: RootState) => {
    const estateState = state.estate as any;
    const data = estateState.allEstates?.data || [];
    return {
      allEstates: Array.isArray(data) ? data : [],
      estateLoading: isPending(estateState.getAllEstatesState),
    };
  });

  const { allCompanies, companyLoading } = useSelector((state: RootState) => {
    const companyState = state.superAdminCompany;
    const data = companyState.list || [];
    return {
      allCompanies: Array.isArray(data) ? data : [],
      companyLoading: isPending(companyState.getListStatus),
    };
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [filterScope, setFilterScope] = useState<FilterScope>("estate");
  const [selectedEstate, setSelectedEstate] = useState<SelectOption | null>(
    null,
  );
  const [selectedCompany, setSelectedCompany] = useState<SelectOption | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roleFilter, setRoleFilter] = useState<EstateUserRoleFilter>(
    DEFAULT_ESTATE_USER_ROLE,
  );
  const [editingUser, setEditingUser] = useState<SuperAdminUserData | null>(
    null,
  );
  const [statusItem, setStatusItem] = useState<SuperAdminUserData | null>(null);
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">(
    "suspend",
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User list is only fetched after an estate/company is selected — gate idle.
  const usersLoading =
    filterScope === "company"
      ? Boolean(selectedCompany?.value) &&
        isPending(getAllUsersByCompanyState)
      : Boolean(selectedEstate?.value) &&
        isPending(getAllUsersByEstateState);

  const pageLoading = estateLoading || companyLoading || usersLoading;

  const estateOptions: SelectOption[] = useMemo(
    () =>
      allEstates
        ?.map((e: any) => {
          const value = String(e?._id || e?.id || "").trim();
          if (!value) return null;
          return {
            label: e?.name ?? "Unnamed estate",
            value,
          };
        })
        .filter((x): x is SelectOption => Boolean(x)) || [],
    [allEstates],
  );

  const companyOptions: SelectOption[] = useMemo(
    () =>
      allCompanies
        .map((c) => {
          const value = String(c?._id || c?.id || "").trim();
          if (!value) return null;
          return {
            label: c?.name ?? "Unnamed company",
            value,
          };
        })
        .filter((x): x is SelectOption => Boolean(x)),
    [allCompanies],
  );

  const selectedFilterEntity =
    filterScope === "estate" ? selectedEstate : selectedCompany;

  const pageSize = Number(userPagination?.pageSize) || 10;

  const fetchUsers = useCallback(
    (page = 1) => {
      if (!selectedFilterEntity?.value) return Promise.resolve();
      const shouldApplyDate = Boolean(startDate && endDate);
      const common = {
        page,
        limit: pageSize,
        role: roleFilter,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      };

      const request =
        filterScope === "company"
          ? dispatch(
              getAllUsersByCompany({
                companyId: selectedFilterEntity.value,
                ...common,
              }),
            )
          : dispatch(
              getAllUsersByEstate({
                estateId: selectedFilterEntity.value,
                ...common,
              }),
            );

      return request.unwrap().then((result) => {
        setCurrentPage(page);
        return result;
      });
    },
    [
      dispatch,
      filterScope,
      selectedFilterEntity?.value,
      pageSize,
      roleFilter,
      startDate,
      endDate,
    ],
  );

  // Fetch estates & companies for filter dropdowns
  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
    dispatch(getCompanies({ page: 1, limit: FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch]);

  // Default to the first estate/company for the active scope
  useEffect(() => {
    if (filterScope === "estate") {
      if (selectedEstate?.value) return;
      if (!estateOptions.length) return;
      setSelectedEstate(estateOptions[0]);
      return;
    }
    if (selectedCompany?.value) return;
    if (!companyOptions.length) return;
    setSelectedCompany(companyOptions[0]);
  }, [
    filterScope,
    estateOptions,
    companyOptions,
    selectedEstate?.value,
    selectedCompany?.value,
  ]);

  // Fetch users when scope/entity/role changes, or when a complete date range is set/cleared
  useEffect(() => {
    if (!selectedFilterEntity?.value) return;

    const partialDate =
      (Boolean(startDate) && !endDate) || (!startDate && Boolean(endDate));
    if (partialDate) return;

    setCurrentPage(1);
    fetchUsers(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [
    filterScope,
    selectedFilterEntity?.value,
    roleFilter,
    startDate,
    endDate,
    fetchUsers,
  ]);

  const handleFilterScopeChange = (scope: FilterScope) => {
    setFilterScope(scope);
    setCurrentPage(1);
    if (scope === "estate") {
      setSelectedCompany(null);
      if (estateOptions.length) setSelectedEstate(estateOptions[0]);
      // Company role is not valid under estate filter.
      if (roleFilter === "company") {
        setRoleFilter(DEFAULT_ESTATE_USER_ROLE);
      }
    } else {
      setSelectedEstate(null);
      if (companyOptions.length) setSelectedCompany(companyOptions[0]);
    }
  };

  const roleFilterOptions =
    filterScope === "estate"
      ? ESTATE_SCOPE_ROLE_FILTER_OPTIONS
      : ESTATE_USER_ROLE_FILTER_OPTIONS;

  const handleInviteModal = () => {
    setInviteOpen(true);
  };

  const handleCloseInviteModal = () => {
    setInviteOpen(false);
  };

  const handleEditUser = (user: SuperAdminUserData) => {
    const id = user.id || (user as { _id?: string })._id;
    if (!id) {
      toast.error("User id is missing");
      return;
    }
    setEditingUser({ ...user, id });
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
  };

  const closeStatusModal = () => {
    if (statusSubmitting) return;
    setStatusItem(null);
  };

  const openSuspendModal = (user: SuperAdminUserData) => {
    setStatusItem(user);
    setStatusMode("suspend");
  };

  const openActivateModal = (user: SuperAdminUserData) => {
    setStatusItem(user);
    setStatusMode("activate");
  };

  const userDisplayName = (user: SuperAdminUserData) =>
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email ||
    "this user";

  const handleConfirmStatus = async () => {
    const user = statusItem;
    if (!user?.id) return;
    setStatusSubmitting(true);
    try {
      if (statusMode === "suspend") {
        await dispatch(suspendUser(user.id)).unwrap();
        toast.info(`${user.firstName ?? "User"} has been suspended.`);
      } else {
        await dispatch(activateUser(user.id)).unwrap();
        toast.success(`${user.firstName ?? "User"} has been activated.`);
      }
      closeStatusModal();
      if (selectedFilterEntity?.value) {
        await fetchUsers(1);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setStatusSubmitting(false);
    }
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
      if (selectedFilterEntity?.value) await fetchUsers(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const showResidentColumns = roleFilter === "resident";

  const columns = [
    {
      key: "createdAt",
      header: "Created",
      render: (item: SuperAdminUserData) => formatUserDate(item.createdAt),
      exportValue: (item: SuperAdminUserData) =>
        item.createdAt ? String(item.createdAt) : "",
    },
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    {
      key: "phoneNumber",
      header: "Phone",
      render: (item: SuperAdminUserData) => item.phoneNumber?.trim() || "—",
      exportValue: (item: SuperAdminUserData) => item.phoneNumber?.trim() || "",
    },
    ...(showResidentColumns
      ? [
          {
            key: "residentType",
            header: "Resident Type",
            render: (item: SuperAdminUserData) => {
              const value = item.residentType;
              if (!value) return "—";
              return (
                value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
              );
            },
            exportValue: (item: SuperAdminUserData) => item.residentType || "",
          },
          {
            key: "serviceCharge",
            header: "Service charge",
            render: (item: SuperAdminUserData) =>
              String(Boolean(item.serviceCharge)),
            exportValue: (item: SuperAdminUserData) =>
              String(Boolean(item.serviceCharge)),
          },
          // {
          //   key: "serviceChargesPaidForAddresses",
          //   header: "Service Charges Paid (Addresses)",
          //   render: (item: SuperAdminUserData) => {
          //     const labels = resolvePaidAddressLabels(item);
          //     if (!labels.length) return "—";
          //     return (
          //       <div className="flex flex-col gap-0.5 max-w-[220px]">
          //         {labels.map((label) => (
          //           <span
          //             key={label}
          //             className="text-xs px-2 py-0.5 rounded-md bg-green-100 text-green-700 w-fit"
          //           >
          //             {label}
          //           </span>
          //         ))}
          //       </div>
          //     );
          //   },
          //   exportValue: (item: SuperAdminUserData) =>
          //     resolvePaidAddressLabels(item).join("; "),
          // },
        ]
      : []),
    {
      key: "invitationStatus",
      header: "Invitation",
      render: (item: SuperAdminUserData) =>
        formatInvitationStatus(item.invitationStatus),
      exportValue: (item: SuperAdminUserData) =>
        formatInvitationStatus(item.invitationStatus),
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: SuperAdminUserData) => (
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
    {
      key: "actions",
      header: "Actions",
      render: (item: SuperAdminUserData) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="cursor-pointer"
            size="sm"
            onClick={() => {
              const id = item.id || (item as { _id?: string })._id;
              if (id) router.push(`/dashboard/super-admin/user/${id}`);
            }}
            title="View user details"
            disabled={!item.id && !(item as { _id?: string })._id}
          >
            <Eye className="w-4 h-4 text-[#0150AC]" />
          </Button>
          <Button
            variant="ghost"
            className="cursor-pointer"
            size="sm"
            onClick={() => handleEditUser(item)}
            title="Edit user details"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button
              variant="ghost"
              className="cursor-pointer"
              size="sm"
              onClick={() => openSuspendModal(item)}
              title="Suspend user"
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="cursor-pointer"
              size="sm"
              onClick={() => openActivateModal(item)}
              title="Activate user"
            >
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="cursor-pointer"
            size="sm"
            onClick={() => handleDeleteUser(item.id, item.firstName)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading users..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1 w-full min-w-0">
            <div className="flex flex-row items-center justify-between gap-2 w-full">
              <h1 className="font-heading text-3xl font-bold">
                User Management
              </h1>
              <Button
                onClick={handleInviteModal}
                className="flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Invite Admins
              </Button>
            </div>
            <p className="text-muted-foreground">Manage Users</p>
          </div>
          <div className="flex flex-col gap-2 items-end justify-start w-full">
            <div
              className="inline-flex rounded-full border border-input bg-muted/30 p-1"
              role="group"
              aria-label="Filter by estate or company"
            >
              {FILTER_SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFilterScopeChange(opt.value)}
                  className={[
                    "rounded-full px-4 py-1 text-sm font-medium transition-colors cursor-pointer",
                    filterScope === opt.value
                      ? "bg-[#0150AC] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex flex-row md:flex-row md:flex-wrap items-stretch md:items-start justify-end gap-3 w-full sm:w-auto">
              <div className="w-36">
                {filterScope === "estate" ? (
                  <Select
                    options={estateOptions}
                    placeholder="Select estate"
                    value={selectedEstate}
                    onChange={(option) => setSelectedEstate(option)}
                    isSearchable
                    isLoading={estateLoading}
                    className="rounded-full"
                  />
                ) : (
                  <Select
                    options={companyOptions}
                    placeholder="Select company"
                    value={selectedCompany}
                    onChange={(option) => setSelectedCompany(option)}
                    isSearchable
                    isLoading={companyLoading}
                    className="rounded-full"
                  />
                )}
              </div>

              <div className="w-36">
                <Select
                  options={roleFilterOptions}
                  placeholder="Filter by role"
                  value={roleFilterOptions.find((o) => o.value === roleFilter)}
                  onChange={(option) =>
                    setRoleFilter(
                      (option?.value as EstateUserRoleFilter) ??
                        DEFAULT_ESTATE_USER_ROLE,
                    )
                  }
                  isSearchable={false}
                  styles={{
                    control: (base) => ({ ...base, cursor: "pointer" }),
                    option: (base) => ({ ...base, cursor: "pointer" }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      cursor: "pointer",
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4">
          {(() => {
            const stats = [
              {
                label: getEstateUserRoleTotalLabel(roleFilter),
                value: userPagination?.total ?? 0,
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

        <div className="bg-white p-4 rounded-lg">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by users by name or email"
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="p-4">
          <Table
            columns={columns}
            data={allSuperAdminUsers}
            emptyMessage={
              filterScope === "company"
                ? "No users found for this company"
                : "No users found for this estate"
            }
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate, endDate }) => {
              setStartDate(startDate);
              setEndDate(endDate);
            }}
            showPagination={true}
            paginationInfo={{
              total: userPagination?.total || 0,
              current: currentPage,
              pageSize: Number(userPagination?.pageSize) || 10,
            }}
            onPageChange={(page) => {
              fetchUsers(page).catch((err: unknown) => {
                const message = getApiErrorMessage(err);
                if (message) toast.error(message);
              });
            }}
            enableExport
            exportFileName="users"
            onExportRequest={
              selectedFilterEntity?.value
                ? async () => {
                    const shouldApplyDate = Boolean(startDate && endDate);
                    const common = {
                      page: 1,
                      limit: 50000,
                      role: roleFilter,
                      startDate: shouldApplyDate ? startDate : undefined,
                      endDate: shouldApplyDate ? endDate : undefined,
                    };
                    const res =
                      filterScope === "company"
                        ? await dispatch(
                            getAllUsersByCompany({
                              companyId: selectedFilterEntity.value,
                              ...common,
                            }),
                          ).unwrap()
                        : await dispatch(
                            getAllUsersByEstate({
                              estateId: selectedFilterEntity.value,
                              ...common,
                            }),
                          ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
        </Card>

        {/* Invite Admin Modal */}
        {inviteOpen && (
          <Modal visible={inviteOpen} onClose={handleCloseInviteModal}>
            <InviteUserForm close={handleCloseInviteModal} />
          </Modal>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <Modal visible={Boolean(editingUser)} onClose={handleCloseEditModal}>
            <EditUserForm
              userId={
                editingUser.id ||
                (editingUser as { _id?: string })._id ||
                ""
              }
              close={handleCloseEditModal}
              onUpdated={() => {
                if (selectedFilterEntity?.value) {
                  fetchUsers(currentPage).catch(() => {});
                }
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
