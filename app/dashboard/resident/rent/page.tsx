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
import {
  getResidentEstateFields,
  getResidentFieldEntries,
} from "@/redux/slice/resident/address-options/resident-address-options";
import {
  createRent,
  getOwnerRents,
  getRentById,
  type CreateRentPayload,
  type RentItem,
} from "@/redux/slice/resident/rent-mgt/rent-mgt";
import { clearCurrentRent } from "@/redux/slice/resident/rent-mgt/rent-mgt-slice";
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
    // return name || tenant.email || tenant.id || "—";
    return name || tenant.email || tenant.id || "—";
  }
  return typeof tenant === "string" ? tenant : "—";
}

export default function ResidentRentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [residentType, setResidentType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRentId, setViewRentId] = useState<string | null>(null);

  const {
    ownerRents,
    pagination,
    createRentStatus,
    getOwnerRentsStatus,
    currentRent,
    getRentByIdStatus,
  } = useSelector((state: RootState) => {
    const s = (state as RootState).residentRentMgt;
    return {
      ownerRents: s?.ownerRents ?? null,
      pagination: s?.pagination ?? null,
      createRentStatus: s?.createRentStatus ?? "idle",
      getOwnerRentsStatus: s?.getOwnerRentsStatus ?? "idle",
      currentRent: s?.currentRent ?? null,
      getRentByIdStatus: s?.getRentByIdStatus ?? "idle",
    };
  });

  const addressOptions = useSelector(
    (state: RootState) => ((state as { residentAddressOptions?: { options: { label: string; value: string }[] } }).residentAddressOptions?.options) ?? []
  );
  const addressOptionsLoading = useSelector(
    (state: RootState) => {
      const ro = (state as { residentAddressOptions?: { fieldsStatus?: string; entriesStatus?: string } }).residentAddressOptions;
      return (ro?.fieldsStatus === "isLoading") || (ro?.entriesStatus === "isLoading");
    }
  );

  const list = ownerRents ?? [];
  const loading = getOwnerRentsStatus === "isLoading";
  const isOwner = residentType === "owner";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const rType = userRes?.data?.residentType ?? userRes?.data?.resident_type ?? null;
        setResidentType(rType ?? null);
        await dispatch(getOwnerRents({ page: 1, limit: PAGE_SIZE })).unwrap();
      } catch {
        toast.error("Failed to load user or rents.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (createModalOpen && isOwner && addressOptions.length === 0 && !addressOptionsLoading) {
      (async () => {
        try {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          const estateId = userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
          if (!estateId) return;
          const fieldRes = await dispatch(getResidentEstateFields(estateId)).unwrap();
          const fields = (fieldRes as { data?: unknown[] })?.data ?? [];
          const fieldList = Array.isArray(fields) ? fields : [];
          const primaryFieldId = (fieldList[0] as { id?: string })?.id ?? "";
          if (primaryFieldId) {
            await dispatch(getResidentFieldEntries({ fieldId: primaryFieldId, page: 1, limit: 200 })).unwrap();
          }
        } catch {
          toast.error("Failed to load address options.");
        }
      })();
    }
  }, [createModalOpen, isOwner, addressOptions.length, addressOptionsLoading, dispatch]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    dispatch(getOwnerRents({ page: newPage, limit: PAGE_SIZE })).catch(() =>
      toast.error("Failed to load rents.")
    );
  };

  const handleViewRent = (id: string) => {
    setViewRentId(id);
    dispatch(getRentById(id)).catch(() => toast.error("Failed to load rent details."));
  };

  const columns = [
    { key: "addressId", header: "Address", render: (item: RentItem) => formatAddress(item) },
    { key: "tenantId", header: "Tenant", render: (item: RentItem) => formatTenant(item) },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: RentItem) => (item.amount != null ? Number(item.amount).toLocaleString() : "—"),
    },
    { key: "startDate", header: "Start Date", render: (item: RentItem) => formatDate(item.startDate) },
    { key: "endDate", header: "End Date", render: (item: RentItem) => formatDate(item.endDate) },
    { key: "notes", header: "Notes", render: (item: RentItem) => (item.notes ?? "—").slice(0, 40) + (item.notes && item.notes.length > 40 ? "…" : "") },
    ...(isOwner
      ? [
          {
            key: "actions",
            header: "Action",
            exportable: false as const,
            render: (item: RentItem) =>
              item.id ? (
                <Button size="sm" variant="outline" onClick={() => handleViewRent(item.id!)}>
                  View
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Rent Management</h1>
          <p className="text-muted-foreground mt-1">
            {isOwner ? "Create and view rent records for your properties." : "View your rent records."}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setCreateModalOpen(true)} className="shrink-0">
            Create Rent
          </Button>
        )}
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={list}
          emptyMessage={loading ? "Loading rents..." : "No rent records found."}
          showPagination
          paginationInfo={{
            total: pagination?.total ?? 0,
            current: pagination?.currentPage ?? currentPage,
            pageSize: pagination?.pageSize ?? PAGE_SIZE,
          }}
          onPageChange={handlePageChange}
          enableExport
          exportFileName="rents"
          onExportRequest={
            isOwner
              ? async () => {
                  const res = await dispatch(getOwnerRents({ page: 1, limit: 50000 })).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      {/* Create Rent Modal */}
      <Modal visible={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <CreateRentForm
          addressOptions={addressOptions}
          addressOptionsLoading={addressOptionsLoading}
          createLoading={createRentStatus === "isLoading"}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            dispatch(getOwnerRents({ page: currentPage, limit: PAGE_SIZE }));
          }}
        />
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
    </div>
  );
}

