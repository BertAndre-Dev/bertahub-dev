'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "lucide-react";
import {
  getAllEstateMeter,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import AssignMeterForm from "@/components/admin/meter-form/page";

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

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
  vendorData?: VendorData;
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(null);
  const [search, setSearch] = useState("");


  const { allAdminMeters, pagination, loading } = useSelector((state: RootState) => {
    const adminMeterState = state.adminMeter as any;
    return {
      allAdminMeters: adminMeterState?.allAdminMeters?.data || [],
      pagination: adminMeterState?.allAdminMeters?.pagination || {},
      loading:
        adminMeterState.getAllEstateMeter === "isLoading" ||
        adminMeterState.getMeter === "isLoading",
    };
  });

  // ✅ Fetch user and meters initially
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const foundEstateId = userRes?.data?.estateId;

        if (!foundEstateId) {
          toast.warning("No estate found for this user");
        }

        setEstateId(foundEstateId);
        await dispatch(getAllEstateMeter({ estateId: foundEstateId, page: 1, limit: 10, search: search || undefined, })).unwrap();
      } catch (error: any) {
        toast.error(error?.message);
      }
    })();
  }, [dispatch, search]);

  // ✅ This fixes your "Cannot find name 'handleRefresh'" error
  const handleRefresh = async () => {
    if (!estateId) return;
    try {
      await dispatch(getAllEstateMeter({ estateId, page: 1, limit: 10 ,  search: search || undefined,})).unwrap();
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleOpenModal = (meter?: AdminMeterData) => {
    setSelectedMeter(meter || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
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
            item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
            item.isAssigned ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {item.isAssigned ? "Assigned" : "Not Assigned"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Assign Meter",
      render: (item: AdminMeterData) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
            <Link className="w-4 h-4 text-blue-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Meter Management</h1>

      <Card className="p-4">
        <Table
          columns={columns}
          data={allAdminMeters || []}
          emptyMessage={loading ? "Loading estate meters..." : "No meter found."}
          showPagination
          enableSearch
          onSearch={(value) => setSearch(value)}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            if (!estateId) return; // ✅ Correct estate validation

            dispatch(
              getAllEstateMeter({
                estateId, // ✅ Use correct estate ID
                page,     // ✅ Use new page
                limit: Number(pagination?.pageSize) || 10,
              })
            )
              .unwrap()
              .catch(() => toast.error("Failed to change page"));
          }}
        />
      </Card>

      {open && estateId && selectedMeter && (
        <Modal visible={open} onClose={handleCloseModal}>
            <AssignMeterForm
            close={handleCloseModal}
            refresh={handleRefresh}
            meterNumber={selectedMeter.meterNumber} // PASSING IT HERE
            />
        </Modal>
        )}

    </div>
  );
}
