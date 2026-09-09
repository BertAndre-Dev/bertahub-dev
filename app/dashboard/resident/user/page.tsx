"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Power, PowerOff, Trash2 } from "lucide-react";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import InviteTenantForm from "@/components/resident/invite-tenant-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getInvitedTenants } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import type { InvitedTenantItem } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import {
  activateUser,
  deleteUser,
  suspendUser,
} from "@/redux/slice/admin/user-mgt/user";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatUserAddresses } from "@/lib/address";

const PAGE_SIZE = 10;

function formatDate(val: string | undefined) {
  if (!val) return "—";
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return val;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function tenantId(tenant: InvitedTenantItem): string {
  return tenant.id || (tenant as { _id?: string })._id || "";
}

function tenantDisplayName(tenant: InvitedTenantItem): string {
  return (
    [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") ||
    tenant.email ||
    "this tenant"
  );
}

export default function ResidentUserPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tenantToDelete, setTenantToDelete] = useState<InvitedTenantItem | null>(null);
  const [tenantToSuspend, setTenantToSuspend] =
    useState<InvitedTenantItem | null>(null);
  const [tenantToActivate, setTenantToActivate] =
    useState<InvitedTenantItem | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const inviteTenantState = useSelector(
    (state: RootState) => (state as any).residentInviteTenant,
  );
  const inviteStatus = inviteTenantState?.status ?? "idle";

  const { list: tenants, status: tenantsStatus, pagination } = useSelector(
    (state: RootState) => {
      const s = (state as any).residentInvitedTenants;
      return {
        list: (s?.list ?? []) as InvitedTenantItem[],
        status: s?.status ?? "idle",
        pagination: s?.pagination ?? null,
      };
    }
  );

  const deleteUserState = useSelector(
    (state: RootState) => (state as any).adminUser?.deleteUserState ?? "idle"
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const residentType = (userRes?.data?.residentType ?? "")
          .toString()
          .toLowerCase();

        if (residentType === "tenant") {
          toast.error("Only owners can access Tenant Management.");
          router.replace("/dashboard/resident/dashboard");
          return;
        }
        await dispatch(getInvitedTenants({ page: 1, limit: PAGE_SIZE })).unwrap();
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch, router]);

  useEffect(() => {
    const shouldApplyDate = Boolean(startDate && endDate);
    setCurrentPage(1);
    dispatch(
      getInvitedTenants({
        page: 1,
        limit: PAGE_SIZE,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    dispatch(
      getInvitedTenants({
        page: newPage,
        limit: PAGE_SIZE,
        startDate: startDate && endDate ? startDate : undefined,
        endDate: startDate && endDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  };

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  const refreshTenants = useCallback(
    async (page = currentPage) => {
      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getInvitedTenants({
          page,
          limit: PAGE_SIZE,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    },
    [currentPage, dispatch, endDate, startDate],
  );

  const handleOpenDeleteModal = (tenant: InvitedTenantItem) => {
    const userId = tenantId(tenant);
    if (!userId) {
      toast.error("Cannot delete: missing user id.");
      return;
    }
    setTenantToDelete(tenant);
  };

  const handleCloseDeleteModal = () => setTenantToDelete(null);

  const handleConfirmDelete = async () => {
    if (!tenantToDelete) return;
    const userId = tenantId(tenantToDelete);
    if (!userId) return;
    try {
      await dispatch(deleteUser(userId)).unwrap();
      toast.success("Tenant deleted successfully.");
      setTenantToDelete(null);
      await refreshTenants();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const openSuspendModal = (tenant: InvitedTenantItem) => {
    const userId = tenantId(tenant);
    if (!userId || tenant.isActive === false) return;
    setTenantToSuspend(tenant);
  };

  const openActivateModal = (tenant: InvitedTenantItem) => {
    const userId = tenantId(tenant);
    if (!userId || tenant.isActive !== false) return;
    setTenantToActivate(tenant);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!tenantToSuspend) return;
    const userId = tenantId(tenantToSuspend);
    if (!userId) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(suspendUser({ id: userId, reason })).unwrap();
      toast.info(`${tenantDisplayName(tenantToSuspend)} has been suspended.`);
      setTenantToSuspend(null);
      await refreshTenants();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateConfirm = async (note: string) => {
    if (!tenantToActivate) return;
    const userId = tenantId(tenantToActivate);
    if (!userId) return;
    setActivateSubmitting(true);
    try {
      await dispatch(activateUser({ id: userId, note })).unwrap();
      toast.success(`${tenantDisplayName(tenantToActivate)} has been activated.`);
      setTenantToActivate(null);
      await refreshTenants();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setActivateSubmitting(false);
    }
  };

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (t: InvitedTenantItem) => formatDate(t.createdAt),
    },
    {
      key: "name",
      header: "Name",
      render: (t: InvitedTenantItem) =>
        [t.firstName, t.lastName].filter(Boolean).join(" ") || t.email || "—",
    },
    { key: "email", header: "Email", render: (t: InvitedTenantItem) => t.email ?? "—" },
    {
      key: "phoneNumber",
      header: "Phone",
      render: (t: InvitedTenantItem) => t.phoneNumber?.trim() || "—",
    },
    {
      key: "address",
      header: "Address",
      render: (t: InvitedTenantItem) => formatUserAddresses(t.addressIds) || "—",
      exportValue: (t: InvitedTenantItem) => formatUserAddresses(t.addressIds),
    },
    {
      key: "invitationStatus",
      header: "Invitation Status",
      render: (t: InvitedTenantItem) => t.invitationStatus ?? "—",
    },
    {
      key: "isActive",
      header: "Status",
      render: (t: InvitedTenantItem) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            t.isActive !== false
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {t.isActive !== false ? "Active" : "Suspended"}
        </span>
      ),
      exportValue: (t: InvitedTenantItem) =>
        t.isActive !== false ? "Active" : "Suspended",
    },
    {
      key: "action",
      header: "Action",
      exportable: false,
      render: (t: InvitedTenantItem) => (
        <div className="flex items-center gap-1">
          {t.isActive !== false ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openSuspendModal(t)}
              title="Suspend tenant"
              className="text-red-600 hover:text-red-700"
            >
              <PowerOff className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActivateModal(t)}
              title="Activate tenant"
              className="text-green-600 hover:text-green-700"
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDeleteModal(t)}
            disabled={deleteUserState === "isLoading"}
            title="Delete tenant"
            aria-label={`Delete ${tenantDisplayName(t)}`}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Tenant Management</h1>
        <p className="text-muted-foreground mt-1">
          As an owner, you can manage your tenants.
        </p>

        <Button
              onClick={handleOpenModal}
              className="flex items-center gap-2 shrink-0"
              disabled={inviteStatus === "isLoading"}
            >
              <Plus className="w-4 h-4" />
              Invite Tenant
            </Button>
      </div>
    

      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteTenantForm close={handleCloseModal} />
        </Modal>
      )}

      <DeleteModal
        visible={!!tenantToDelete}
        onClose={handleCloseDeleteModal}
        itemName={tenantToDelete ? tenantDisplayName(tenantToDelete) : ""}
        title="Delete tenant"
        message={
          tenantToDelete ? (
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete{" "}
              <strong>{tenantDisplayName(tenantToDelete)}</strong> ? This will
              remove their account.
            </p>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        loading={deleteUserState === "isLoading"}
      />

      <SuspendRentModal
        visible={!!tenantToSuspend}
        onClose={() => setTenantToSuspend(null)}
        tenantName={tenantToSuspend ? tenantDisplayName(tenantToSuspend) : ""}
        title="Suspend tenant"
        confirmLabel="Suspend"
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="e.g. Outstanding rent / policy violation"
        description={
          <>
            Are you sure you want to suspend{" "}
            <strong>
              {tenantToSuspend
                ? tenantDisplayName(tenantToSuspend)
                : "this tenant"}
            </strong>
            ? Please provide a reason.
          </>
        }
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />

      <SuspendRentModal
        visible={!!tenantToActivate}
        onClose={() => setTenantToActivate(null)}
        tenantName={tenantToActivate ? tenantDisplayName(tenantToActivate) : ""}
        title="Activate tenant"
        confirmLabel="Activate"
        requireReason
        reasonLabel="Note"
        reasonPlaceholder="e.g. Account restored"
        description={
          <>
            Are you sure you want to activate{" "}
            <strong>
              {tenantToActivate
                ? tenantDisplayName(tenantToActivate)
                : "this tenant"}
            </strong>
            ? Please add a short note.
          </>
        }
        onConfirm={handleActivateConfirm}
        loading={activateSubmitting}
      />
    </div>
  );
}
