"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Trash2, Plus, UsersRound } from "lucide-react";
import Table from "@/components/tables/list/page";
import {
  getAllUsersByEstate,
  activateUser,
  suspendUser,
  deleteUser,
} from "@/redux/slice/admin/user-mgt/user";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import InviteUserForm from "@/components/admin/user-form/page";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

interface AdminUserData {
  id?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  email: string;
  // Single primary address id from backend (kept for backwards compatibility)
  addressId?: string;
  // Full address objects with metadata like block & apartment
  addressIds?: {
    id: string;
    data: Record<string, string>;
  }[];
  role: string;
  isActive?: boolean;
  invitationStatus?: string;
}

interface EstateOption {
  label: string;
  value: string;
}

export default function AdminUserPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [user, setUser] = useState<any>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [open, setOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [suspendUserItem, setSuspendUserItem] = useState<AdminUserData | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { allAdminUsers, pagination, loading } = useSelector(
    (state: RootState) => {
      const userState = state.adminUser as any;
      const response = userState.allAdminUsers;

      return {
        allAdminUsers: Array.isArray(response?.data) ? response.data : [],
        pagination: response?.pagination ?? {},
        loading: userState.getAllUsersByEstateState === "isLoading",
      };
    },
  );

  const fetchAdminUsers = async (
    estateId?: string,
    page = 1,
    searchTerm?: string,
  ) => {
    if (!estateId) return;

    try {
      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getAllUsersByEstate({
          estateId,
          page,
          limit: 10,
          search: searchTerm,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
      setCurrentPage(page);
    } catch {
      toast.error("Failed to fetch users.");
    }
  };

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
          await fetchAdminUsers(estateId, 1, "");
        } else {
          toast.warning("No estate found for this user.");
        }
      } catch {
        toast.error("Failed to fetch user or estate users.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) {
      fetchAdminUsers(selectedEstate.value, 1, search);
    }
  }, [selectedEstate, search, startDate, endDate]);

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

  const handleSuspendConfirm = async (_reason: string) => {
    if (!suspendUserItem?.id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(suspendUser(suspendUserItem.id)).unwrap();
      toast.info(`${suspendUserItem.firstName} has been suspended.`);
      setSuspendUserItem(null);
      if (selectedEstate?.value) {
        fetchAdminUsers(selectedEstate.value, 1, search);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to suspend user.");
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateUser = async (user: AdminUserData) => {
    if (!user.id) return;
    try {
      await dispatch(activateUser(user.id)).unwrap();
      toast.success(`${user.firstName} has been activated.`);
      if (selectedEstate?.value) {
        fetchAdminUsers(selectedEstate.value, 1, search);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate user.");
    }
  };

  const handleDeleteUser = async (id?: string, name?: string) => {
    if (!id) return;

    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteUser(id)).unwrap();
        toast.success(`${name} deleted successfully!`);

        if (selectedEstate?.value) {
          fetchAdminUsers(selectedEstate.value, 1, search);
        }
      },
    });
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

  const getAddressColumns = (data: AdminUserData[]) => {
    if (!data.length) return [];

    const addressKeys = getAllAddressKeys(data);

    return addressKeys.map((key) => ({
      key: `address_${key}`,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      render: (item: AdminUserData) => {
        if (!item.addressIds?.length) return "-";

        const values = item.addressIds
          .map((address) => address?.data?.[key])
          .filter((value): value is string => Boolean(value));

        if (!values.length) return "-";

        // Deduplicate in case the same value appears across multiple addresses
        const uniqueValues = Array.from(new Set(values));
        return uniqueValues.join(", ");
      },
    }));
  };

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
    ...getAddressColumns(allAdminUsers),
    { key: "role", header: "Role" },
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
      key: "actions",
      header: "Actions",
      render: (item: AdminUserData) => (
        <div className="flex items-center gap-1">
          {item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openSuspendModal(item)}
              title="Suspend user"
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActivateUser(item)}
              title="Activate user"
            >
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}

          <Button
            variant="ghost"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's is an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>

        <Button
          onClick={() => handleEstateModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Residents",
              value:
                allAdminUsers?.filter(
                  (u: AdminUserData) => u.role === "resident",
                )?.length || 0,
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
        <input
          type="text"
          placeholder="Search users by name, email, block or apartment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      {/* Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allAdminUsers}
          emptyMessage={
            loading ? "Loading users..." : "No users found for this estate"
          }
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
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
            if (!selectedEstate?.value) return;
            fetchAdminUsers(selectedEstate.value, page, search);
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
                      search,
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

      {/* Invite user modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteUserForm
            close={handleCloseModal}
            refresh={() => fetchAdminUsers(selectedEstate?.value, 1, search)}
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
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />
    </div>
  );
}
