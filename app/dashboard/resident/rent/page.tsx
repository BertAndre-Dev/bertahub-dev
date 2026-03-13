"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getInvitedTenants } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import type { InvitedTenantItem } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import {
  getOwnerRents,
  getTenantRents,
  getRentById,
  deleteRent,
  activateRent,
  suspendRent,
  payRent,
  type RentItem,
} from "@/redux/slice/resident/rent-mgt/rent-mgt";
import { clearCurrentRent } from "@/redux/slice/resident/rent-mgt/rent-mgt-slice";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import PayRentModal from "@/components/resident/pay-rent-modal/page";
import CreateRentForm from "@/components/resident/rent/create-rent-form/page";
import UpdateRentForm from "@/components/resident/rent/update-rent-form/page";
import ViewRentModal from "@/components/resident/rent/view-rent-modal/page";
import SelectRentToPayModal from "@/components/resident/rent/select-rent-to-pay-modal/page";
import { formatDate, formatAddress, formatTenant } from "@/components/resident/rent/utils";
import {
  Eye,
  Pencil,
  PlayCircle,
  PauseCircle,
  Trash2,
  Banknote,
} from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";

const PAGE_SIZE = 10;

export default function ResidentRentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editRentId, setEditRentId] = useState<string | null>(null);
  const [residentType, setResidentType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRentId, setViewRentId] = useState<string | null>(null);
  const [suspendRentItem, setSuspendRentItem] = useState<RentItem | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [payRentItem, setPayRentItem] = useState<RentItem | null>(null);
  const [selectRentModalOpen, setSelectRentModalOpen] = useState(false);
  const [walletId, setWalletId] = useState<string | null>(null);

  const {
    ownerRents,
    tenantRents,
    pagination,
    tenantPagination,
    createRentStatus,
    getOwnerRentsStatus,
    getTenantRentsStatus,
    payRentStatus,
    currentRent,
    getRentByIdStatus,
  } = useSelector((state: RootState) => {
    const s = (state as RootState).residentRentMgt;
    return {
      ownerRents: s?.ownerRents ?? null,
      tenantRents: s?.tenantRents ?? null,
      pagination: s?.pagination ?? null,
      tenantPagination: s?.tenantPagination ?? null,
      createRentStatus: s?.createRentStatus ?? "idle",
      getOwnerRentsStatus: s?.getOwnerRentsStatus ?? "idle",
      getTenantRentsStatus: s?.getTenantRentsStatus ?? "idle",
      payRentStatus: s?.payRentStatus ?? "idle",
      currentRent: s?.currentRent ?? null,
      getRentByIdStatus: s?.getRentByIdStatus ?? "idle",
    };
  });

  const { list: tenantList, status: tenantListStatus } = useSelector(
    (state: RootState) => {
      const s = (state as any).residentInvitedTenants;
      return {
        list: (s?.list ?? []) as InvitedTenantItem[],
        status: s?.status ?? "idle",
      };
    },
  );
  const tenantListLoading = tenantListStatus === "isLoading";

  const isOwner = residentType === "owner";
  const list = isOwner ? (ownerRents ?? []) : (tenantRents ?? []);
  const loading = isOwner
    ? getOwnerRentsStatus === "isLoading"
    : getTenantRentsStatus === "isLoading";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const rType =
          userRes?.data?.residentType ?? userRes?.data?.resident_type ?? null;
        setResidentType(rType ?? null);
        setWalletId(
          userRes?.data?.walletId ?? userRes?.data?.wallet?.id ?? null,
        );
        if (rType === "owner") {
          await dispatch(getOwnerRents({ page: 1, limit: PAGE_SIZE })).unwrap();
        } else {
          await dispatch(
            getTenantRents({ page: 1, limit: PAGE_SIZE }),
          ).unwrap();
        }
      } catch {
        toast.error("Failed to load user or rents.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (createModalOpen && isOwner) {
      (async () => {
        try {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          const rawEstate = userRes?.data?.estateId ?? userRes?.data?.estate;

          let estateId = "";
          if (typeof rawEstate === "string") {
            estateId = rawEstate;
          } else if (rawEstate && typeof rawEstate === "object") {
            estateId = (rawEstate as { id?: string }).id ?? "";
          }

          if (!estateId) return;
          await dispatch(
            getInvitedTenants({ estateId, page: 1, limit: 200 }),
          ).unwrap();
        } catch {
          toast.error("Failed to load tenants.");
        }
      })();
    }
  }, [createModalOpen, isOwner, dispatch]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const fetcher = isOwner ? getOwnerRents : getTenantRents;
    dispatch(fetcher({ page: newPage, limit: PAGE_SIZE })).catch(() =>
      toast.error("Failed to load rents."),
    );
  };

  const handleViewRent = (id: string) => {
    setViewRentId(id);
    dispatch(getRentById(id)).catch(() =>
      toast.error("Failed to load rent details."),
    );
  };

  const refreshList = () => {
    const fetcher = isOwner ? getOwnerRents : getTenantRents;
    dispatch(fetcher({ page: currentPage, limit: PAGE_SIZE })).catch(() =>
      toast.error("Failed to refresh rents."),
    );
  };

  const handleDeleteRent = (item: RentItem) => {
    if (!item.id) return;
    const tenantName = formatTenant(item);
    confirmDeleteToast({
      name: tenantName ? `rent for ${tenantName}` : "this rent record",
      onConfirm: async () => {
        await dispatch(deleteRent(item.id!)).unwrap();
        toast.success("Rent deleted.");
        refreshList();
      },
    });
  };

  const handleActivateRent = (item: RentItem) => {
    if (!item.id) return;
    dispatch(activateRent(item.id))
      .unwrap()
      .then(() => {
        toast.success("Rent activated.");
        refreshList();
      })
      .catch((err: { message?: string }) =>
        toast.error(err?.message ?? "Failed to activate rent."),
      );
  };

  const handleSuspendRent = (item: RentItem) => {
    if (!item.id) return;
    setSuspendRentItem(item);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendRentItem?.id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(
        suspendRent({ rentId: suspendRentItem.id, reason }),
      ).unwrap();
      toast.success("Rent suspended.");
      setSuspendRentItem(null);
      refreshList();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to suspend rent.",
      );
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const rentsWithBalance = list.filter(
    (r) =>
      (r.status === "active" || !r.status) &&
      Number(r.amount ?? 0) - Number(r.amountPaid ?? 0) > 0,
  );

  const handlePayRentClick = () => {
    if (rentsWithBalance.length === 0) {
      toast.info("No rent with remaining balance to pay.");
      return;
    }
    if (rentsWithBalance.length === 1) {
      setPayRentItem(rentsWithBalance[0]);
      return;
    }
    setSelectRentModalOpen(true);
  };

  const handleSelectRentPay = (item: RentItem) => {
    setPayRentItem(item);
    setSelectRentModalOpen(false);
  };

  const handlePayRentConfirm = async (payload: {
    rentId: string;
    amount: number;
    paymentMethod: string;
    reference: string;
  }) => {
    try {
      await dispatch(payRent(payload)).unwrap();
      toast.success("Rent payment successful.");
      setPayRentItem(null);
      refreshList();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to pay rent.",
      );
    }
  };

  const statusLabel = (status?: string) =>
    status === "suspended" ? "Suspended" : status === "active" ? "Active" : "—";

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: RentItem) => formatDate(item.createdAt),
    },
    {
      key: "addressId",
      header: "Address",
      render: (item: RentItem) => formatAddress(item),
    },
    {
      key: "tenantId",
      header: "Tenant",
      render: (item: RentItem) => formatTenant(item),
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: RentItem) =>
        item.amount != null ? Number(item.amount).toLocaleString() : "—",
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: RentItem) => formatDate(item.startDate),
    },
    {
      key: "endDate",
      header: "End Date",
      render: (item: RentItem) => formatDate(item.endDate),
    },
    {
      key: "status",
      header: "Status",
      render: (item: RentItem) => (
        <span
          className={
            item.status === "suspended" ? "text-amber-600" : "text-green-600"
          }
        >
          {statusLabel(item.status)}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (item: RentItem) =>
        (item.notes ?? "—").slice(0, 40) +
        (item.notes && item.notes.length > 40 ? "…" : ""),
    },
    ...(isOwner
      ? [
          {
            key: "actions",
            header: "Actions",
            exportable: false as const,
            render: (item: RentItem) =>
              item.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewRent(item.id!)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditRentId(item.id!)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {item.status !== "active" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleActivateRent(item)}
                      title="Activate"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {item.status === "active" || !item.status ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600"
                      onClick={() => handleSuspendRent(item)}
                      title="Suspend"
                    >
                      <PauseCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteRent(item)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null,
          },
        ]
      : [
          {
            key: "actions",
            header: "Actions",
            exportable: false as const,
            render: (item: RentItem) =>
              item.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewRent(item.id!)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ) : null,
          },
        ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Rent Management</h1>
          <p className="text-muted-foreground mt-1">
            {isOwner
              ? "Create and view rent records for your properties."
              : "View your rent records."}
          </p>
        </div>
        {isOwner ? (
          <Button onClick={() => setCreateModalOpen(true)} className="shrink-0">
            Create Rent
          </Button>
        ) : (
          <Button
            onClick={handlePayRentClick}
            className="shrink-0 flex items-center gap-2"
            disabled={rentsWithBalance.length === 0}
          >
            <Banknote className="h-4 w-4" />
            Pay Rent
          </Button>
        )}
      </div>

      <SelectRentToPayModal
        visible={selectRentModalOpen}
        onClose={() => setSelectRentModalOpen(false)}
        rentsWithBalance={rentsWithBalance}
        onSelect={handleSelectRentPay}
      />

      <Card className="p-4">
        <Table
          columns={columns}
          data={list}
          emptyMessage={loading ? "Loading rents..." : "No rent records found."}
          showPagination
          paginationInfo={{
            total: (isOwner ? pagination : tenantPagination)?.total ?? 0,
            current:
              (isOwner ? pagination : tenantPagination)?.currentPage ??
              currentPage,
            pageSize:
              (isOwner ? pagination : tenantPagination)?.pageSize ?? PAGE_SIZE,
          }}
          onPageChange={handlePageChange}
          enableExport
          exportFileName="rents"
          onExportRequest={
            isOwner
              ? async () => {
                  const res = await dispatch(
                    getOwnerRents({ page: 1, limit: 50000 }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : async () => {
                  const res = await dispatch(
                    getTenantRents({ page: 1, limit: 50000 }),
                  ).unwrap();
                  return res?.data ?? [];
                }
          }
        />
      </Card>

      {/* Create Rent Modal */}
      <Modal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      >
        <CreateRentForm
          tenantList={tenantList}
          tenantListLoading={tenantListLoading}
          createLoading={createRentStatus === "isLoading"}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            dispatch(getOwnerRents({ page: currentPage, limit: PAGE_SIZE }));
          }}
        />
      </Modal>

      {/* Edit Rent Modal */}
      <Modal visible={!!editRentId} onClose={() => setEditRentId(null)}>
        {editRentId ? (
          <UpdateRentForm
            rent={list.find((r) => r.id === editRentId) ?? null}
            onClose={() => setEditRentId(null)}
            onSuccess={() => {
              setEditRentId(null);
              refreshList();
            }}
          />
        ) : null}
      </Modal>

      {/* View Rent Detail Modal */}
      <Modal
        visible={!!viewRentId}
        onClose={() => {
          setViewRentId(null);
          dispatch(clearCurrentRent());
        }}
      >
        <ViewRentModal
          rent={currentRent}
          loading={getRentByIdStatus === "isLoading"}
          onClose={() => {
            setViewRentId(null);
            dispatch(clearCurrentRent());
          }}
        />
      </Modal>

      {/* Suspend Rent Modal (reusable: tenant name + required reason) */}
      <SuspendRentModal
        visible={!!suspendRentItem}
        onClose={() => setSuspendRentItem(null)}
        tenantName={suspendRentItem ? formatTenant(suspendRentItem) : ""}
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />

      <PayRentModal
        visible={!!payRentItem}
        onClose={() => setPayRentItem(null)}
        rent={payRentItem}
        walletId={walletId}
        onConfirm={handlePayRentConfirm}
        loading={payRentStatus === "isLoading"}
      />
    </div>
  );
}
