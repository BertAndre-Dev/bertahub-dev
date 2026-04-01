"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Home,
  TrendingUp,
  Plus,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Search,
} from "lucide-react";
import Table from "@/components/tables/list/page";
import {
  getAllEstates,
  createEstate,
  updateEstate,
  activateEstate,
  suspendEstate,
  deleteEstate,
  type EstateData,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import EstateForm from "@/components/super-admin/estate-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

type EstateTableRow = Omit<EstateData, "modules"> & {
  id?: string;
  modules?: string[];
  createdAt?: string | number | Date;
};

export default function EstatePage() {
  const dispatch = useDispatch<AppDispatch>();

  const { allEstates, pagination, loading } = useSelector(
    (state: RootState) => {
      const estateState = state.estate as any;
      const data = estateState.allEstates?.data || [];
      const pagination = estateState.allEstates?.pagination || {};
      return {
        allEstates: Array.isArray(data) ? data : [],
        pagination,
        loading: estateState.loading || false,
      };
    },
  );

  const [open, setOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateTableRow | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch estates on mount
  useEffect(() => {
    dispatch(
      getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }),
    )
      .unwrap()
      .catch(() => {
        toast.error("Failed to fetch estates");
      });
  }, [dispatch]);

  // Refetch on date range changes (only apply when both are selected)
  useEffect(() => {
    const shouldApplyDate = Boolean(startDate && endDate);
    dispatch(
      getAllEstates({
        page: 1,
        limit: Number(pagination?.pageSize) || 10,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch estates"));
  }, [dispatch, startDate, endDate]);

  const handleEstateModal = (estate?: EstateTableRow) => {
    setSelectedEstate(estate || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEstate(null);
  };

  const handleSubmitEstate = async (data: EstateData) => {
    try {
      if (selectedEstate?.id) {
        await dispatch(updateEstate({ id: selectedEstate.id, data })).unwrap();
        toast.success("Estate updated successfully!");
      } else {
        await dispatch(createEstate(data)).unwrap();
        toast.success("Estate created successfully!");
      }
      handleCloseModal();
      await dispatch(
        getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save estate");
    }
  };

  // ✅ Handle Activate / Suspend Estate
  const handleToggleStatus = async (estate: EstateTableRow) => {
    try {
      if (!estate.id) return;
      if (estate.isActive) {
        await dispatch(suspendEstate(estate.id)).unwrap();
        toast.info(`${estate.name} has been suspended.`);
      } else {
        await dispatch(activateEstate(estate.id)).unwrap();
        toast.success(`${estate.name} has been activated.`);
      }
      await dispatch(
        getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update estate status.");
    }
  };

  // ✅ Handle Delete Estate with toast confirmation
  const handleDeleteEstate = async (id?: string, name?: string) => {
    if (!id) return;

    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteEstate(id)).unwrap();
        toast.success(`${name} deleted successfully!`);
        await dispatch(
          getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }),
        ).unwrap();
      },
    });
  };

  const columns = [
        {
      key: "createdAt",
      header: "Created At",
      render: (item: EstateTableRow) =>
        new Date(item.createdAt as string | number | Date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
    },
    { key: "name", header: "Estate Name" },
    { key: "address", header: "Address" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "country", header: "Country" },
    {
      key: "isActive",
      header: "Status",
      render: (item: EstateTableRow) => (
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
      key: "actions",
      header: "Actions",
      render: (item: EstateTableRow) => (
        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEstateModal(item)}
            title="Edit Estate"
            className="cursor-pointer"
          >
            <Edit className="w-4 h-4 text-blue-600 " />
          </Button>

          {/* Activate / Suspend Toggle */}
          {item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item)}
              title="Suspend Estate"
              className="cursor-pointer"
            >
              <PowerOff className="w-4 h-4 text-red-600 " />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item)}
              title="Activate Estate"
              className="cursor-pointer"
            >
              <Power className="w-4 h-4 text-green-600 " />
            </Button>
          )}

          {/* 🗑️ Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEstate(item.id, item.name)}
            title="Delete Estate"
            className="cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-600 " />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Estate Management</h1>
          <p className="text-muted-foreground mt-1">
            Overview of created estates.
          </p>
        </div>

        <Button
          onClick={() => handleEstateModal()}
          className="flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Estate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const estates = allEstates as EstateTableRow[];

          const stats = [
            {
              label: "Total Estates",
              value: estates?.length || 0,
              icon: Building2,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Estates",
              value: estates?.filter((e) => e.isActive)?.length || 0,
              icon: Home,
              color: "bg-[#CCE4DB80]",
            },
            {
              label: "Cities Covered",
              value: new Set(estates.map((e) => e.city)).size || 0,
              icon: Users,
              color: "bg-[#FEE6D480]",
            },
            {
              label: "States",
              value: new Set(estates.map((e) => e.state)).size || 0,
              icon: TrendingUp,
              color: "bg-[#CABDFF80]",
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
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by estate name, address, city etc..."
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Estates Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allEstates}
          emptyMessage={loading ? "Loading estates..." : "No estates found"}
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
          }}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) =>
            dispatch(
              getAllEstates({
                page,
                limit: Number(pagination?.pageSize) || 10,
                startDate: startDate && endDate ? startDate : undefined,
                endDate: startDate && endDate ? endDate : undefined,
              }),
            )
          }
          enableExport
          exportFileName="estates"
          onExportRequest={async () => {
            const shouldApplyDate = Boolean(startDate && endDate);
            const res = await dispatch(
              getAllEstates({
                page: 1,
                limit: 50000,
                startDate: shouldApplyDate ? startDate : undefined,
                endDate: shouldApplyDate ? endDate : undefined,
              }),
            ).unwrap();
            return res?.data ?? [];
          }}
        />
      </Card>

      {/* Estate Form Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EstateForm
            initialData={
              selectedEstate
                ? {
                    name: selectedEstate.name,
                    address: selectedEstate.address,
                    city: selectedEstate.city,
                    state: selectedEstate.state,
                    country: selectedEstate.country,
                    modules: selectedEstate.modules ?? [],
                  }
                : null
            }
            onSubmit={handleSubmitEstate}
          />
        </Modal>
      )}
    </div>
  );
}
