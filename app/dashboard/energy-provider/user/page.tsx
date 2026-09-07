"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEnergyProviderEstates } from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate";
import {
  activateEnergyProviderUser,
  deleteEnergyProviderUser,
  getEnergyProviderUsersByEstate,
  suspendEnergyProviderUser,
} from "@/redux/slice/energy-provider/user-mgt/energy-provider-user";
import type { EnergyProviderUserDetails } from "@/redux/slice/energy-provider/user-mgt/energy-provider-user-slice";
import {
  selectEnergyProviderUserState,
  selectEnergyProviderUsersList,
  selectEnergyProviderUsersPagination,
} from "@/redux/slice/energy-provider/user-mgt/energy-provider-user-slice";
import EnergyProviderInviteUserForm from "./components/EnergyProviderInviteUserForm";
import { EnergyProviderUserStatusModal } from "./components/EnergyProviderUserStatusModal";
import {
  DEFAULT_ESTATE_USER_ROLE,
  ESTATE_USER_ROLE_FILTER_OPTIONS,
  type EstateUserRoleFilter,
} from "@/lib/estate-user-roles";

interface EstateOption {
  label: string;
  value: string;
}

function userRowId(user: EnergyProviderUserDetails) {
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

function parseCompanyFromUser(data: Record<string, unknown>): {
  id: string;
  name: string;
} | null {
  const rawCompanyId = data.companyId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const companyFromObj = data.company as
    | { id?: string; _id?: string; name?: string }
    | undefined;

  const id =
    typeof rawCompanyId === "string"
      ? rawCompanyId
      : rawCompanyId?._id ||
        rawCompanyId?.id ||
        companyFromObj?._id ||
        companyFromObj?.id ||
        "";
  if (!id) return null;

  const name =
    (typeof rawCompanyId === "object" ? rawCompanyId?.name : undefined) ||
    companyFromObj?.name ||
    (data.companyName as string | undefined) ||
    "Company";

  return { id, name };
}

function resolveOrganizationName(data: Record<string, unknown>): string {
  const company = parseCompanyFromUser(data);
  if (company?.name) return company.name;
  return extractEstateNameFromUser(data) ?? "your organization";
}

export default function EnergyProviderUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyId, setCompanyId] = useState("");
  const [organizationName, setOrganizationName] = useState("your organization");
  const [defaultEstateId, setDefaultEstateId] = useState("");
  const [open, setOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [roleFilter, setRoleFilter] = useState<EstateUserRoleFilter>(
    DEFAULT_ESTATE_USER_ROLE,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusItem, setStatusItem] = useState<EnergyProviderUserDetails | null>(
    null,
  );
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">(
    "suspend",
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);

  const allUsers = useSelector((state: RootState) =>
    selectEnergyProviderUsersList(state),
  );
  const pagination = useSelector((state: RootState) =>
    selectEnergyProviderUsersPagination(state),
  );
  const usersStatus = useSelector(
    (state: RootState) => selectEnergyProviderUserState(state).getUsersStatus,
  );

  const pageLoading =
    estatesLoading ||
    (Boolean(selectedEstate?.value) && isPending(usersStatus));
  const pageSize =
    Number(pagination?.pageSize ?? (pagination as { limit?: number })?.limit) ||
    10;

  const fetchUsers = useCallback(
    (page = 1) => {
      if (!selectedEstate?.value) return Promise.resolve();
      const shouldApplyDate = Boolean(startDate && endDate);
      return dispatch(
        getEnergyProviderUsersByEstate({
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
        const estateId = extractEstateIdFromUser(data) ?? "";

        setOrganizationName(resolveOrganizationName(data));
        if (company) {
          setCompanyId(company.id);
        }
        if (estateId) {
          setDefaultEstateId(estateId);
        }
      } catch {
        toast.error("Failed to load account information.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getEnergyProviderEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption => Boolean(x)) ??
          [];
        setEstateOptions(options);
      } catch {
        toast.error("Failed to fetch estates");
        setEstateOptions([]);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    const preferred =
      estateOptions.find((o) => o.value === defaultEstateId) ??
      estateOptions[0];
    setSelectedEstate(preferred);
  }, [estateOptions, selectedEstate?.value, defaultEstateId]);

  useEffect(() => {
    if (!selectedEstate?.value) return;
    fetchUsers(1).catch(() =>
      toast.error("Failed to fetch users for selected estate"),
    );
  }, [selectedEstate, fetchUsers]);

  const closeStatusModal = () => {
    if (statusSubmitting) return;
    setStatusItem(null);
  };

  const openSuspendModal = (user: EnergyProviderUserDetails) => {
    setStatusItem(user);
    setStatusMode("suspend");
  };

  const openActivateModal = (user: EnergyProviderUserDetails) => {
    setStatusItem(user);
    setStatusMode("activate");
  };

  const userDisplayName = (user: EnergyProviderUserDetails) =>
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
        await dispatch(suspendEnergyProviderUser(id)).unwrap();
        toast.info(`${user?.firstName ?? "User"} has been suspended.`);
      } else {
        await dispatch(activateEnergyProviderUser(id)).unwrap();
        toast.success(`${user?.firstName ?? "User"} has been activated.`);
      }
      closeStatusModal();
      await fetchUsers(Number(pagination?.currentPage) || 1);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ??
          "Failed to update user status.",
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteUser = (id?: string, name?: string) => {
    if (!id) return;
    setItemToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteEnergyProviderUser(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name ?? "User"} deleted successfully!`);
      setItemToDelete(null);
      await fetchUsers(1);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to delete user.");
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Created",
        render: (item: EnergyProviderUserDetails) =>
          formatUserDate(item.createdAt),
        exportValue: (item: EnergyProviderUserDetails) =>
          item.createdAt ? String(item.createdAt) : "",
      },
      { key: "firstName" as const, header: "First Name" },
      { key: "lastName" as const, header: "Last Name" },
      { key: "email" as const, header: "Email" },
      {
        key: "phoneNumber" as const,
        header: "Phone",
        render: (item: EnergyProviderUserDetails) =>
          item.phoneNumber?.trim() || "—",
        exportValue: (item: EnergyProviderUserDetails) =>
          item.phoneNumber?.trim() || "",
      },
      { key: "role" as const, header: "Role" },
      {
        key: "serviceCharge" as const,
        header: "Service charge",
        render: (item: EnergyProviderUserDetails) =>
          String(Boolean(item.serviceCharge)),
        exportValue: (item: EnergyProviderUserDetails) =>
          String(Boolean(item.serviceCharge)),
      },
      {
        key: "invitationStatus" as const,
        header: "Invitation",
        render: (item: EnergyProviderUserDetails) =>
          formatInvitationStatus(item.invitationStatus),
        exportValue: (item: EnergyProviderUserDetails) =>
          formatInvitationStatus(item.invitationStatus),
      },
      {
        key: "isActive" as const,
        header: "Status",
        render: (item: EnergyProviderUserDetails) => (
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
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: EnergyProviderUserDetails) => (
          <div className="flex items-center gap-1">
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
              onClick={() => handleDeleteUser(userRowId(item), item.firstName)}
              title="Delete user"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination?.currentPage],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: pagination?.total ?? 0,
        icon: UsersRound,
        color: "bg-[#FEE6D480]",
      },
    ],
    [pagination?.total],
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users for{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {organizationName}
              </span>
              .
            </p>
            <div className="w-48 min-w-[12rem]">
              <Select
                options={ESTATE_USER_ROLE_FILTER_OPTIONS}
                placeholder="Filter by role"
                value={ESTATE_USER_ROLE_FILTER_OPTIONS.find(
                  (o) => o.value === roleFilter,
                )}
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
                  dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-48 min-w-[12rem]">
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
            <Button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 cursor-pointer shrink-0"
              disabled={!estateOptions.length}
            >
              <Plus className="w-4 h-4" />
              Invite Home Owner
            </Button>
          </div>
        </div>

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
              fetchUsers(page).catch(() =>
                toast.error("Failed to change page"),
              );
            }}
            enableExport
            exportFileName="energy-provider-users"
            onExportRequest={
              selectedEstate?.value
                ? async () => {
                    const shouldApplyDate = Boolean(startDate && endDate);
                    const res = await dispatch(
                      getEnergyProviderUsersByEstate({
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

        {open && (
          <Modal visible={open} onClose={() => setOpen(false)}>
            <EnergyProviderInviteUserForm
              companyId={companyId || undefined}
              defaultEstateId={selectedEstate?.value ?? defaultEstateId}
              onClose={() => setOpen(false)}
              onSuccess={() => fetchUsers(1)}
            />
          </Modal>
        )}

        <EnergyProviderUserStatusModal
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
