"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getComplaintsByAddresses,
  createComplaint,
} from "@/redux/slice/resident/maintenance/resident-complaints";
import type { ResidentComplaintItem } from "@/redux/slice/resident/maintenance/resident-complaints-slice";
import {
  ResidentComplaintForm,
  ResidentComplaintCard,
} from "@/components/resident/maintenance";
import { RootState, AppDispatch } from "@/redux/store";

export default function ResidentMaintenancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [addressIds, setAddressIds] = useState<string[]>([]);
  const [estateId, setEstateId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { complaints, loading, createComplaintStatus } = useSelector(
    (state: RootState) => {
      const s = state.residentComplaints as any;
      return {
        complaints: s?.complaints?.data ?? [],
        loading: s?.getComplaintsStatus === "isLoading",
        createComplaintStatus: s?.createComplaintStatus === "isLoading",
      };
    }
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data;
        if (!user) {
          toast.warning("No signed in user found.");
          return;
        }
        const id = user.id ?? user._id ?? "";
        const eId = user.estateId ?? user.estate?.id ?? "";
        const addrs = user.addressIds ?? (user.addressId ? [user.addressId] : []);
        setResidentId(id);
        setEstateId(eId);
        setAddressIds(Array.isArray(addrs) ? addrs : []);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (addressIds.length === 0) return;
    dispatch(
      getComplaintsByAddresses({ addressIds, page: 1, limit: 50 })
    ).catch((err: any) =>
      toast.error(err?.message ?? "Failed to load requests.")
    );
  }, [addressIds, dispatch]);

  const handleCreateSubmit = async (
    payload: Omit<
      import("@/redux/slice/resident/maintenance/resident-complaints").CreateComplaintPayload,
      "residentId" | "estateId"
    >
  ) => {
    if (!residentId || !estateId) {
      toast.error("Missing user or estate.");
      return;
    }
    try {
      await dispatch(
        createComplaint({
          ...payload,
          residentId,
          estateId,
          status: "pending",
        })
      ).unwrap();
      toast.success("Maintenance request submitted.");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(
        (err?.payload as { message?: string })?.message ??
          err?.message ??
          "Failed to submit."
      );
    }
  };

  const addressOptions = addressIds.map((id, i) => ({
    value: id,
    label: addressIds.length > 1 ? `Address ${i + 1}` : "My address",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Maintenance requests
          </h1>
          <p className="text-muted-foreground mt-1">
            View and submit maintenance requests for your unit(s).
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          disabled={!residentId || !estateId || addressIds.length === 0}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New request
        </Button>
      </div>

      {addressIds.length === 0 && !loading && (
        <p className="text-muted-foreground py-8 text-center rounded-lg border border-border bg-muted/20">
          No address linked to your account. Contact your estate admin.
        </p>
      )}

      {loading && (
        <p className="text-muted-foreground py-8 text-center">
          Loading your requests...
        </p>
      )}

      {!loading && addressIds.length > 0 && complaints.length === 0 && (
        <p className="text-muted-foreground py-8 text-center rounded-lg border border-border bg-muted/20">
          No maintenance requests yet. Use &quot;New request&quot; to submit one.
        </p>
      )}

      {!loading && complaints.length > 0 && (
        <div className="space-y-4">
          {(complaints as ResidentComplaintItem[]).map((c) => (
            <ResidentComplaintCard
              key={c.id}
              complaint={c}
              isExpanded={expandedId === c.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === c.id ? null : c.id))
              }
            />
          ))}
        </div>
      )}
 
        <Modal visible={modalOpen} onClose={() => setModalOpen(false)}> 
        <div className="p-4">
          <h2 className="font-heading text-xl font-bold mb-4">
            New maintenance request
          </h2>
          <ResidentComplaintForm
            addressOptions={addressOptions}
            estateId={estateId}
            residentId={residentId}
            onSubmit={handleCreateSubmit}
            onCancel={() => setModalOpen(false)}
            loading={createComplaintStatus}
          />
        </div>
      </Modal>
    </div>
  );
}
