"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import SwitchAddress from "@/components/resident/switch-address/page";
import { VisitorPageHeader } from "@/components/resident/visitor-management/VisitorPageHeader";
import { VisitorsTableCard } from "@/components/resident/visitor-management/VisitorsTableCard";
import { VisitorUpsertModal } from "@/components/resident/visitor-management/VisitorUpsertModal";
import { DeleteVisitorModal } from "@/components/resident/visitor-management/DeleteVisitorModal";
import { VisitorViewModal } from "@/components/resident/visitor-management/VisitorViewModal";
import type { ResidentVisitorData } from "@/components/resident/visitor-management/types";
import {
  getVisitorsByResident,
  getVisitorById,
  deleteVisitor,
} from "@/redux/slice/resident/visitor/visitor";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  normalizeAddresses,
  toAddressIdString,
  type AddressOption,
} from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

export default function VisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");

  const [visitors, setVisitors] = useState<ResidentVisitorData[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [viewingVisitor, setViewingVisitor] = useState<ResidentVisitorData | null>(
    null,
  );
  const [visitorToDelete, setVisitorToDelete] = useState<ResidentVisitorData | null>(
    null,
  );

  // User meta
  const [userId, setUserId] = useState<string>("");
  const [estateId, setEstateId] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch user and visitors
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        if (!user) {
          toast.warning("No signed in user found");
          setLoading(false);
          return;
        }

        const uId =
          ((user.id as string | undefined) ??
            (user._id as string | undefined) ??
            "") ||
          "";

        const rawEstate =
          (user.estateId as
            | string
            | { id?: string; _id?: string }
            | undefined) ??
          (user.estate as { id?: string; _id?: string } | undefined);
        let eId = "";
        if (typeof rawEstate === "string") {
          eId = rawEstate;
        } else if (rawEstate && typeof rawEstate === "object") {
          eId = rawEstate.id ?? rawEstate._id ?? "";
        }
        const addresses = normalizeAddresses(user);
        const firstId = addresses.length > 0 ? addresses[0].id : null;

        setUserId(uId);
        setEstateId(eId);
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);

        if (!uId) {
          toast.warning("No user ID found");
          setLoading(false);
          return;
        }

        // Get visitors for this resident
        const visitorsRes = await dispatch(
          getVisitorsByResident({ residentId: uId, page: 1, limit: 10 }),
        ).unwrap();
        setVisitors(visitorsRes?.data || []);
        setPagination(visitorsRes?.pagination || {});
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch visitors");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const refreshVisitors = async () => {
    if (!userId) return;
    try {
      const shouldApplyDate = Boolean(startDate && endDate);
      const visitorsRes = await dispatch(
        getVisitorsByResident({
          residentId: userId,
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
      setVisitors(visitorsRes?.data || []);
      setPagination(visitorsRes?.pagination || {});
    } catch (err: any) {
      console.error("Refresh visitors failed:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const shouldApplyDate = Boolean(startDate && endDate);
    setLoading(true);
    dispatch(
      getVisitorsByResident({
        residentId: userId,
        page: 1,
        limit: pagination?.limit || 10,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .then((visitorsRes) => {
        setVisitors(visitorsRes?.data || []);
        setPagination(visitorsRes?.pagination || {});
      })
      .catch(() => toast.error("Failed to fetch visitors"))
      .finally(() => setLoading(false));
  }, [dispatch, userId, startDate, endDate]);

  const handleOpenModal = (
    mode: "create" | "edit" | "view",
    visitorId?: string,
  ) => {
    setMode(mode);
    setSelectedVisitorId(visitorId || null);
    if (mode === "view" && visitorId) {
      loadVisitorForView(visitorId);
    }
    if (mode === "create" || mode === "edit") {
      setOpen(true);
    } else {
      setViewModalOpen(true);
    }
  };

  const loadVisitorForView = async (id: string) => {
    try {
      const res = await dispatch(getVisitorById(id)).unwrap();
      // API response has flat structure, not nested visitor object
      const visitorData = res?.data?.visitor || res?.data;
      setViewingVisitor(visitorData || null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load visitor details");
    }
  };

  const handleCloseModal = () => {
    setSelectedVisitorId(null);
    setOpen(false);
    setViewModalOpen(false);
    setViewingVisitor(null);
  };

  const handleOpenDeleteModal = (
    visitor: ResidentVisitorData,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    setVisitorToDelete(visitor);
  };

  const handleCloseDeleteModal = () => setVisitorToDelete(null);

  const handleConfirmDelete = async () => {
    if (!visitorToDelete) return;
    try {
      await dispatch(deleteVisitor(visitorToDelete.id)).unwrap();
      toast.success("Visitor deleted successfully.");
      setVisitorToDelete(null);
      await refreshVisitors();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete visitor");
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!userId) return;
    try {
      const shouldApplyDate = Boolean(startDate && endDate);
      const visitorsRes = await dispatch(
        getVisitorsByResident({
          residentId: userId,
          page: newPage,
          limit: pagination?.limit || 10,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
      setVisitors(visitorsRes?.data || []);
      setPagination(visitorsRes?.pagination || {});
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch visitors");
    }
  };

  // When owner has multiple addresses, show only visitors for the selected address
  const displayedVisitors = useMemo(() => {
    if (addressOptions.length <= 1 || !selectedAddressId) return visitors;
    return visitors.filter(
      (v) => toAddressIdString(v.addressId) === selectedAddressId,
    );
  }, [visitors, addressOptions.length, selectedAddressId]);

  // For form: pass addressId as string or { id, data: { block, unit } } to match VisitorFormProps
  const selectedAddressForForm = useMemo(():
    | string
    | { id: string; data: { block: string; unit: string } } => {
    if (!selectedAddressId) return "";
    const opt = addressOptions.find((a) => a.id === selectedAddressId);
    if (!opt) return selectedAddressId;
    const d = opt.data ?? {};
    return {
      id: opt.id,
      data: {
        block: d.block ?? "",
        unit: d.unit ?? d.flat ?? "",
      },
    };
  }, [addressOptions, selectedAddressId]);

  return (
    <div className="space-y-6">
      <VisitorPageHeader onAddVisitor={() => handleOpenModal("create")} />

      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={setSelectedAddressId}
      />

      <VisitorsTableCard
        visitors={displayedVisitors || []}
        loading={loading}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
        paginationInfo={{
          total:
            addressOptions.length > 1
              ? displayedVisitors.length
              : pagination?.total || visitors.length || 0,
          current: Number(pagination?.page) || 1,
          pageSize: Number(pagination?.limit) || 10,
        }}
        onPageChange={handlePageChange}
        onExportRequest={
          userId
            ? async () => {
                const shouldApplyDate = Boolean(startDate && endDate);
                const res = await dispatch(
                  getVisitorsByResident({
                    residentId: userId,
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
        onView={(id) => handleOpenModal("view", id)}
        onEdit={(id) => handleOpenModal("edit", id)}
        onDelete={(visitor) => setVisitorToDelete(visitor)}
      />

      <VisitorUpsertModal
        open={open && (mode === "create" || mode === "edit")}
        mode={mode === "edit" ? "edit" : "create"}
        selectedVisitorId={selectedVisitorId}
        residentId={userId}
        estateId={estateId}
        addressId={selectedAddressForForm ?? ""}
        onSubmitSuccess={refreshVisitors}
        onClose={handleCloseModal}
      />

      <DeleteVisitorModal
        visitor={visitorToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <VisitorViewModal
        open={viewModalOpen}
        visitor={viewingVisitor}
        onClose={handleCloseModal}
      />
    </div>
  );
}