interface CreateRentFormProps {
  readonly addressOptions: { label: string; value: string }[];
  readonly addressOptionsLoading: boolean;
  readonly createLoading: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

function CreateRentForm({
  addressOptions,
  addressOptionsLoading,
  createLoading,
  onClose,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.addressId?.trim()) {
      toast.error("Please select an address.");
      return;
    }
    if (!form.tenantId?.trim()) {
      toast.error("Please enter tenant ID.");
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
        startDate: form.startDate ? new Date(form.startDate + "T00:00:00Z").toISOString() : "",
        endDate: form.endDate ? new Date(form.endDate + "T00:00:00Z").toISOString() : "",
      };
      await dispatch(createRent(payload)).unwrap();
      toast.success("Rent created successfully.");
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to create rent.";
      toast.error(msg);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <h2 className="font-heading text-xl font-bold mb-1">Create Rent</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Only owners can create rent records. Fill in the details below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="addressId">Address</Label>
            <Select
              id="addressId"
              options={[
                { label: "Select address...", value: "" },
                ...addressOptions.map((o) => ({ label: o.label, value: o.value })),
              ]}
              value={form.addressId}
              onChange={(e) => setForm((p) => ({ ...p, addressId: e.target.value }))}
              className="mt-1 w-full"
              required
            />
            {addressOptionsLoading && (
              <p className="text-xs text-muted-foreground mt-1">Loading addresses...</p>
            )}
          </div>
          <div>
            <Label htmlFor="tenantId">Tenant ID</Label>
            <Input
              id="tenantId"
              value={form.tenantId}
              onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value.trim() }))}
              placeholder="e.g. 507f1f77bcf86cd799439012"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={form.amount || ""}
              onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) || 0 }))}
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
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
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
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Monthly rent for apartment 301"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={addressOptionsLoading || createLoading} className="flex-1">
              {createLoading ? "Creating..." : "Create Rent"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
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
  onClose,
}: Readonly<{
  rent: RentItem | null;
  loading: boolean;
  onClose: () => void;
}>) {
  if (loading) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">Loading rent details...</p>
      </Card>
    );
  }
  if (!rent) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <p className="text-muted-foreground text-center">Rent not found.</p>
        <Button className="mt-4 w-full" onClick={onClose}>Close</Button>
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
            {addr?.data ? Object.entries(addr.data).map(([k, v]) => `${k}: ${v}`).join(", ") : (typeof rent.addressId === "string" ? rent.addressId : "—")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tenant</dt>
          <dd className="font-medium">
            {tenant ? [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") || tenant.email : (typeof rent.tenantId === "string" ? rent.tenantId : "—")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">₦{rent.amount != null ? Number(rent.amount).toLocaleString() : "—"}</dd>
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
      <Button className="mt-6 w-full" onClick={onClose}>Close</Button>
    </Card>
  );
}
