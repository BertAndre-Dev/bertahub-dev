"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { ResidentComplaintCard } from "@/components/resident/maintenance/resident-complaint-card";
import { ResidentComplaintForm } from "@/components/resident/maintenance/resident-complaint-form";
import Modal from "@/components/modal/page";
import { Plus, Wrench } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { normalizeAddresses, formatAddressLabel, type AddressOption } from "@/lib/address";
import SwitchAddress from "@/components/resident/switch-address/page";

export default function ResidentMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
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

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const eid = (data?.estateId ?? (data?.estate as { id?: string })?.id ?? "") as string;
        const rid = (data?.id ?? data?._id ?? "") as string;
        const addresses = normalizeAddresses(data);
        const firstId = addresses.length > 0 ? addresses[0].id : null;
        setEstateId(eid);
        setResidentId(rid);
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

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

  // ResidentComplaintForm expects { value, label }[]
  const addressSelectOptions = useMemo(
    () =>
      addressOptions.map((a) => ({
        value: a.id,
        label: formatAddressLabel(a),
      })),
    [addressOptions],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Maintenance</h1>
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

      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={setSelectedAddressId}
      />

      {!selectedAddressId && addressOptions.length === 0 && !loading && (
        <p className="text-muted-foreground py-6 rounded-lg border border-border bg-muted/20 text-center">
          No address linked to your account.
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
              addressOptions={addressSelectOptions}
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
