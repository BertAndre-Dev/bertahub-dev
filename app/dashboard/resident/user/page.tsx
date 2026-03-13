"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import InviteTenantForm from "@/components/resident/invite-tenant-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getInvitedTenants } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import type { InvitedTenantItem } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import { deleteUser } from "@/redux/slice/admin/user-mgt/user";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";

const PAGE_SIZE = 10;

function formatDate(val: string | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString();
  } catch {
    return val;
  }
}

export default function ResidentUserPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tenantToDelete, setTenantToDelete] = useState<InvitedTenantItem | null>(null);

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

        const rawEstate = userRes?.data?.estateId ?? userRes?.data?.estate;

        let id = "";
        if (typeof rawEstate === "string") {
          id = rawEstate;
        } else if (rawEstate && typeof rawEstate === "object") {
          id = (rawEstate as { id?: string }).id ?? "";
        }

        if (!id) return;
        setEstateId(id);
        await dispatch(
          getInvitedTenants({ estateId: id, page: 1, limit: PAGE_SIZE })
        ).unwrap();
      } catch {
        toast.error("Failed to load tenants.");
      }
    })();
  }, [dispatch, router]);

  const handlePageChange = (newPage: number) => {
    if (!estateId) return;
    setCurrentPage(newPage);
    dispatch(
      getInvitedTenants({ estateId, page: newPage, limit: PAGE_SIZE })
    ).catch(() => toast.error("Failed to load tenants."));
  };

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  const handleOpenDeleteModal = (tenant: InvitedTenantItem) => {
    const userId = tenant.id || (tenant as { _id?: string })._id;
    if (!userId) {
      toast.error("Cannot delete: missing user id.");
      return;
    }
    setTenantToDelete(tenant);
  };

  const handleCloseDeleteModal = () => setTenantToDelete(null);

  const handleConfirmDelete = async () => {
    if (!tenantToDelete || !estateId) return;
    const userId = tenantToDelete.id || (tenantToDelete as { _id?: string })._id;
    if (!userId) return;
    await dispatch(deleteUser(userId)).unwrap();
    toast.success("Tenant deleted successfully.");
    setTenantToDelete(null);
    await dispatch(
      getInvitedTenants({ estateId, page: currentPage, limit: PAGE_SIZE })
    ).unwrap();
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (t: InvitedTenantItem) =>
        [t.firstName, t.lastName].filter(Boolean).join(" ") || t.email || "—",
    },
    { key: "email", header: "Email", render: (t: InvitedTenantItem) => t.email ?? "—" },
    {
      key: "invitationStatus",
      header: "Invitation Status",
      render: (t: InvitedTenantItem) => t.invitationStatus ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (t: InvitedTenantItem) => formatDate(t.createdAt),
    },
    {
      key: "action",
      header: "Action",
      render: (t: InvitedTenantItem) => (
        <button
          type="button"
          onClick={() => handleOpenDeleteModal(t)}
          disabled={deleteUserState === "isLoading"}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          title="Delete tenant"
          aria-label={`Delete ${t.firstName ?? t.email ?? "tenant"}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Invite Tenant</h1>
        <p className="text-muted-foreground mt-1">
          As an owner, you can invite tenants to your unit(s). They will receive
          an email to set up their account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Invite a tenant</p>
              <p className="font-heading text-2xl font-bold mt-2">
                Add tenants to your address(es)
              </p>
            </div>

            <Button
              onClick={handleOpenModal}
              className="flex items-center gap-2 shrink-0"
              disabled={inviteStatus === "isLoading"}
            >
              <Plus className="w-4 h-4" />
              Invite Tenant
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-heading text-lg font-semibold mb-4">Your tenants</h2>
          <Table<InvitedTenantItem>
            columns={columns}
            data={tenants}
            emptyMessage={
              tenantsStatus === "isLoading"
                ? "Loading tenants..."
                : "You have not invited any tenants yet."
            }
            showPagination
            paginationInfo={{
              total: pagination?.total ?? 0,
              current: pagination?.page ?? currentPage,
              pageSize: pagination?.limit ?? PAGE_SIZE,
            }}
            onPageChange={handlePageChange}
            enableExport
            exportFileName="tenants"
            onExportRequest={
              estateId
                ? async () => {
                    const res = await dispatch(
                      getInvitedTenants({ estateId, page: 1, limit: 50000 })
                    ).unwrap();
                    return (res?.data ?? []) as InvitedTenantItem[];
                  }
                : undefined
            }
          />
        </Card>
      </div>

      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteTenantForm close={handleCloseModal} />
        </Modal>
      )}

      <DeleteModal
        visible={!!tenantToDelete}
        onClose={handleCloseDeleteModal}
        itemName={
          tenantToDelete
            ? [tenantToDelete.firstName, tenantToDelete.lastName]
                .filter(Boolean)
                .join(" ") || tenantToDelete.email || "this tenant"
            : ""
        }
        title="Delete tenant"
        message={
          tenantToDelete ? (
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete{" "}
              <strong>
                {[tenantToDelete.firstName, tenantToDelete.lastName]
                  .filter(Boolean)
                  .join(" ") || tenantToDelete.email || "this tenant"}
              </strong>{" "}
              ? This will remove their account.
            </p>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        loading={deleteUserState === "isLoading"}
      />
    </div>
  );
}
