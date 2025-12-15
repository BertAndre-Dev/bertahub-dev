"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Trash2, Plus } from "lucide-react";
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

interface AdminUserData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
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
  const [open, setOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);

  const { allAdminUsers, pagination, loading } = useSelector((state: RootState) => {
    const userState = state.adminUser as any;
    const response = userState.allAdminUsers;

    return {
      allAdminUsers: Array.isArray(response?.data) ? response.data : [],
      pagination: response?.pagination ?? {},
      loading: userState.getAllUsersByEstateState === "isLoading",
    };
  });

  const fetchAdminUsers = async (estateId?: string, page = 1) => {
    if (!estateId) return;
    try {
      await dispatch(getAllUsersByEstate({ estateId, page, limit: 10 })).unwrap();
    } catch {
      toast.error("Failed to fetch users.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        setUser(userRes.data);

        const estateId = userRes?.data?.estateId;
        if (estateId) {
          setSelectedEstate({ label: "My Estate", value: estateId });
          await fetchAdminUsers(estateId);
        } else {
          toast.warning("No estate found for this user.");
        }
      } catch {
        toast.error("Failed to fetch user or estate users.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) fetchAdminUsers(selectedEstate.value);
  }, [selectedEstate]);

  const handleEstateModal = (user?: AdminUserData) => {
    setSelectedUser(user || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (user: AdminUserData) => {
    if (!user.id) return;
    try {
      if (user.isActive) {
        await dispatch(suspendUser(user.id)).unwrap();
        toast.info(`${user.firstName} has been suspended.`);
      } else {
        await dispatch(activateUser(user.id)).unwrap();
        toast.success(`${user.firstName} has been activated.`);
      }
      if (selectedEstate?.value) fetchAdminUsers(selectedEstate.value);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id?: string, name?: string) => {
    if (!id) return;
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success(`${name} deleted successfully!`);
      if (selectedEstate?.value) fetchAdminUsers(selectedEstate.value);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete user.");
    }
  };

  const columns = [
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "invitationStatus",
      header: "Invitation Status",
      render: (item: AdminUserData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.invitationStatus ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {item.invitationStatus ? "Completed" : "Not Completed"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: AdminUserData) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(item)}>
            {item.isActive ? (
              <PowerOff className="w-4 h-4 text-red-600" />
            ) : (
              <Power className="w-4 h-4 text-green-600" />
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(item.id, item.firstName)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">View users by estate</p>
        </div>

        <Button onClick={() => handleEstateModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allAdminUsers}
          emptyMessage={loading ? "Loading users..." : "No users found for this estate"}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            if (!selectedEstate?.value) return;

            fetchAdminUsers(selectedEstate.value, page);
          }}
        />
      </Card>

      {/* Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteUserForm close={handleCloseModal} refresh={() => fetchAdminUsers(selectedEstate?.value)} />
        </Modal>
      )}
    </div>
  );
}
