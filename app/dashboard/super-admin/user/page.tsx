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
  User2,
  UsersRound,
  Search,
} from "lucide-react";
import Table from "@/components/tables/list/page";
import Select from "react-select";
import {
  getAllUsersByEstate,
  activateUser,
  suspendUser,
  deleteUser,
} from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import InviteUserForm from "@/components/super-admin/user-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

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
  role: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EstateOption {
  label: string;
  value: string;
}

export default function SuperAdminUserPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { allSuperAdminUsers, pagination, loading } = useSelector(
    (state: RootState) => {
      const userState = state.superAdminUser as any;
      const data = userState.allSuperAdminUsers?.data || [];
      const pagination = userState.allSuperAdminUsers?.pagination || {};
      return {
        allSuperAdminUsers: Array.isArray(data) ? data : [],
        pagination,
        loading: userState.getAllUsersByEstateState === "isLoading",
      };
    },
  );

  const { allEstates } = useSelector((state: RootState) => {
    const estateState = state.estate as any;
    const data = estateState.allEstates?.data || [];
    const pagination = estateState.allEstates?.pagination || {};
    return {
      allEstates: Array.isArray(data) ? data : [],
      pagination,
      loading: estateState.loading || false,
    };
  });

  const [open, setOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState<SuperAdminUserData | null>(
    null,
  );

  // ✅ Map estates for dropdown
  const estateOptions: EstateOption[] =
    allEstates
      ?.map((e: any) => {
        const value = String(e?._id || e?.id || "").trim();
        if (!value) return null;
        return {
          label: e?.name ?? "Unnamed estate",
          value,
        };
      })
      .filter((x): x is EstateOption => Boolean(x)) || [];

  // ✅ Fetch all estates on mount
  useEffect(() => {
    dispatch(
      getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch estates"));
  }, [dispatch]);

  // ✅ Default to the first estate as soon as estates load
  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  // ✅ Fetch users for the selected estate
  useEffect(() => {
    if (selectedEstate?.value) {
      const shouldApplyDate = Boolean(startDate && endDate);
      dispatch(
        getAllUsersByEstate({
          estateId: selectedEstate.value,
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      )
        .unwrap()
        .catch(() => toast.error("Failed to fetch users for selected estate"));
    }
  }, [selectedEstate, dispatch, startDate, endDate]);

  const handleEstateModal = (user?: SuperAdminUserData) => {
    setSelectedUser(user || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (user: SuperAdminUserData) => {
    try {
      if (!user.id) return;
      if (user.isActive) {
        await dispatch(suspendUser(user.id)).unwrap();
        toast.info(`${user.firstName} has been suspended.`);
      } else {
        await dispatch(activateUser(user.id)).unwrap();
        toast.success(`${user.firstName} has been activated.`);
      }

      if (selectedEstate?.value)
        await dispatch(
          getAllUsersByEstate({
            estateId: selectedEstate.value,
            page: 1,
            limit: Number(pagination?.pageSize) || 10,
          }),
        ).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id?: string, name?: string) => {
    if (!id) return;

    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteUser(id)).unwrap();
        toast.success(`${name} deleted successfully!`);
        if (selectedEstate?.value)
          await dispatch(
            getAllUsersByEstate({
              estateId: selectedEstate.value,
              page: 1,
              limit: Number(pagination?.pageSize) || 10,
            }),
          ).unwrap();
      },
    });
  };

  const columns = [
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
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
            onClick={() => handleEstateModal(item)}
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button
              variant="ghost"
              className="cursor-pointer"
              size="sm"
              onClick={() => handleToggleStatus(item)}
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="cursor-pointer"
              size="sm"
              onClick={() => handleToggleStatus(item)}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage Users</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* ✅ Estate Dropdown */}
          <div className="w-48">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) => setSelectedEstate(option)}
              isSearchable
              className="rounded-full"
            />
          </div>

          <Button
            onClick={() => handleEstateModal()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Invite Admins
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const users = allSuperAdminUsers as SuperAdminUserData[];

          const stats = [
            {
              label: "Total Residents",
              value: users?.filter((e) => e.role === "resident")?.length || 0,
              icon: User2,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Total Admins",
              value: users?.filter((e) => e.role === "admin")?.length || 0,
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
            loading ? "Loading users..." : "No users found for this estate"
          }
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
          }}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            if (!selectedEstate?.value) return; // ✅ Prevent null access
            const shouldApplyDate = Boolean(startDate && endDate);

            dispatch(
              getAllUsersByEstate({
                estateId: selectedEstate.value,
                page,
                limit: Number(pagination?.pageSize) || 10,
                startDate: shouldApplyDate ? startDate : undefined,
                endDate: shouldApplyDate ? endDate : undefined,
              }),
            )
              .unwrap()
              .catch(() => toast.error("Failed to change page"));
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

      {/* User Edit Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteUserForm close={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
}
