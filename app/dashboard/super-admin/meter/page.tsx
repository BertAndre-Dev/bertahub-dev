"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Trash, Eye } from "lucide-react";
import {
  deleteMeter,
  getAllMeters,
  getMeterByAddressId,
  removeEstateMeter,
} from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter";
import AssignMeterForm from "@/components/super-admin/meter-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { IoSpeedometerOutline } from "react-icons/io5";

/** addressId from list API can be a string or populated object with id */
type AddressIdInput = string | { id: string; data?: Record<string, unknown> };

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: AddressIdInput;
  vendorData?: any;
}

function toAddressIdString(addressId: AddressIdInput | null | undefined): string | null {
  if (addressId == null) return null;
  if (typeof addressId === "string") return addressId;
  if (typeof addressId === "object" && addressId?.id) return addressId.id;
  return null;
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [assignMeter, setAssignMeter] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsAddressId, setDetailsAddressId] = useState<string | null>(null);

  const { allSuperAdminMeters, pagination, loading, meterDetails, detailsLoading } = useSelector(
    (state: RootState) => {
      const superAdminMeter = state.superAdminMeter as any;
      return {
        allSuperAdminMeters: superAdminMeter?.allSuperAdminMeter?.data || [],
        pagination: superAdminMeter?.allSuperAdminMeter?.pagination || {},
        loading: superAdminMeter?.getAllMetersState === "isLoading",
        meterDetails: superAdminMeter?.superAdminMeter ?? null,
        detailsLoading: superAdminMeter?.getMeterByAddressIdState === "isLoading",
      };
    },
  );

  // Fetch meters on mount
  useEffect(() => {
    const fetchMeters = async () => {
      try {
        await dispatch(
          getAllMeters({ page: 1, limit: 10, search: searchQuery || undefined }),
        ).unwrap();
      } catch (error: any) {
        console.error("Failed to fetch meters:", error);
        toast.error("Failed to fetch meters");
      }
    };
    fetchMeters();
  }, [dispatch, searchQuery]);

  const handleRefresh = async () => {
    try {
      await dispatch(
        getAllMeters({
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
          search: searchQuery || undefined,
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

  const handleViewDetails = (meter: AdminMeterData) => {
    const addressIdStr = toAddressIdString(meter.addressId);
    if (!addressIdStr) {
      toast.warning("No address ID for this meter");
      return;
    }
    setDetailsAddressId(addressIdStr);
    setDetailsModalOpen(true);
    dispatch(getMeterByAddressId(addressIdStr)).catch((err: any) => {
      toast.error(err?.message ?? "Failed to load meter details");
    });
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsAddressId(null);
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
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1"
            onClick={() => handleViewDetails(item)}
            title="View details"
          >
            <Eye className="w-4 h-4" />
            View details
          </Button>
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
      <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Meter Management</h1>
        <p className="text-muted-foreground mt-1">Overview of meters</p>
        {/* Add Meter button can open a modal for adding meter if implemented */}
        <Button
          onClick={handleAssignMeter}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Meter
        </Button>
      </div>

      {/* stats cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const meters = allSuperAdminMeters as AdminMeterData[];

          const stats = [
            {
              label: "Total Estates",
              value: meters?.length || 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Estates",
              value:
                meters?.filter((meter: AdminMeterData) => meter.isActive)
                  ?.length || 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#CCE4DB80]",
            },
          ];

          return stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
      </div>

      <div className="bg-white p-4 rounded-lg">
        <div className="relative w-full max-w-sm flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by meter number."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                  dispatch(
                    getAllMeters({
                      page: 1,
                      limit: Number(pagination?.pageSize) || 10,
                      search: searchInput || undefined,
                    }),
                  );
                }
                if (e.key === "Escape") {
                  setSearchInput("");
                  setSearchQuery("");
                  dispatch(
                    getAllMeters({
                      page: 1,
                      limit: Number(pagination?.pageSize) || 10,
                      search: undefined,
                    }),
                  );
                }
              }}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {searchInput.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery(searchInput);
                dispatch(
                  getAllMeters({
                    page: 1,
                    limit: Number(pagination?.pageSize) || 10,
                    search: searchInput || undefined,
                  }),
                );
              }}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition"
            >
              Search
            </button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={allSuperAdminMeters}
          showPagination
          onSearch={(value) => setSearchInput(value)}
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
          enableExport
          exportFileName="meters"
          onExportRequest={async () => {
            const res = await dispatch(
              getAllMeters({ page: 1, limit: 50000 }),
            ).unwrap();
            return res?.data ?? [];
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

      {/* View details modal */}
      <Modal visible={detailsModalOpen} onClose={handleCloseDetailsModal}>
        <div className="space-y-4 p-4 min-w-[320px] max-w-lg">
          <h2 className="text-lg font-semibold">Meter details</h2>
          {detailsLoading ? (
            <p className="text-muted-foreground py-6 text-center">Loading…</p>
          ) : meterDetails ? (
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Meter number</dt>
                <dd className="font-medium">{meterDetails.meterNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      meterDetails.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {meterDetails.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      meterDetails.isAssigned ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {meterDetails.isAssigned ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
              {meterDetails.lastCredit != null && (
                <div>
                  <dt className="text-muted-foreground">Last credit</dt>
                  <dd className="font-medium">{meterDetails.lastCredit}</dd>
                </div>
              )}
              {meterDetails.createdAt && (
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {new Date(meterDetails.createdAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {meterDetails.vendorData && typeof meterDetails.vendorData === "object" && (
                <>
                  <div>
                    <dt className="text-muted-foreground">Vendor</dt>
                    <dd className="font-medium">{meterDetails.vendorData.name ?? "—"}</dd>
                  </div>
                  {meterDetails.vendorData.utilityName && (
                    <div>
                      <dt className="text-muted-foreground">Utility</dt>
                      <dd className="font-medium">{meterDetails.vendorData.utilityName}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          ) : detailsAddressId ? (
            <p className="text-muted-foreground py-4">Could not load meter details.</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
