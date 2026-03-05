"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getInvitedTenants } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import type { InvitedTenantItem } from "@/redux/slice/resident/invited-tenants/invited-tenants";
import {
  createRent,
  getOwnerRents,
  getTenantRents,
  getRentById,
  deleteRent,
  updateRent,
  activateRent,
  suspendRent,
  payRent,
  type CreateRentPayload,
  type RentItem,
  type UpdateRentPayload,
} from "@/redux/slice/resident/rent-mgt/rent-mgt";
import { clearCurrentRent } from "@/redux/slice/resident/rent-mgt/rent-mgt-slice";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import PayRentModal from "@/components/resident/pay-rent-modal/page";
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

function formatDate(val: string | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString();
  } catch {
    return val;
  }
}

function formatAddress(rent: RentItem) {
  const addr = rent.addressId;
  if (!addr) return "—";
  if (typeof addr === "object" && addr?.data) {
    const str = Object.entries(addr.data)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return str || (addr && "id" in addr ? addr.id : "") || "—";
  }
  return typeof addr === "string" ? addr : "—";
}

function formatTenant(rent: RentItem) {
  const tenant = rent.tenantId;
  if (!tenant) return "—";
  if (typeof tenant === "object") {
    const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
    return name || tenant.email || tenant.id || "—";
  }
  return typeof tenant === "string" ? tenant : "—";
}

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
          const estateId =
            userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
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

      {/* Select which rent to pay (when tenant has multiple) */}
      <Modal
        visible={selectRentModalOpen}
        onClose={() => setSelectRentModalOpen(false)}
      >
        <div className="p-4 max-w-md">
          <h2 className="font-heading text-xl font-bold mb-4">
            Select rent to pay
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rentsWithBalance.map((r) => {
              const remaining =
                Number(r.amount ?? 0) - Number(r.amountPaid ?? 0);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div>
                    <p className="font-medium">{formatAddress(r)}</p>
                    <p className="text-sm text-muted-foreground">
                      Remaining: ₦{remaining.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleSelectRentPay(r)}>
                    Pay
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

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

function formatAddressFromData(data?: Record<string, string>): string {
  if (!data) return "—";
  const str = Object.entries(data)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return str || "—";
}

function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

interface UpdateRentFormProps {
  readonly rent: RentItem | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

function UpdateRentForm({ rent, onClose, onSuccess }: UpdateRentFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(rent?.amount ?? 0);
  const [startDate, setStartDate] = useState(isoToDateInput(rent?.startDate));
  const [endDate, setEndDate] = useState(isoToDateInput(rent?.endDate));
  const [notes, setNotes] = useState(rent?.notes ?? "");

  useEffect(() => {
    if (rent) {
      setAmount(rent.amount ?? 0);
      setStartDate(isoToDateInput(rent.startDate));
      setEndDate(isoToDateInput(rent.endDate));
      setNotes(rent.notes ?? "");
    }
  }, [rent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rent?.id) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!startDate?.trim()) {
      toast.error("Please enter start date.");
      return;
    }
    if (!endDate?.trim()) {
      toast.error("Please enter end date.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: UpdateRentPayload = {
        id: rent.id,
        amount: amt,
        startDate: new Date(startDate + "T00:00:00Z").toISOString(),
        endDate: new Date(endDate + "T00:00:00Z").toISOString(),
        currency: "NGN",
        notes: notes.trim() || undefined,
      };
      await dispatch(updateRent(payload)).unwrap();
      toast.success("Rent updated.");
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to update rent.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!rent) {
    return (
      <Card className="max-w-lg mx-auto p-6">
        <p className="text-muted-foreground text-center">Rent not found.</p>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <h2 className="font-heading text-xl font-bold mb-1">Edit Rent</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update amount, dates, or notes. Tenant and address cannot be changed
          here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Address</Label>
            <p className="text-sm mt-1 text-muted-foreground">
              {formatAddress(rent)}
            </p>
          </div>
          <div>
            <Label>Tenant</Label>
            <p className="text-sm mt-1 text-muted-foreground">
              {formatTenant(rent)}
            </p>
          </div>
          <div>
            <Label htmlFor="edit-amount">Amount (₦)</Label>
            <Input
              id="edit-amount"
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-startDate">Start Date</Label>
            <Input
              id="edit-startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-endDate">End Date</Label>
            <Input
              id="edit-endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly rent"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

interface CreateRentFormProps {
  readonly tenantList: InvitedTenantItem[];
  readonly tenantListLoading: boolean;
  readonly createLoading: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

function CreateRentForm({
  tenantList,
  tenantListLoading,
  createLoading,
  onSuccess,
}: CreateRentFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState<CreateRentPayload>({
    addressId: "",
    tenantId: "",
    amount: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });

  const selectedTenant = tenantList.find((t) => t.id === form.tenantId);
  const addressOptions = (selectedTenant?.addressIds ?? []).map((addr) => ({
    label: formatAddressFromData(addr.data),
    value: addr._id,
  }));

  const handleTenantChange = (tenantId: string) => {
    setForm((p) => ({ ...p, tenantId, addressId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId?.trim()) {
      toast.error("Please select a tenant.");
      return;
    }
    if (!form.addressId?.trim()) {
      toast.error("Please select an address for this tenant.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!form.startDate?.trim()) {
      toast.error("Please enter start date.");
      return;
    }
    if (!form.endDate?.trim()) {
      toast.error("Please enter end date.");
      return;
    }
    try {
      const payload: CreateRentPayload = {
        ...form,
        startDate: form.startDate
          ? new Date(form.startDate + "T00:00:00Z").toISOString()
          : "",
        endDate: form.endDate
          ? new Date(form.endDate + "T00:00:00Z").toISOString()
          : "",
      };
      await dispatch(createRent(payload)).unwrap();
      toast.success("Rent created successfully.");
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to create rent.";
      toast.error(msg);
    }
  };

  const tenantSelectOptions = [
    { label: "Select tenant...", value: "" },
    ...tenantList.map((t) => ({
      label:
        [t.firstName, t.lastName].filter(Boolean).join(" ") || t.email || t.id,
      value: t.id,
    })),
  ];

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <h2 className="font-heading text-xl font-bold mb-1">Create Rent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenantId">Tenant</Label>
            <Select
              id="tenantId"
              options={tenantSelectOptions}
              value={form.tenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              className="mt-1 w-full"
              required
            />
            {tenantListLoading && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading tenants...
              </p>
            )}
            {form.tenantId && selectedTenant && (
              <div className="mt-2 rounded-md border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Addresses for this tenant
                </p>
                {addressOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No addresses on file.
                  </p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {addressOptions.map((o) => (
                      <li key={o.value}>{o.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="addressId">Address (for this tenant)</Label>
            <Select
              id="addressId"
              options={[
                { label: "Select address...", value: "" },
                ...addressOptions,
              ]}
              value={form.addressId}
              onChange={(e) =>
                setForm((p) => ({ ...p, addressId: e.target.value }))
              }
              className="mt-1 w-full"
              required
              disabled={!form.tenantId || addressOptions.length === 0}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={form.amount || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: Number(e.target.value) || 0 }))
              }
              placeholder="500000"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="e.g. Monthly rent for apartment 301"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={tenantListLoading || createLoading}
              className="flex-1"
            >
              {createLoading ? "Creating..." : "Create Rent"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

function ViewRentModal({
  rent,
  loading,
}: Readonly<{
  rent: RentItem | null;
  loading: boolean;
  onClose: () => void;
}>) {
  if (loading) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">
          Loading rent details...
        </p>
      </Card>
    );
  }
  if (!rent) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">Rent not found.</p>
      </Card>
    );
  }
  const tenant = typeof rent.tenantId === "object" ? rent.tenantId : null;
  const addr = typeof rent.addressId === "object" ? rent.addressId : null;
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="font-heading text-xl font-bold mb-4">Rent Details</h2>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="font-medium">
            {addr?.data
              ? Object.entries(addr.data)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
              : typeof rent.addressId === "string"
                ? rent.addressId
                : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tenant</dt>
          <dd className="font-medium">
            {tenant
              ? [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") ||
                tenant.email
              : typeof rent.tenantId === "string"
                ? rent.tenantId
                : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">
            ₦{rent.amount != null ? Number(rent.amount).toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Start Date</dt>
          <dd className="font-medium">{formatDate(rent.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">End Date</dt>
          <dd className="font-medium">{formatDate(rent.endDate)}</dd>
        </div>
        {rent.notes && (
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="font-medium">{rent.notes}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
