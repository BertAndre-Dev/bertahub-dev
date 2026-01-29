"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Plus, Trash } from "lucide-react";
import {
  deleteMeter,
  getAllMeters,
  removeEstateMeter,
} from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter";
import AssignMeterForm from "@/components/super-admin/meter-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: string;
  vendorData?: any;
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [assignMeter, setAssignMeter] = useState(false);
  const [search, setSearch] = useState("");

  const { allSuperAdminMeters, pagination, loading } = useSelector(
    (state: RootState) => {
      const superAdminMeter = state.superAdminMeter as any;
      return {
        allSuperAdminMeters: superAdminMeter?.allSuperAdminMeter?.data || [],
        pagination: superAdminMeter?.allSuperAdminMeter?.pagination || {},
        loading: superAdminMeter?.getAllMetersState === "isLoading",
      };
    },
  );

  // Fetch meters on mount
  useEffect(() => {
    const fetchMeters = async () => {
      try {
        await dispatch(
          getAllMeters({ page: 1, limit: 10, search: search || undefined }),
        ).unwrap();
      } catch (error: any) {
        console.error("Failed to fetch meters:", error);
        toast.error("Failed to fetch meters");
      }
    };
    fetchMeters();
  }, [dispatch, search]);

  const handleRefresh = async () => {
    try {
      await dispatch(
        getAllMeters({
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
          search: search || undefined,
        }),
      ).unwrap();
    } catch (error: any) {
      toast.error("Failed to refresh meter list");
    }
  };

  const handleOpenRemoveModal = (meter: AdminMeterData) => {
    setSelectedMeter(meter);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
  };

  const handleAssignMeter = () => {
    setAssignMeter((prev) => !prev);
  };

  const handleRemoveMeter = async () => {
    if (!selectedMeter) return;

    try {
      // Pass meterNumber and estateId as expected by removeEstateMeter thunk
      await dispatch(
        removeEstateMeter({
          meterNumber: selectedMeter.meterNumber,
          estateId: selectedMeter.estateId || "",
        }),
      ).unwrap();

      toast.success("Meter removed successfully");
      handleRefresh();
      handleCloseModal();
    } catch (error: any) {
      console.error("Failed to remove meter:", error);
      toast.error(error?.message || "Failed to remove meter");
    }
  };

  const handleDeleteMeter = async (meterId: string) => {
    if (!meterId) {
      toast.error("Meter ID is missing");
      return;
    }

    confirmDeleteToast({
      name: "this meter",
      onConfirm: async () => {
        const response = await dispatch(deleteMeter(meterId)).unwrap();
        toast.success(response?.message || "Meter deleted successfully");
        handleRefresh();
      },
    });
  };

  const columns = [
    { key: "createdAt", header: "Created Date" },
    { key: "meterNumber", header: "Meter Number" },
    {
      key: "isActive",
      header: "Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "isAssigned",
      header: "Assigned Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isAssigned
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isAssigned ? "Assigned" : "Not Assigned"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (item: AdminMeterData) => (
        <div className="flex items-center gap-2">
          {/* <Button variant="destructive" size="sm" onClick={() => handleOpenRemoveModal(item)}>
            <Trash className="w-4 h-4 text-white" />
          </Button> */}

          {/* Delete permanently */}
          <Button
            variant="destructive"
            className="cursor-pointer"
            size="sm"
            onClick={() => handleDeleteMeter(item.id!)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Meter Management</h1>
        {/* Add Meter button can open a modal for adding meter if implemented */}
        <Button
          onClick={handleAssignMeter}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Meter
        </Button>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={allSuperAdminMeters}
          showPagination
          enableSearch
          onSearch={(value) => setSearch(value)}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            dispatch(
              getAllMeters({ page, limit: Number(pagination?.pageSize) || 10 }),
            );
          }}
        />
      </Card>

      {open && selectedMeter && (
        <Modal visible={open} onClose={handleCloseModal}>
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-semibold">Remove Meter</h2>
            <p>
              Are you sure you want to remove meter{" "}
              <strong>{selectedMeter.meterNumber}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveMeter}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {assignMeter && (
        <Modal visible={assignMeter} onClose={handleAssignMeter}>
          <AssignMeterForm close={handleAssignMeter} refresh={handleRefresh} />
        </Modal>
      )}
    </div>
  );
}
