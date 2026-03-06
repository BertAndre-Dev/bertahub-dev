"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getComplaintsByAddress,
  createComplaint,
} from "@/redux/slice/resident/maintenance/resident-complaints";
import type { CreateComplaintPayload } from "@/redux/slice/resident/maintenance/resident-complaints";
import { clearResidentComplaintsList } from "@/redux/slice/resident/maintenance/resident-complaints-slice";
import { getResidentEstateFields, getResidentFieldEntries } from "@/redux/slice/resident/address-options/resident-address-options";
import { ResidentComplaintCard } from "@/components/resident/maintenance/resident-complaint-card";
import { ResidentComplaintForm } from "@/components/resident/maintenance/resident-complaint-form";
import Modal from "@/components/modal/page";
import { Plus, Wrench } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";

export default function ResidentMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [firstFieldId, setFirstFieldId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { list, loading, createComplaintStatus } = useSelector((state: RootState) => {
    const s = state.residentComplaints as {
      list: unknown[];
      getComplaintsByAddressStatus?: string;
      createComplaintStatus?: string;
    };
    return {
      list: s?.list ?? [],
      loading: s?.getComplaintsByAddressStatus === "isLoading",
      createComplaintStatus: s?.createComplaintStatus ?? "idle",
    };
  });
  const addressOptions = useSelector((state: RootState) => {
    const s = state.residentAddressOptions as { options?: { value: string; label: string }[] };
    return s?.options ?? [];
  });

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? userRes;
        const eid = data?.estateId ?? data?.estate?.id ?? "";
        const rid = data?.id ?? data?._id ?? "";
        setEstateId(eid);
        setResidentId(rid);
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getResidentEstateFields(estateId))
      .unwrap()
      .then((res: unknown) => {
        const r = res as { data?: unknown[]; fields?: unknown[] };
        const arr = Array.isArray(r?.data) ? r.data : Array.isArray(r?.fields) ? r.fields : [];
        const first = arr[0] as { _id?: string; id?: string } | undefined;
        const fid = first?._id ?? first?.id ?? null;
        if (fid) setFirstFieldId(fid);
      })
      .catch(() => {});
  }, [estateId, dispatch]);

  useEffect(() => {
    if (firstFieldId) {
      dispatch(getResidentFieldEntries({ fieldId: firstFieldId }));
    }
  }, [firstFieldId, dispatch]);

  useEffect(() => {
    if (addressOptions.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addressOptions[0].value);
    }
  }, [addressOptions, selectedAddressId]);

  useEffect(() => {
    if (!selectedAddressId) return;
    dispatch(getComplaintsByAddress({ addressId: selectedAddressId, page: 1, limit: 50 })).catch(
      (err: unknown) =>
        toast.error((err as { message?: string })?.message ?? "Failed to load requests.")
    );
  }, [selectedAddressId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearResidentComplaintsList());
    };
  }, [dispatch]);

  const handleCreateSubmit = async (
    payload: Omit<CreateComplaintPayload, "residentId" | "estateId">
  ) => {
    if (!estateId || !residentId) {
      toast.error("Missing estate or user info.");
      return;
    }
    await dispatch(
      createComplaint({
        ...payload,
        residentId,
        estateId,
      })
    ).unwrap();
    toast.success("Maintenance request submitted.");
    setCreateOpen(false);
    if (selectedAddressId) {
      dispatch(getComplaintsByAddress({ addressId: selectedAddressId, page: 1, limit: 50 }));
    }
  };

  const expandableList = list as { id: string }[];
  const hasAddressOptions = addressOptions.length > 0;
  const canCreate = hasAddressOptions && estateId && residentId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your maintenance requests. Add a new request if something needs fixing.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New request
          </Button>
        )}
      </div>

      {addressOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Address:</span>
          <select
            aria-label="Select address"
            value={selectedAddressId ?? ""}
            onChange={(e) => setSelectedAddressId(e.target.value || null)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {addressOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedAddressId && addressOptions.length === 0 && !loading && (
        <p className="text-muted-foreground py-6 rounded-lg border border-border bg-muted/20 text-center">
          No address linked to your account. Please contact your estate admin to add an address.
        </p>
      )}

      {selectedAddressId && (
        <>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">
              Loading your requests...
            </p>
          ) : expandableList.length === 0 ? (
            <div className="py-12 rounded-lg border border-border bg-muted/20 text-center space-y-2">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No maintenance requests yet.</p>
              {canCreate && (
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {expandableList.map((complaint) => (
                <ResidentComplaintCard
                  key={complaint.id}
                  complaint={complaint as Parameters<typeof ResidentComplaintCard>[0]["complaint"]}
                  isExpanded={expandedId === complaint.id}
                  onToggle={() =>
                    setExpandedId((prev) => (prev === complaint.id ? null : complaint.id))
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {createOpen && canCreate && (
        <Modal visible={createOpen} onClose={() => setCreateOpen(false)}>
          <div className="p-4">
            <h2 className="font-heading text-xl font-semibold mb-4">
              New maintenance request
            </h2>
            <ResidentComplaintForm
              addressOptions={addressOptions}
              estateId={estateId}
              residentId={residentId}
              onSubmit={handleCreateSubmit}
              onCancel={() => setCreateOpen(false)}
              loading={createComplaintStatus === "isLoading"}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
